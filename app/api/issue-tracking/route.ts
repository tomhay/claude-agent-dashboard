import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { getGitHubIssues, setGitHubIssues, getGitHubCommits, setGitHubCommits } from '../../../lib/redis'

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
      'BaliLove': { owner: 'BaliLove', repo: 'balilove-website' },
    }

    let allIssueTracking: any[] = []

    if (project && projectRepos[project]) {
      const { owner, repo } = projectRepos[project]
      const trackingData = await analyzeIssueCommitCorrelation(owner, repo, project)
      allIssueTracking = trackingData
    } else {
      // Analyze all projects
      const analysisPromises = Object.entries(projectRepos).map(async ([projectName, { owner, repo }]) => {
        try {
          return await analyzeIssueCommitCorrelation(owner, repo, projectName)
        } catch (error) {
          console.error(`Failed to analyze ${projectName}:`, error)
          return []
        }
      })

      const results = await Promise.all(analysisPromises)
      allIssueTracking = results.flat()
    }

    // Generate manager alerts
    const managerAlerts = generateManagerAlerts(allIssueTracking)

    return NextResponse.json({
      success: true,
      issueTracking: allIssueTracking,
      managerAlerts,
      summary: {
        totalIssues: allIssueTracking.length,
        onTrack: allIssueTracking.filter(i => i.status === 'on-track').length,
        atRisk: allIssueTracking.filter(i => i.status === 'at-risk').length,
        overdue: allIssueTracking.filter(i => i.status === 'overdue').length,
        avgAccuracy: calculateAverageEstimationAccuracy(allIssueTracking)
      }
    })

  } catch (error) {
    console.error('Failed to analyze issue tracking:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function analyzeIssueCommitCorrelation(owner: string, repo: string, project: string) {
  // Use Redis for caching instead of file system
  let allIssues: any[] = []
  let commits: any[] = []

  // Try to get cached data from Redis
  const cachedIssues = await getGitHubIssues(project)
  const cachedCommits = await getGitHubCommits(project)

  if (cachedIssues) {
    console.log(`Using Redis cached issues for ${project}`)
    allIssues = cachedIssues
  } else {
    console.log(`Fetching ALL issues for ${project} (${owner}/${repo}) - cache miss or expired`)
    
    // Get ALL issues using pagination (no limits)
    let page = 1
    const perPage = 100 // GitHub API max
    
    while (true) {
      const { data: pageIssues } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'open', // Only get open issues for project management
        sort: 'updated', 
        direction: 'desc',
        per_page: perPage,
        page
      })
      
      if (pageIssues.length === 0) break
      
      allIssues = allIssues.concat(pageIssues)
      console.log(`Fetched page ${page}: ${pageIssues.length} issues (total: ${allIssues.length})`)
      
      if (pageIssues.length < perPage) break // Last page
      page++
      
      // Safety limit to prevent infinite loops
      if (page > 50) {
        console.log(`Safety limit reached at page ${page} - stopping pagination`)
        break
      }
    }
    
    console.log(`Total issues fetched for ${project}: ${allIssues.length}`)
    
    // Cache to Redis
    await setGitHubIssues(project, allIssues)
  }

  // Get recent commits (with Redis caching)
  if (cachedCommits) {
    console.log(`Using Redis cached commits for ${project}`)
    commits = cachedCommits
  } else {
    console.log(`Fetching commits for ${project}`)
    
    // Get recent commits (last 30 days for active correlation)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: recentCommits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      since: thirtyDaysAgo.toISOString(),
      per_page: 100
    })
    
    commits = recentCommits
    
    // Cache to Redis
    await setGitHubCommits(project, commits)
  }

  const issueTrackingData = await Promise.all(
    allIssues.map(async (issue) => {
      // Find commits that reference this issue
      const relatedCommits = commits.filter(commit => 
        commit.commit.message.includes(`#${issue.number}`) ||
        commit.commit.message.includes(`fixes #${issue.number}`) ||
        commit.commit.message.includes(`closes #${issue.number}`) ||
        commit.commit.message.toLowerCase().includes(issue.title.toLowerCase().substring(0, 20))
      )

      // Get detailed commit data for analysis
      const commitDetails = await Promise.all(
        relatedCommits.slice(0, 10).map(async (commit) => {
          try {
            const { data: details } = await octokit.rest.repos.getCommit({
              owner,
              repo,
              ref: commit.sha
            })
            return {
              sha: commit.sha,
              message: commit.commit.message,
              date: new Date(commit.commit.author?.date || ''),
              author: commit.author?.login || commit.commit.author?.name,
              additions: details.stats?.additions || 0,
              deletions: details.stats?.deletions || 0,
              filesChanged: details.files?.length || 0,
              url: commit.html_url
            }
          } catch (error) {
            return null
          }
        })
      )

      const validCommits = commitDetails.filter(Boolean)

      // Agent-based estimation of issue
      const agentEstimate = await generateAgentEstimate(issue)
      
      // Calculate reality vs estimate
      const reality = calculateIssueReality(issue, validCommits)
      
      return {
        project,
        issue: {
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
          closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
          assignee: issue.assignee?.login || null,
          labels: issue.labels.map((l: any) => l.name),
          url: issue.html_url
        },
        commits: validCommits,
        agentEstimate,
        reality,
        tracking: {
          status: determineIssueStatus(agentEstimate, reality, issue),
          completionPrediction: predictCompletion(agentEstimate, reality, validCommits),
          coachingInsights: generateCoachingInsights(validCommits, agentEstimate, reality),
          managerFlags: generateManagerFlags(agentEstimate, reality, issue, validCommits)
        }
      }
    })
  )

  return issueTrackingData.filter(data => data.commits.length > 0 || data.issue.state === 'open')
}

