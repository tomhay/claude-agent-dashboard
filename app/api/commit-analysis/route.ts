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
      'BaliLove': { owner: 'BaliLove', repo: 'balilove-website' },
    }

    let allCommitData: any[] = []

    if (project && projectRepos[project]) {
      // Analyze specific project
      const { owner, repo } = projectRepos[project]
      const commitData = await analyzeRepositoryCommits(owner, repo, project)
      allCommitData = [commitData]
    } else {
      // Analyze all projects
      const analysisPromises = Object.entries(projectRepos).map(async ([projectName, { owner, repo }]) => {
        try {
          return await analyzeRepositoryCommits(owner, repo, projectName)
        } catch (error) {
          console.error(`Failed to analyze ${projectName}:`, error)
          return {
            project: projectName,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastCommit: null,
            velocity: 0,
            developers: []
          }
        }
      })

      allCommitData = await Promise.all(analysisPromises)
    }

    return NextResponse.json({
      success: true,
      commitAnalysis: allCommitData,
      summary: generateCrossPlatformSummary(allCommitData)
    })

  } catch (error) {
    console.error('Failed to analyze commits:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function analyzeRepositoryCommits(owner: string, repo: string, project: string) {
  // Get recent commits (last 2 weeks)
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  
  const { data: commits } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    since: twoWeeksAgo.toISOString(),
    per_page: 100
  })

  // Get repository stats
  const { data: stats } = await octokit.rest.repos.getCommitActivityStats({
    owner,
    repo
  })

  // Analyze developer patterns
  const developerMap = new Map<string, {
    commitCount: number
    lastCommit: Date
    avgCommitSize: number
    commitDays: Set<string>
    commits: typeof commits
  }>()

  commits.forEach(commit => {
    const author = commit.author?.login || commit.commit.author?.name || 'Unknown'
    const commitDate = new Date(commit.commit.author?.date || '')
    
    if (!developerMap.has(author)) {
      developerMap.set(author, {
        commitCount: 0,
        lastCommit: commitDate,
        avgCommitSize: 0,
        commitDays: new Set(),
        commits: []
      })
    }
    
    const dev = developerMap.get(author)!
    dev.commitCount++
    dev.commits.push(commit)
    dev.commitDays.add(commitDate.toDateString())
    
    if (commitDate > dev.lastCommit) {
      dev.lastCommit = commitDate
    }
  })

  // Calculate detailed metrics for each developer
  const developers = await Promise.all(
    Array.from(developerMap.entries()).map(async ([author, data]) => {
      // Get detailed commit info for sizing
      const detailedCommits = await Promise.all(
        data.commits.slice(0, 10).map(async (commit) => {
          try {
            const { data: details } = await octokit.rest.repos.getCommit({
              owner,
              repo,
              ref: commit.sha
            })
            return {
              sha: commit.sha,
              message: commit.commit.message,
              date: commit.commit.author?.date,
              additions: details.stats?.additions || 0,
              deletions: details.stats?.deletions || 0,
              filesChanged: details.files?.length || 0,
              url: commit.html_url
            }
          } catch (error) {
            return {
              sha: commit.sha,
              message: commit.commit.message,
              date: commit.commit.author?.date,
              additions: 0,
              deletions: 0,
              filesChanged: 0,
              url: commit.html_url
            }
          }
        })
      )

      const totalChanges = detailedCommits.reduce((sum, c) => sum + c.additions + c.deletions, 0)
      const avgCommitSize = totalChanges / detailedCommits.length || 0
      
      // Calculate velocity metrics
      const daysSinceLastCommit = Math.floor((Date.now() - data.lastCommit.getTime()) / (1000 * 60 * 60 * 24))
      const commitsPerDay = data.commitCount / Math.max(data.commitDays.size, 1)
      const consistencyScore = (data.commitDays.size / 14) * 100 // % of days with commits in 2 weeks
      
      // Performance scoring
      const velocityScore = Math.min(100, commitsPerDay * 50) // Scale: 0-100
      const activityScore = Math.max(0, 100 - (daysSinceLastCommit * 10)) // Penalty for staleness
      const qualityScore = avgCommitSize > 50 && avgCommitSize < 500 ? 100 : // Sweet spot
                          avgCommitSize > 1000 ? 50 : // Too large
                          avgCommitSize < 10 ? 30 : 80 // Too small
      
      const overallScore = (velocityScore + activityScore + qualityScore) / 3

      return {
        name: author,
        commitCount: data.commitCount,
        lastCommitDate: data.lastCommit,
        daysSinceLastCommit,
        commitsPerDay: parseFloat(commitsPerDay.toFixed(2)),
        avgCommitSize: parseFloat(avgCommitSize.toFixed(0)),
        activeDays: data.commitDays.size,
        consistencyScore: parseFloat(consistencyScore.toFixed(1)),
        velocityScore: parseFloat(velocityScore.toFixed(1)),
        activityScore: parseFloat(activityScore.toFixed(1)),
        qualityScore: parseFloat(qualityScore.toFixed(1)),
        overallScore: parseFloat(overallScore.toFixed(1)),
        recentCommits: detailedCommits,
        // Performance insights
        insights: generateDeveloperInsights(daysSinceLastCommit, commitsPerDay, avgCommitSize, consistencyScore),
        // Workflow suggestions
        suggestions: generateWorkflowSuggestions(commitsPerDay, avgCommitSize, consistencyScore, daysSinceLastCommit)
      }
    })
  )

  // Project-level analysis
  const projectLastCommit = commits.length > 0 ? new Date(commits[0].commit.author?.date || '') : null
  const projectVelocity = commits.length / 14 // commits per day over 2 weeks
  const uniqueDevelopers = developers.length
  const totalCommits = commits.length

  return {
    project,
    owner,
    repo,
    lastCommit: projectLastCommit,
    daysSinceLastCommit: projectLastCommit ? 
      Math.floor((Date.now() - projectLastCommit.getTime()) / (1000 * 60 * 60 * 24)) : 999,
    velocity: parseFloat(projectVelocity.toFixed(2)),
    totalCommits,
    uniqueDevelopers,
    developers: developers.sort((a, b) => b.overallScore - a.overallScore),
    projectHealth: {
      commitFrequency: projectVelocity > 1 ? 'high' : projectVelocity > 0.5 ? 'medium' : 'low',
      teamActivity: uniqueDevelopers > 1 ? 'collaborative' : 'solo',
      recentActivity: projectLastCommit && (Date.now() - projectLastCommit.getTime()) < 7 * 24 * 60 * 60 * 1000 ? 'active' : 'stale'
    },
    // Boss-level insights
    managerInsights: generateManagerInsights(developers, projectVelocity, projectLastCommit),
    // Project completion estimation
    completionEstimates: generateCompletionEstimates(developers, commits.length, project)
  }
}

