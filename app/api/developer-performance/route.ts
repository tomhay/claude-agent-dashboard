import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import fs from 'fs'
import path from 'path'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weeks = parseInt(searchParams.get('weeks') || '4') // Default 4 weeks
    
    // Project to GitHub repo mapping
    const projectRepos: Record<string, { owner: string; repo: string }> = {
      'AIBL': { owner: 'BaliLove', repo: 'chat-langchain' },
      'BL2': { owner: 'BaliLove', repo: 'BaliLove_v2.0' },
      'Blxero': { owner: 'BaliLove', repo: 'x' },
      'Upify': { owner: 'tomhay', repo: 'upify' },
      'BaliLove': { owner: 'BaliLove', repo: 'balilove-website' },
    }

    // Calculate date range for analysis
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (weeks * 7))

    console.log(`Analyzing developer performance from ${startDate.toDateString()} to ${endDate.toDateString()}`)

    // Get data from all projects
    const developerPerformanceMap = new Map<string, any>()
    
    for (const [projectName, { owner, repo }] of Object.entries(projectRepos)) {
      try {
        console.log(`Analyzing ${projectName}...`)
        
        // Get commits for the time period
        const { data: commits } = await octokit.rest.repos.listCommits({
          owner,
          repo,
          since: startDate.toISOString(),
          until: endDate.toISOString(),
          per_page: 100
        })

        // Get issues for correlation
        const { data: issues } = await octokit.rest.issues.listForRepo({
          owner,
          repo,
          state: 'all',
          since: startDate.toISOString(),
          per_page: 100
        })

        // Process commits by developer
        for (const commit of commits) {
          const developer = commit.author?.login || commit.commit.author?.name || 'Unknown'
          
          if (!developerPerformanceMap.has(developer)) {
            developerPerformanceMap.set(developer, {
              name: developer,
              projects: new Set(),
              commits: [],
              issues: new Set(),
              dailyActivity: new Map(),
              weeklyStats: {
                totalCommits: 0,
                totalLines: 0,
                issuesWorked: 0,
                avgCommitSize: 0,
                activeDays: 0,
                productivity: {
                  velocity: 0,
                  quality: 0,
                  focus: 0,
                  efficiency: 0,
                  consistency: 0
                }
              }
            })
          }
          
          const dev = developerPerformanceMap.get(developer)!
          dev.projects.add(projectName)
          dev.commits.push({
            ...commit,
            project: projectName,
            date: new Date(commit.commit.author?.date || '')
          })
          
          // Track daily activity
          const dayKey = commit.commit.author?.date?.split('T')[0] || ''
          if (!dev.dailyActivity.has(dayKey)) {
            dev.dailyActivity.set(dayKey, { commits: 0, lines: 0, issues: new Set() })
          }
          dev.dailyActivity.get(dayKey)!.commits++
        }

        // Link issues to developers
        for (const issue of issues) {
          if (issue.assignee?.login) {
            const developer = issue.assignee.login
            if (developerPerformanceMap.has(developer)) {
              developerPerformanceMap.get(developer)!.issues.add(`${projectName}-${issue.number}`)
            }
          }
        }

      } catch (error) {
        console.error(`Failed to analyze ${projectName}:`, error)
      }
    }

    // Calculate detailed performance metrics
    const performanceData = await Promise.all(
      Array.from(developerPerformanceMap.values()).map(async (dev) => {
        return await calculateDetailedMetrics(dev, weeks)
      })
    )

    // Sort by overall performance score
    performanceData.sort((a, b) => b.weeklyStats.productivity.overall - a.weeklyStats.productivity.overall)

    return NextResponse.json({
      success: true,
      period: { startDate, endDate, weeks },
      developers: performanceData,
      summary: generateTeamSummary(performanceData)
    })

  } catch (error) {
    console.error('Failed to analyze developer performance:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function calculateDetailedMetrics(dev: any, weeks: number) {
  // Get detailed commit info for recent commits
  const recentCommits = dev.commits.slice(0, 20)
  const commitDetails = await Promise.all(
    recentCommits.map(async (commit: any) => {
      try {
        const { data: details } = await octokit.rest.repos.getCommit({
          owner: commit.project === 'Upify' ? 'tomhay' : 'BaliLove',
          repo: commit.project === 'AIBL' ? 'chat-langchain' :
               commit.project === 'BL2' ? 'BaliLove_v2.0' :
               commit.project === 'Blxero' ? 'x' :
               commit.project === 'Upify' ? 'upify' : 'balilove-website',
          ref: commit.sha
        })
        return {
          ...commit,
          additions: details.stats?.additions || 0,
          deletions: details.stats?.deletions || 0,
          filesChanged: details.files?.length || 0
        }
      } catch {
        return { ...commit, additions: 0, deletions: 0, filesChanged: 0 }
      }
    })
  )

  // Calculate metrics
  const totalCommits = dev.commits.length
  const activeDays = dev.dailyActivity.size
  const commitsPerDay = totalCommits / Math.max(activeDays, 1)
  
  const totalLines = commitDetails.reduce((sum, c) => sum + c.additions + c.deletions, 0)
  const avgCommitSize = totalLines / Math.max(commitDetails.length, 1)
  
  // Better time estimation based on multiple factors
  const workingHours = estimateBetterWorkingHours(commitDetails, activeDays, avgCommitSize)
  
  // Calculate performance scores
  const velocity = Math.min(100, commitsPerDay * 25) // 0-100 scale
  const quality = avgCommitSize > 50 && avgCommitSize < 300 ? 100 : // Sweet spot
                 avgCommitSize > 1000 ? Math.max(20, 100 - (avgCommitSize / 10)) : // Too large
                 avgCommitSize < 20 ? 60 : 85 // Too small
  
  // Issue-driven development tracking
  const trackedCommits = commitDetails.filter(commit => {
    const message = commit.commit.message.toLowerCase()
    return message.includes('#') || // Contains issue reference
           message.includes('fixes') ||
           message.includes('closes') ||
           message.includes('resolves') ||
           message.includes('issue')
  })
  
  const untrackedCommits = commitDetails.filter(commit => {
    const message = commit.commit.message.toLowerCase()
    return !(message.includes('#') || 
             message.includes('fixes') ||
             message.includes('closes') ||
             message.includes('resolves') ||
             message.includes('issue'))
  })
  
  const issueWorkflowRatio = (trackedCommits.length / Math.max(commitDetails.length, 1)) * 100
  
  const focus = Math.min(100, (dev.issues.size / Math.max(totalCommits / 5, 1)) * 100) // Issues per commit ratio
  const efficiency = workingHours > 0 ? Math.min(100, (totalCommits / workingHours) * 50) : 0
  const consistency = (activeDays / (weeks * 7)) * 100
  const workflowDiscipline = issueWorkflowRatio // New metric for issue-driven development
  
  const overall = (velocity + quality + focus + efficiency + consistency) / 5

  // Generate performance flags
  const flags = []
  if (avgCommitSize > 500) flags.push('🚩 Large commits (break into smaller pieces)')
  if (commitsPerDay < 1) flags.push('📅 Low frequency (aim for daily commits)')
  if (dev.commits.length === 0) flags.push('❌ No activity this period')
  if (avgCommitSize > 1500) flags.push('📦 Massive commits (review atomic commit practices)')
  if (consistency < 50) flags.push('⚠️ Inconsistent schedule')
  if (workingHours > 50) flags.push('🔥 High hours (monitor for burnout)')
  
  // Issue workflow discipline flags
  if (issueWorkflowRatio < 50) flags.push('🎯 Low issue tracking (link commits to issues)')
  if (untrackedCommits.length > 5) flags.push(`🔗 ${untrackedCommits.length} untracked commits (use #123 format)`)
  if (issueWorkflowRatio < 30) flags.push('📋 Poor workflow discipline (work from issues)')
  if (trackedCommits.length === 0 && commitDetails.length > 0) flags.push('🚨 No issue-linked commits (review workflow)')

  // Time analysis
  const dailyBreakdown = Array.from(dev.dailyActivity.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, activity]) => ({
      date,
      commits: activity.commits,
      estimatedHours: activity.commits * (avgCommitSize / 100) // Rough estimate
    }))

  return {
    ...dev,
    projects: Array.from(dev.projects),
    issues: Array.from(dev.issues),
    weeklyStats: {
      totalCommits,
      activeDays,
      commitsPerDay: parseFloat(commitsPerDay.toFixed(2)),
      avgCommitSize: parseFloat(avgCommitSize.toFixed(0)),
      estimatedHoursPerWeek: parseFloat(workingHours.toFixed(1)),
      hoursPerDay: parseFloat((workingHours / Math.max(activeDays, 1)).toFixed(1)),
      issuesWorked: dev.issues.size,
      // Issue workflow discipline tracking
      trackedCommits: trackedCommits.length,
      untrackedCommits: untrackedCommits.length,
      issueWorkflowRatio: parseFloat(issueWorkflowRatio.toFixed(1)),
      productivity: {
        velocity: parseFloat(velocity.toFixed(1)),
        quality: parseFloat(quality.toFixed(1)),
        focus: parseFloat(focus.toFixed(1)),
        efficiency: parseFloat(efficiency.toFixed(1)),
        consistency: parseFloat(consistency.toFixed(1)),
        workflowDiscipline: parseFloat(workflowDiscipline.toFixed(1)),
        overall: parseFloat(overall.toFixed(1))
      }
    },
    flags,
    dailyBreakdown,
    coachingSuggestions: generateCoachingSuggestions(velocity, quality, focus, efficiency, consistency, flags, issueWorkflowRatio, untrackedCommits.length),
    // Issue workflow details for manager
    workflowAnalysis: {
      trackedCommits: trackedCommits.length,
      untrackedCommits: untrackedCommits.length,
      issueWorkflowRatio: parseFloat(issueWorkflowRatio.toFixed(1)),
      untrackedCommitExamples: untrackedCommits.slice(0, 3).map(c => ({
        sha: c.sha.substring(0, 7),
        message: c.commit.message.split('\n')[0].substring(0, 60),
        url: c.html_url
      }))
    }
  }
}

