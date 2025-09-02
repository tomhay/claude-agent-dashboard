import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { agentId, projectPath, agentName } = await req.json()

    console.log(`Running agent: ${agentName} in ${projectPath}`)

    // Map agent IDs to their Claude Code commands
    const agentCommands: Record<string, string> = {
      // Universal Agents
      'universal-sod-reviewer': 'Review all SOD agents across projects. Read each project CLAUDE.md, analyze SOD agent effectiveness, and update SOD agents to be more project-specific and relevant. Generate comprehensive review report.',
      'universal-agent-updater': 'Scan all .claude/agents/ directories across projects, analyze agent effectiveness, remove outdated agents, and update agent definitions based on current project needs.',
      'universal-cross-project': 'Analyze patterns across all projects, identify shared opportunities, synchronize common agent improvements, and maintain consistency in agent quality.',
      'universal-issue-planner': 'Analyze GitHub issues across all projects, create detailed implementation plans, and update issues with technical approach and acceptance criteria.',
      'universal-issue-executor': 'Execute complete development cycle for GitHub issues: analyze → plan → implement → test → PR → deploy → close issue with summary.',
      'universal-issue-reviewer': 'Review GitHub issues and PRs across projects, ensure code quality, run tests, approve deployments, and close issues.',
      
      // Launch Claude commands (no specific agent)
      'universal-launch': '',
      'aibl-launch': '',
      'bl2-launch': '',
      'blxero-launch': '', 
      'purezone-launch': '',
      'upify-launch': '',
      'mydiff-launch': '',
      
      // Project-specific agents
      'aibl-sod': '@sod-agent Generate AIBL start of day report',
      'aibl-eod': '@eod-agent Generate AIBL end of day report', 
      'aibl-dca': '@aibl-daily-cleanup-agent Generate daily cleanup analysis',
      'aibl-pr': '@pr-deploy-pipeline-agent Review current branch and execute full pipeline',
      'aibl-sync': '@data-sync-review-agent Review sync health and diagnose issues',
      'aibl-langgraph': '@langgraph-integration-agent Maintain AI chat functionality',
      'aibl-monitoring': '@monitoring-observability-agent Check system health',
      'aibl-shadcn': '@shadcn-expert Provide UI component guidance',
      'aibl-ticket-plan': '@ticket-planning-step Plan project implementation',
      'aibl-ticket-dev': '@ticket-development-step Guide development phase',
      'bl2-sod': '@sod-agent Generate BL2 start of day report',
      'bl2-eod': '@eod-agent Generate BL2 end of day report',
      'bl2-dca': '@daily-cleanup-agent Generate cleanup analysis',
      'bl2-github': '@github-issue-tracker Show current project status',
      'blxero-sod': '@sod-agent Generate Blxero start of day report',
      'blxero-eod': '@eod-agent Generate Blxero end of day report',
      'blxero-dca': '@daily-cleanup-agent Generate cleanup analysis',
      'blxero-sync': 'Review automated sync engine status',
      'blxero-currency': 'Run currency audit system analysis',
      'purezone-sod': '@sod-agent Generate PureZone start of day report',
      'purezone-eod': '@eod-agent Generate PureZone end of day report',
      'purezone-theme': '@shopify-theme-agent Analyze theme optimization',
      'upify-sod': '@sod-agent Generate Upify start of day report',
      'upify-speed': 'Run Speed Test Agent for client analysis',
      'upify-seo': 'Run SEO optimization analysis',
      'upify-conversion': 'Run conversion rate optimization',
      'mydiff-sod': '@sod-agent Generate MyDiff start of day report',
      'mydiff-theme': '@shopify-theme-analyzer Analyze MyDiff theme'
    }

    const command = agentCommands[agentId] || `Run ${agentName} agent`
    
    // Handle different command types
    let fullCommand: string
    
    if (agentId.includes('-launch')) {
      // Launch plain Claude without specific agent
      fullCommand = `cmd.exe /c "cd /d "${projectPath}" && start cmd.exe /k "claude --dangerously-skip-permissions""` 
    } else {
      // Launch Claude with specific agent command
      fullCommand = `cmd.exe /c "cd /d "${projectPath}" && start cmd.exe /k "claude --dangerously-skip-permissions '${command}'""` 
    }

    await execAsync(fullCommand)

    // Log the execution for tracking
    const logEntry = {
      agentId,
      agentName,
      projectPath,
      command,
      timestamp: new Date().toISOString(),
      status: 'launched'
    }

    console.log('Agent execution logged:', logEntry)

    return NextResponse.json({ 
      success: true, 
      message: `Launched ${agentName} in ${projectPath}`,
      logEntry 
    })

  } catch (error) {
    console.error('Failed to run agent:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}