function generateDeveloperInsights(daysSinceLastCommit: number, commitsPerDay: number, avgCommitSize: number, consistencyScore: number): string[] {
  const insights: string[] = []
  
  if (daysSinceLastCommit > 7) {
    insights.push(`🚨 No activity for ${daysSinceLastCommit} days - may be blocked or on different project`)
  }
  if (commitsPerDay > 3) {
    insights.push(`⚡ High velocity developer - ${commitsPerDay} commits/day`)
  }
  if (commitsPerDay < 0.2) {
    insights.push(`🐌 Low commit frequency - may need support or clearer tasks`)
  }
  if (avgCommitSize > 1000) {
    insights.push(`📦 Large commits detected - suggest breaking down work into smaller pieces`)
  }
  if (consistencyScore < 20) {
    insights.push(`📅 Inconsistent work pattern - only active ${consistencyScore}% of days`)
  }
  if (consistencyScore > 80) {
    insights.push(`🎯 Highly consistent - active ${consistencyScore}% of days`)
  }
  
  return insights
}

function generateWorkflowSuggestions(commitsPerDay: number, avgCommitSize: number, consistencyScore: number, daysSinceLastCommit: number): string[] {
  const suggestions: string[] = []
  
  if (daysSinceLastCommit > 3) {
    suggestions.push("Schedule daily check-in to identify blockers")
  }
  if (avgCommitSize > 500) {
    suggestions.push("Break work into smaller, reviewable commits (aim for <300 lines)")
  }
  if (commitsPerDay < 0.5) {
    suggestions.push("Consider daily commit goals or pair programming sessions")
  }
  if (consistencyScore < 50) {
    suggestions.push("Establish daily coding routine for more predictable delivery")
  }
  if (commitsPerDay > 5) {
    suggestions.push("High activity - ensure adequate code review and testing")
  }
  
  return suggestions
}

function generateManagerInsights(developers: any[], projectVelocity: number, lastCommit: Date | null): string[] {
  const insights: string[] = []
  const now = Date.now()
  
  // Team composition analysis
  const activeDevelopers = developers.filter(d => d.daysSinceLastCommit < 7)
  const staleDevelopers = developers.filter(d => d.daysSinceLastCommit >= 7)
  
  if (staleDevelopers.length > 0) {
    insights.push(`⚠️ ${staleDevelopers.length} developers inactive for 7+ days: ${staleDevelopers.map(d => d.name).join(', ')}`)
  }
  
  if (projectVelocity < 0.5) {
    insights.push(`🐌 Low project velocity (${projectVelocity} commits/day) - investigate blockers`)
  }
  
  if (activeDevelopers.length === 1) {
    insights.push(`👤 Single developer project - consider knowledge sharing or backup support`)
  }
  
  // Performance distribution
  const highPerformers = developers.filter(d => d.overallScore > 70)
  const strugglingDevs = developers.filter(d => d.overallScore < 40 && d.daysSinceLastCommit < 7)
  
  if (strugglingDevs.length > 0) {
    insights.push(`📈 Developers needing support: ${strugglingDevs.map(d => d.name).join(', ')} - consider mentoring or task adjustment`)
  }
  
  if (highPerformers.length > 0) {
    insights.push(`🌟 High performers: ${highPerformers.map(d => d.name).join(', ')} - potential mentors for team`)
  }
  
  return insights
}