function estimateBetterWorkingHours(commitDetails: any[], activeDays: number, avgCommitSize: number): number {
  // Better estimation using multiple factors
  
  // Factor 1: Code volume (lines written indicate time spent)
  const totalLines = commitDetails.reduce((sum, c) => sum + c.additions + c.deletions, 0)
  const hoursFromCodeVolume = totalLines / 50 // Assume 50 lines per hour (conservative)
  
  // Factor 2: Commit frequency and timing patterns
  const commitTimes = commitDetails.map(c => new Date(c.commit.author?.date || ''))
  const uniqueDays = new Set(commitTimes.map(d => d.toDateString())).size
  const commitsPerActiveDay = commitDetails.length / Math.max(uniqueDays, 1)
  
  // Factor 3: Large commits indicate substantial work sessions
  const largeCommitCount = commitDetails.filter(c => (c.additions + c.deletions) > 500).length
  const largeCommitHours = largeCommitCount * 3 // 3 hours per large commit minimum
  
  // Factor 4: Files changed indicates complexity/context switching  
  const avgFilesChanged = commitDetails.reduce((sum, c) => sum + c.filesChanged, 0) / Math.max(commitDetails.length, 1)
  const complexityMultiplier = Math.min(2, avgFilesChanged / 5) // More files = more complexity
  
  // Combine factors for realistic estimate
  const baseHours = Math.max(hoursFromCodeVolume, largeCommitHours)
  const adjustedHours = baseHours * complexityMultiplier
  const weeklyHours = adjustedHours / Math.max(activeDays / 7, 1) // Convert to weekly
  
  // Realistic bounds: 10-60 hours per week
  return Math.max(10, Math.min(60, weeklyHours))
}