async function generateAgentEstimate(issue: any) {
  // Agent analysis of issue complexity and estimation
  const complexity = analyzeIssueComplexity(issue.title, issue.body, issue.labels?.map((l: any) => l.name) || [])
  
  // Base estimates from historical patterns
  const baseEstimates = {
    'simple': { hours: 4, confidence: 0.8 },
    'medium': { hours: 16, confidence: 0.6 },
    'complex': { hours: 40, confidence: 0.4 }
  }
  
  const estimate = baseEstimates[complexity.level] || baseEstimates['medium']
  
  return {
    estimatedHours: estimate.hours * complexity.multiplier,
    confidence: estimate.confidence * complexity.confidence,
    reasoning: complexity.reasoning,
    complexity: complexity.level,
    factors: complexity.factors
  }
}

function analyzeIssueComplexity(title: string, body: string, labels: string[]) {
  let score = 0
  let multiplier = 1
  let confidence = 0.7
  const factors: string[] = []
  const reasoning: string[] = []

  // Title analysis
  if (title.toLowerCase().includes('bug')) {
    score += 1
    factors.push('Bug fix')
    reasoning.push('Bug fixes typically require investigation and testing')
  }
  if (title.toLowerCase().includes('feat') || title.toLowerCase().includes('feature')) {
    score += 3
    factors.push('New feature')
    reasoning.push('New features require design, implementation, and testing')
  }
  if (title.toLowerCase().includes('refactor')) {
    score += 2
    factors.push('Refactoring')
    reasoning.push('Refactoring requires careful analysis to avoid breaking changes')
  }

  // Body analysis
  if (body && body.length > 500) {
    score += 1
    factors.push('Detailed description')
    reasoning.push('Detailed requirements suggest complexity')
  }
  if (body && body.includes('TODO') || body?.includes('- [ ]')) {
    score += 1
    factors.push('Multiple tasks')
    reasoning.push('Checklist items indicate multiple work streams')
  }
  if (body && (body.includes('API') || body.includes('database') || body.includes('integration'))) {
    score += 2
    factors.push('System integration')
    reasoning.push('API and database work requires coordination across systems')
  }

  // Label analysis
  if (labels.includes('enhancement')) {
    score += 2
    factors.push('Enhancement')
  }
  if (labels.includes('documentation')) {
    score -= 1
    factors.push('Documentation')
  }
  if (labels.includes('urgent') || labels.includes('critical')) {
    multiplier *= 1.5
    factors.push('Urgent priority')
    reasoning.push('Urgent issues often require rapid iteration')
  }

  // Determine complexity level
  let level: 'simple' | 'medium' | 'complex'
  if (score <= 2) {
    level = 'simple'
  } else if (score <= 5) {
    level = 'medium'
  } else {
    level = 'complex'
  }

  return {
    level,
    score,
    multiplier,
    confidence,
    factors,
    reasoning
  }
}