function generateCompletionEstimates(developers: any[], totalCommits: number, project: string): any {
  const activeDevelopers = developers.filter(d => d.daysSinceLastCommit < 7)
  const teamVelocity = activeDevelopers.reduce((sum, d) => sum + d.commitsPerDay, 0)
  
  // Project complexity estimation based on patterns
  const complexityMultipliers = {
    'AIBL': 1.5, // Wedding platform with LangGraph - complex
    'BL2': 2.0,  // Large feature set - very complex
    'Blxero': 1.2, // Financial sync - moderate complexity
    'Upify': 1.3,  // SaaS platform - moderate-high complexity
    'BaliLove': 1.4, // CMS + booking - moderate-high complexity
  }
  
  const complexityFactor = complexityMultipliers[project as keyof typeof complexityMultipliers] || 1.0
  
  // Estimate based on historical patterns
  const avgCommitsPerFeature = 15 // Historical average
  const avgCommitsPerBug = 3
  const avgCommitsPerRefactor = 8
  
  return {
    teamVelocity: parseFloat(teamVelocity.toFixed(2)),
    complexityFactor,
    estimatedDaysPerFeature: parseFloat((avgCommitsPerFeature * complexityFactor / Math.max(teamVelocity, 0.1)).toFixed(1)),
    estimatedDaysPerBug: parseFloat((avgCommitsPerBug * complexityFactor / Math.max(teamVelocity, 0.1)).toFixed(1)),
    currentCapacity: activeDevelopers.length,
    capacityUtilization: activeDevelopers.length > 0 ? 
      parseFloat((teamVelocity / (activeDevelopers.length * 2)).toFixed(1)) : 0, // vs optimal 2 commits/day/dev
    recommendations: generateCapacityRecommendations(teamVelocity, activeDevelopers.length, project)
  }
}

function generateCapacityRecommendations(teamVelocity: number, activeDevelopers: number, project: string): string[] {
  const recommendations: string[] = []
  const optimalVelocity = activeDevelopers * 2 // 2 commits per day per developer
  
  if (teamVelocity < optimalVelocity * 0.5) {
    recommendations.push(`🚨 Low team output: ${teamVelocity.toFixed(1)} vs optimal ${optimalVelocity} commits/day`)
    recommendations.push("Consider: Remove blockers, simplify tasks, or add developer support")
  }
  
  if (activeDevelopers === 0) {
    recommendations.push("🆘 No active developers - project requires immediate attention")
  }
  
  if (activeDevelopers === 1) {
    recommendations.push("⚠️ Bus factor risk - single developer project needs backup or knowledge sharing")
  }
  
  if (teamVelocity > optimalVelocity * 1.5) {
    recommendations.push("🚀 High velocity team - ensure code quality and prevent burnout")
  }
  
  return recommendations
}

function generateCrossPlatformSummary(allData: any[]) {
  const validProjects = allData.filter(p => !p.error)
  const totalDevelopers = new Set(validProjects.flatMap(p => p.developers.map((d: any) => d.name))).size
  const averageVelocity = validProjects.reduce((sum, p) => sum + p.velocity, 0) / Math.max(validProjects.length, 1)
  const staleProjects = validProjects.filter(p => p.daysSinceLastCommit > 7)
  
  return {
    totalProjects: allData.length,
    activeProjects: validProjects.filter(p => p.daysSinceLastCommit <= 7).length,
    staleProjects: staleProjects.length,
    totalActiveDevelopers: totalDevelopers,
    averageVelocity: parseFloat(averageVelocity.toFixed(2)),
    healthScore: parseFloat(((validProjects.length - staleProjects.length) / Math.max(validProjects.length, 1) * 100).toFixed(1)),
    topPerformer: validProjects
      .flatMap(p => p.developers)
      .sort((a: any, b: any) => b.overallScore - a.overallScore)[0],
    criticalAlerts: generateCriticalAlerts(allData, staleProjects.length, totalDevelopers)
  }
}

function generateCriticalAlerts(allData: any[], staleProjectCount: number, totalDevelopers: number): string[] {
  const alerts: string[] = []
  
  if (staleProjectCount > allData.length * 0.5) {
    alerts.push(`🚨 ${staleProjectCount} projects have no recent activity - requires immediate attention`)
  }
  
  if (totalDevelopers < 3) {
    alerts.push(`⚠️ Only ${totalDevelopers} active developers across all projects - capacity risk`)
  }
  
  const aiblProject = allData.find(p => p.project === 'AIBL')
  if (aiblProject && !aiblProject.error && aiblProject.daysSinceLastCommit > 3) {
    alerts.push(`🔥 AIBL project stale for ${aiblProject.daysSinceLastCommit} days - priority project needs attention`)
  }
  
  return alerts
}