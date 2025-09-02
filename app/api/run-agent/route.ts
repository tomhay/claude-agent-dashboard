import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { agentId, projectPath, agentName, projectName } = await req.json()

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
      'mydiff-theme': '@shopify-theme-analyzer Analyze MyDiff theme',
      
      // Project cleanup agents
      'aibl-issue-cleanup': 'AIBL GitHub Issue Review Agent: Systematically review all GitHub issues in BaliLove/chat-langchain repository using GitHub CLI. For each issue, determine if it is: (1) Still relevant and actionable, (2) Already resolved but not closed, (3) Duplicate of another issue, (4) Test failure that has been superseded. Only close issues that are genuinely obsolete or resolved. Use `gh issue list --repo BaliLove/chat-langchain --state all`, then `gh issue view {number}` to review each issue content. Close only when clearly justified with specific reasoning in closing comment. Quality over quantity - proper review is more important than closing many issues.',
      'aibl-test-fixer': 'Systematically address all frontend test failures in AIBL project. Analyze failing tests, identify root causes, implement fixes, and ensure test suite is stable. Work through issues #246-#276 methodically.',
      'aibl-milestone-prep': 'Prepare all AIBL issues for September 7 milestone. Review issue priorities, update assignments, ensure all critical issues are on track, and flag any blockers for management attention.',
      'bl2-bug-fixer': 'Address critical BL2 bugs systematically. Focus on wishlist issues (#145), catalog bugs (#144), and other user-facing problems. Prioritize by user impact and business value.',
      'bl2-milestone-prep': 'Prepare BL2 for 2nd Release milestone. Review all issues, update status based on progress, ensure proper prioritization, and coordinate with development team.'
    }

    const command = agentCommands[agentId] || `Run ${agentName} agent`
    
    // Convert forward slashes to backslashes for Windows
    const windowsPath = projectPath.replace(/\//g, '\\')
    
    // Use PowerShell module directly - the working approach we tested
    let psCommand: string
    
    if (agentId.includes('-launch')) {
      // Launch plain Claude without specific agent  
      psCommand = `powershell -Command "Import-Module 'C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard\\AgentManager.psm1' -Force; Start-ClaudeAgent -ProjectPath '${windowsPath}' -AgentCommand '' -AgentName '${agentName}' -ProjectName '${projectName}'"`
    } else {
      // Launch Claude with specific agent command
      psCommand = `powershell -Command "Import-Module 'C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard\\AgentManager.psm1' -Force; Start-ClaudeAgent -ProjectPath '${windowsPath}' -AgentCommand '${command}' -AgentName '${agentName}' -ProjectName '${projectName}'"`
    }

    console.log('Executing PowerShell command:', psCommand)
    const result = await execAsync(psCommand)
    
    console.log('PowerShell stdout:', result.stdout)
    console.log('PowerShell stderr:', result.stderr)
    
    const success = result.stdout.includes('SUCCESS:') || result.stderr.includes('SUCCESS:')

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
      success, 
      message: success ? `Launched ${agentName} in ${projectPath}` : `Failed to launch ${agentName}`,
      stdout: result.stdout,
      stderr: result.stderr,
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