function generateCoachingSuggestions(velocity: number, quality: number, focus: number, efficiency: number, consistency: number, flags: string[], issueWorkflowRatio: number, untrackedCount: number): string[] {
  const suggestions = []
  
  if (quality < 70) {
    suggestions.push('📏 Aim for 50-300 line commits for better reviewability and debugging')
  }
  if (velocity < 50) {
    suggestions.push('⚡ Consider daily commit goals to maintain development momentum')
  }
  if (focus < 60) {
    suggestions.push('🎯 Work on fewer issues simultaneously for deeper focus')
  }
  if (consistency < 60) {
    suggestions.push('📅 Establish regular coding schedule for predictable delivery')
  }
  if (efficiency < 50) {
    suggestions.push('⏰ Break larger tasks into smaller, time-boxed commits')
  }
  
  // Atomic commit specific suggestions
  if (flags.some(f => f.includes('Large commits'))) {
    suggestions.push('🔄 Try 25-minute commit timer: work → test → commit → repeat')
  }
  
  // Issue workflow discipline suggestions
  if (issueWorkflowRatio < 70) {
    suggestions.push('🎯 Link commits to issues using "fixes #123" or "#123" in commit messages')
  }
  if (untrackedCount > 5) {
    suggestions.push('📋 Create GitHub issues for untracked work to improve project visibility')
  }
  if (issueWorkflowRatio < 30) {
    suggestions.push('🚨 Adopt issue-driven development: create issue → work → commit → link → close')
  }
  if (issueWorkflowRatio > 90) {
    suggestions.push('✅ Excellent issue workflow discipline - great project tracking!')
  }
  
  return suggestions
}

function generateTeamSummary(developers: any[]) {
  const totalDevelopers = developers.length
  const activeDevelopers = developers.filter(d => d.weeklyStats.totalCommits > 0)
  
  return {
    totalDevelopers,
    activeDevelopers: activeDevelopers.length,
    avgVelocity: parseFloat((activeDevelopers.reduce((sum, d) => sum + d.weeklyStats.productivity.velocity, 0) / Math.max(activeDevelopers.length, 1)).toFixed(1)),
    avgQuality: parseFloat((activeDevelopers.reduce((sum, d) => sum + d.weeklyStats.productivity.quality, 0) / Math.max(activeDevelopers.length, 1)).toFixed(1)),
    topPerformer: activeDevelopers[0] || null,
    needsAttention: developers.filter(d => d.flags.length > 2)
  }
}