function calculateIssueReality(issue: any, commits: any[]) {
  if (commits.length === 0) {
    return {
      hasStarted: false,
      daysWorked: 0,
      totalChanges: 0,
      velocity: 0,
      pattern: 'no-activity'
    }
  }

  const sortedCommits = commits.sort((a, b) => a.date.getTime() - b.date.getTime())
  const firstCommit = sortedCommits[0]
  const lastCommit = sortedCommits[sortedCommits.length - 1]
  
  const now = new Date()
  const issueCreated = new Date(issue.created_at)
  const firstCommitDate = firstCommit.date
  const lastCommitDate = lastCommit.date

  // Calculate time metrics
  const daysFromIssueToFirstCommit = Math.floor((firstCommitDate.getTime() - issueCreated.getTime()) / (1000 * 60 * 60 * 24))
  const daysWorked = Math.floor((lastCommitDate.getTime() - firstCommitDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysSinceLastCommit = Math.floor((now.getTime() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Calculate code metrics
  const totalChanges = commits.reduce((sum, c) => sum + c.additions + c.deletions, 0)
  const avgCommitSize = totalChanges / commits.length
  const velocity = commits.length / Math.max(daysWorked, 1) // commits per day

  // Determine work pattern
  let pattern: string
  if (daysSinceLastCommit > 7) {
    pattern = 'stale'
  } else if (velocity > 2) {
    pattern = 'high-velocity'
  } else if (velocity < 0.2) {
    pattern = 'slow-progress'
  } else {
    pattern = 'steady'
  }

  return {
    hasStarted: true,
    daysFromIssueToFirstCommit,
    daysWorked,
    daysSinceLastCommit,
    totalChanges,
    avgCommitSize,
    velocity,
    commitCount: commits.length,
    pattern,
    firstCommitDate,
    lastCommitDate
  }
}

function determineIssueStatus(agentEstimate: any, reality: any, issue: any): 'on-track' | 'at-risk' | 'overdue' | 'not-started' {
  if (!reality.hasStarted) {
    const daysSinceCreated = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceCreated > 3 ? 'at-risk' : 'not-started'
  }

  const estimatedDays = agentEstimate.estimatedHours / 8 // 8 hours per day
  const actualDaysWorked = reality.daysWorked
  
  if (issue.state === 'closed') {
    return actualDaysWorked <= estimatedDays * 1.2 ? 'on-track' : 'overdue'
  }

  // For open issues, predict based on progress
  if (reality.daysSinceLastCommit > 7) {
    return 'at-risk'
  }
  
  if (actualDaysWorked > estimatedDays * 1.5) {
    return 'overdue'
  }
  
  if (reality.velocity < 0.2) {
    return 'at-risk'
  }

  return 'on-track'
}

function predictCompletion(agentEstimate: any, reality: any, commits: any[]) {
  if (!reality.hasStarted) {
    const estimatedDays = Math.ceil(agentEstimate.estimatedHours / 8)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + estimatedDays + 3) // +3 buffer for start delay
    return {
      predictedDate: futureDate,
      confidence: 0.3,
      method: 'agent-estimate-only'
    }
  }

  // Use actual velocity to predict remaining work
  if (commits.length >= 3 && reality.velocity > 0) {
    // Estimate remaining work based on commit patterns
    const avgCommitSize = reality.totalChanges / commits.length
    const estimatedRemainingCommits = Math.max(1, agentEstimate.estimatedHours * 10 / avgCommitSize) // Rough heuristic
    
    const remainingDays = Math.ceil(estimatedRemainingCommits / reality.velocity)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + remainingDays)
    
    return {
      predictedDate: futureDate,
      confidence: Math.min(0.8, 0.3 + (commits.length * 0.1)), // More commits = higher confidence
      method: 'velocity-based',
      remainingCommitsEstimate: estimatedRemainingCommits
    }
  }

  // Fallback to agent estimate adjusted by actual progress
  const progressRatio = reality.daysWorked / (agentEstimate.estimatedHours / 8)
  const adjustedEstimate = agentEstimate.estimatedHours / Math.max(progressRatio, 0.1)
  const remainingDays = Math.ceil((adjustedEstimate / 8) - reality.daysWorked)
  
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + Math.max(1, remainingDays))
  
  return {
    predictedDate: futureDate,
    confidence: 0.5,
    method: 'progress-adjusted',
    adjustedEstimateHours: adjustedEstimate
  }
}

function generateCoachingInsights(commits: any[], agentEstimate: any, reality: any): string[] {
  const insights: string[] = []

  if (reality.avgCommitSize > 500) {
    insights.push("🎯 Consider smaller, more frequent commits for easier review and debugging")
  }

  if (reality.velocity < 0.3) {
    insights.push("⚡ Low commit frequency - consider daily commit goals or breaking down tasks")
  }

  if (reality.daysSinceLastCommit > 3) {
    insights.push("📅 No recent commits - check for blockers or need for support")
  }

  if (reality.velocity > 3) {
    insights.push("🚀 High velocity - ensure adequate testing and code review")
  }

  if (commits.length > 20) {
    insights.push("🔄 Many commits on single issue - consider if scope is too large")
  }

  return insights
}

function generateManagerFlags(agentEstimate: any, reality: any, issue: any, commits: any[]): string[] {
  const flags: string[] = []

  // Time-based flags
  const daysSinceCreated = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysSinceCreated > 14 && issue.state === 'open') {
    flags.push(`🚨 Issue open for ${daysSinceCreated} days - needs attention`)
  }

  if (reality.hasStarted && reality.daysSinceLastCommit > 7) {
    flags.push(`⏰ No commits for ${reality.daysSinceLastCommit} days - potential blocker`)
  }

  // Estimation accuracy flags
  const estimatedDays = agentEstimate.estimatedHours / 8
  if (reality.daysWorked > estimatedDays * 2) {
    flags.push(`📈 Taking 2x longer than estimated - reassess scope or provide support`)
  }

  // Quality flags
  if (commits.length > 30) {
    flags.push(`🔄 ${commits.length} commits - consider if issue scope is too large`)
  }

  if (reality.avgCommitSize > 1000) {
    flags.push(`📦 Large commits (${Math.round(reality.avgCommitSize)} lines avg) - review practice`)
  }

  return flags
}

