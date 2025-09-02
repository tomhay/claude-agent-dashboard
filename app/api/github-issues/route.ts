import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const project = searchParams.get('project')
    
    // Project to GitHub repo mapping
    const projectRepos: Record<string, { owner: string; repo: string }> = {
      'AIBL': { owner: 'BaliLove', repo: 'chat-langchain' },
      'BL2': { owner: 'BaliLove', repo: 'BaliLove_v2.0' },
      'Blxero': { owner: 'BaliLove', repo: 'x' },
      'Upify': { owner: 'tomhay', repo: 'upify' },
    }

    let allIssues: any[] = []

    if (project && projectRepos[project]) {
      // Get issues for specific project
      const { owner, repo } = projectRepos[project]
      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: 50
      })
      
      allIssues = issues.map(issue => ({
        ...issue,
        project: project,
        repoName: repo
      }))
    } else {
      // Get ALL issues across all projects with pagination
      const issuePromises = Object.entries(projectRepos).map(async ([projectName, { owner, repo }]) => {
        try {
          let projectIssues: any[] = []
          let page = 1
          const perPage = 100
          
          console.log(`Fetching ALL issues for ${projectName}`)
          
          while (true) {
            const { data: pageIssues } = await octokit.rest.issues.listForRepo({
              owner,
              repo,
              state: 'all', // Get both open and closed issues
              sort: 'updated',
              direction: 'desc',
              per_page: perPage,
              page
            })
            
            if (pageIssues.length === 0) break
            
            projectIssues = projectIssues.concat(pageIssues)
            console.log(`${projectName} page ${page}: ${pageIssues.length} issues (total: ${projectIssues.length})`)
            
            if (pageIssues.length < perPage) break // Last page
            page++
            
            // Safety limit
            if (page > 50) break
          }
          
          return projectIssues.map(issue => ({
            ...issue,
            project: projectName,
            repoName: repo
          }))
        } catch (error) {
          console.error(`Failed to fetch issues for ${projectName}:`, error)
          return []
        }
      })

      const issueArrays = await Promise.all(issuePromises)
      allIssues = issueArrays.flat()
      console.log(`Total issues fetched across all projects: ${allIssues.length}`)
    }

    // Get analytics data for enrichment
    let analyticsMap = new Map()
    try {
      const analyticsResponse = await fetch(`${req.url.split('/api')[0]}/api/issue-tracking`)
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        analyticsData.issueTracking.forEach((item: any) => {
          analyticsMap.set(`${item.project}-${item.issue.number}`, item)
        })
      }
    } catch (error) {
      console.log('Analytics enrichment failed, continuing without:', error)
    }

    // Transform issues for our dashboard with manager analytics
    const transformedIssues = allIssues.map(issue => {
      const issueKey = `${issue.project}-${issue.number}`
      const analytics = analyticsMap.get(issueKey)
      
      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body,
        project: issue.project,
        repoName: issue.repoName,
        labels: issue.labels.map((label: any) => label.name),
        assignee: issue.assignee?.login || null,
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        html_url: issue.html_url,
        user: {
          login: issue.user.login,
          avatar_url: issue.user.avatar_url
        },
        // Workflow stage based on labels
        stage: getWorkflowStage(issue.labels.map((l: any) => l.name)),
        // Agent assignment
        assignedAgent: getAssignedAgent(issue.labels.map((l: any) => l.name)),
        
        // Manager Analytics Integration
        agentEstimate: analytics?.agentEstimate || null,
        commitReality: analytics?.reality || null,
        managerStatus: analytics?.tracking?.status || 'unknown',
        completionPrediction: analytics?.tracking?.completionPrediction || null,
        coachingInsights: analytics?.tracking?.coachingInsights || [],
        managerFlags: analytics?.tracking?.managerFlags || [],
        commitCount: analytics?.commits?.length || 0,
        lastCommitDate: analytics?.commits?.[0]?.date || null
      }
    })

    return NextResponse.json({
      success: true,
      issues: transformedIssues,
      total: transformedIssues.length
    })

  } catch (error) {
    console.error('Failed to fetch GitHub issues:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to determine workflow stage from labels
function getWorkflowStage(labels: string[]): string {
  if (labels.includes('in-development') || labels.includes('development')) return 'development'
  if (labels.includes('in-review') || labels.includes('review')) return 'review'
  if (labels.includes('planning') || labels.includes('needs-planning')) return 'planning'
  if (labels.includes('ready-for-deployment') || labels.includes('deploy')) return 'deploy'
  return 'backlog'
}

// Helper function to check if issue is assigned to an agent
function getAssignedAgent(labels: string[]): string | null {
  const agentLabel = labels.find(label => label.startsWith('agent:'))
  return agentLabel ? agentLabel.replace('agent:', '') : null
}

export async function POST(req: NextRequest) {
  try {
    const { action, issueId, projectName, agentId, labels } = await req.json()
    
    if (action === 'assign-agent') {
      // Add agent label to issue
      const projectRepos: Record<string, { owner: string; repo: string }> = {
        'AIBL': { owner: 'BaliLove', repo: 'chat-langchain' },
        'BL2': { owner: 'BaliLove', repo: 'BaliLove_v2.0' },
        'Blxero': { owner: 'BaliLove', repo: 'x' },
        'Upify': { owner: 'tomhay', repo: 'upify' },
      }

      const repo = projectRepos[projectName]
      if (!repo) {
        throw new Error('Invalid project name')
      }

      // Get current issue to find issue number
      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner: repo.owner,
        repo: repo.repo,
        state: 'all'
      })
      
      const issue = issues.find(i => i.id === issueId)
      if (!issue) {
        throw new Error('Issue not found')
      }

      // Remove existing agent labels and add new one
      const currentLabels = issue.labels.map((l: any) => l.name)
      const filteredLabels = currentLabels.filter((l: string) => !l.startsWith('agent:'))
      const newLabels = [...filteredLabels, `agent:${agentId}`, 'in-development']

      await octokit.rest.issues.update({
        owner: repo.owner,
        repo: repo.repo,
        issue_number: issue.number,
        labels: newLabels
      })

      return NextResponse.json({ success: true, message: 'Agent assigned successfully' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Failed to update GitHub issue:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}