function generateManagerAlerts(allTracking: any[]) {
  const today = new Date().toDateString()
  
  const alerts = {
    critical: [] as string[],
    attention: [] as string[],
    positive: [] as string[]
  }

  // Critical alerts
  const staleIssues = allTracking.filter(t => t.tracking.status === 'at-risk' && t.reality.daysSinceLastCommit > 7)
  const overdueIssues = allTracking.filter(t => t.tracking.status === 'overdue')
  
  if (staleIssues.length > 0) {
    alerts.critical.push(`🚨 ${staleIssues.length} issues stale for 7+ days`)
  }
  
  if (overdueIssues.length > 0) {
    alerts.critical.push(`⏰ ${overdueIssues.length} issues significantly overdue`)
  }

  // Attention alerts
  const longRunningIssues = allTracking.filter(t => {
    const daysSinceCreated = Math.floor((Date.now() - t.issue.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceCreated > 14 && t.issue.state === 'open'
  })

  if (longRunningIssues.length > 0) {
    alerts.attention.push(`📅 ${longRunningIssues.length} issues open for 14+ days`)
  }

  // Positive alerts
  const recentCompletions = allTracking.filter(t => {
    if (!t.issue.closedAt) return false
    const daysSinceClosed = Math.floor((Date.now() - t.issue.closedAt.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceClosed <= 1
  })

  if (recentCompletions.length > 0) {
    alerts.positive.push(`✅ ${recentCompletions.length} issues completed in last 24h`)
  }

  return {
    date: today,
    critical: alerts.critical,
    attention: alerts.attention,
    positive: alerts.positive,
    summary: `${allTracking.length} issues tracked, ${allTracking.filter(t => t.tracking.status === 'on-track').length} on-track`
  }
}

function calculateAverageEstimationAccuracy(tracking: any[]): number {
  const completedIssues = tracking.filter(t => t.issue.state === 'closed' && t.reality.hasStarted)
  
  if (completedIssues.length === 0) return 0

  const accuracyScores = completedIssues.map(t => {
    const estimatedDays = t.agentEstimate.estimatedHours / 8
    const actualDays = t.reality.daysWorked
    
    // Calculate accuracy as inverse of error ratio
    const errorRatio = Math.abs(estimatedDays - actualDays) / Math.max(estimatedDays, actualDays)
    return Math.max(0, 1 - errorRatio) * 100
  })

  return Math.round(accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length)
}