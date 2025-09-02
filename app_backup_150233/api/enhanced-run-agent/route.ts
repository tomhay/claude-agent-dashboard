import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    console.log('Raw request body:', body)
    
    const { agentId, projectPath, agentName, projectName } = JSON.parse(body)
    
    // Convert forward slashes back to backslashes for Windows
    const windowsPath = projectPath.replace(/\//g, '\\')
    
    console.log(`Enhanced run: ${agentName} in ${windowsPath}`)
    console.log('Agent ID:', agentId)

    // Map agent IDs to their Claude Code commands
    const agentCommands: Record<string, string> = {
      // Universal Agents
      'universal-sod-reviewer': 'Review all SOD agents across projects. Read each project CLAUDE.md, analyze SOD agent effectiveness, and update SOD agents to be more project-specific and relevant.',
      'universal-agent-updater': 'Scan all .claude/agents/ directories across projects, analyze agent effectiveness, remove outdated agents, and update agent definitions.',
      'universal-cross-project': 'Analyze patterns across all projects, identify shared opportunities, synchronize common agent improvements.',
      'universal-run-all-sod': 'RUN_ALL_SOD',
      'universal-run-all-eod': 'RUN_ALL_EOD', 
      'universal-run-all-dca': 'RUN_ALL_DCA',
      
      // Project-specific agents
      'aibl-sod': '@sod-agent Generate AIBL start of day report',
      'aibl-eod': '@eod-agent Generate AIBL end of day report', 
      'aibl-dca': '@aibl-daily-cleanup-agent Generate daily cleanup analysis',
      'aibl-pr': '@pr-deploy-pipeline-agent Review current branch and execute full pipeline',
      'aibl-sync': '@data-sync-review-agent Review sync health and diagnose issues',
      'bl2-sod': '@sod-agent Generate BL2 start of day report',
      'bl2-eod': '@eod-agent Generate BL2 end of day report',
      'bl2-github': '@github-issue-tracker Show current project status',
      'blxero-sod': '@sod-agent Generate Blxero start of day report',
      'blxero-eod': '@eod-agent Generate Blxero end of day report',
      'blxero-dca': '@daily-cleanup-agent Generate Blxero cleanup analysis',
      'upify-sod': '@sod-agent Generate Upify start of day report',
      'upify-speed': 'Run Speed Test Agent for client analysis',
      'purezone-sod': '@sod-agent Generate PureZone start of day report',
      'mydiff-sod': '@sod-agent Generate MyDiff start of day report'
    }

    const command = agentCommands[agentId] || ''
    
    // Handle special "Run All" commands
    if (command === 'RUN_ALL_SOD') {
      // Launch SOD agents for all projects
      const projects = [
        { name: 'AIBL', path: 'C:\\Users\\User\\apps\\aibl', command: '@sod-agent Generate AIBL start of day report' },
        { name: 'BL2', path: 'C:\\Users\\User\\apps\\bl2', command: '@sod-agent Generate BL2 start of day report' },
        { name: 'Blxero', path: 'C:\\Users\\User\\apps\\blxero', command: '@sod-agent Generate Blxero start of day report' },
        { name: 'PureZone', path: 'C:\\Users\\User\\Shopify\\purezone', command: '@sod-agent Generate PureZone start of day report' },
        { name: 'Upify', path: 'C:\\Users\\User\\apps\\upify', command: '@sod-agent Generate Upify start of day report' },
        { name: 'MyDiff', path: 'C:\\Users\\User\\Shopify\\mydiff', command: '@sod-agent Generate MyDiff start of day report' }
      ]
      
      for (const project of projects) {
        const psCommand = `
          Import-Module "C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard\\AgentManager.psm1" -Force
          Start-ClaudeAgent -ProjectPath "${project.path}" -AgentCommand "${project.command}" -AgentName "SOD Agent" -ProjectName "${project.name}"
        `
        execAsync(`powershell -Command "${psCommand}"`).catch(console.error)
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Launched SOD agents for all 6 projects`,
        count: 6
      })
    }
    
    if (command === 'RUN_ALL_EOD') {
      // Similar logic for EOD agents
      const projects = [
        { name: 'AIBL', path: 'C:\\Users\\User\\apps\\aibl', command: '@eod-agent Generate AIBL end of day report' },
        { name: 'BL2', path: 'C:\\Users\\User\\apps\\bl2', command: '@eod-agent Generate BL2 end of day report' },
        { name: 'Blxero', path: 'C:\\Users\\User\\apps\\blxero', command: '@eod-agent Generate Blxero end of day report' },
        { name: 'PureZone', path: 'C:\\Users\\User\\Shopify\\purezone', command: '@eod-agent Generate PureZone end of day report' },
        { name: 'Upify', path: 'C:\\Users\\User\\apps\\upify', command: '@eod-agent Generate Upify end of day report' },
        { name: 'MyDiff', path: 'C:\\Users\\User\\Shopify\\mydiff', command: '@eod-agent Generate MyDiff end of day report' }
      ]
      
      for (const project of projects) {
        const psCommand = `
          Import-Module "C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard\\AgentManager.psm1" -Force
          Start-ClaudeAgent -ProjectPath "${project.path}" -AgentCommand "${project.command}" -AgentName "EOD Agent" -ProjectName "${project.name}"
        `
        execAsync(`powershell -Command "${psCommand}"`).catch(console.error)
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Launched EOD agents for all 6 projects`,
        count: 6
      })
    }
    
    if (command === 'RUN_ALL_DCA') {
      // Similar logic for DCA agents
      const projects = [
        { name: 'AIBL', path: 'C:\\Users\\User\\apps\\aibl', command: '@aibl-daily-cleanup-agent Generate daily cleanup analysis' },
        { name: 'BL2', path: 'C:\\Users\\User\\apps\\bl2', command: '@daily-cleanup-agent Generate cleanup analysis' },
        { name: 'Blxero', path: 'C:\\Users\\User\\apps\\blxero', command: '@daily-cleanup-agent Generate cleanup analysis' },
        { name: 'PureZone', path: 'C:\\Users\\User\\Shopify\\purezone', command: '@daily-cleanup-agent Generate cleanup analysis' },
        { name: 'Upify', path: 'C:\\Users\\User\\apps\\upify', command: '@daily-cleanup-agent Generate cleanup analysis' },
        { name: 'MyDiff', path: 'C:\\Users\\User\\Shopify\\mydiff', command: '@daily-cleanup-agent Generate cleanup analysis' }
      ]
      
      for (const project of projects) {
        const psCommand = `
          Import-Module "C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard\\AgentManager.psm1" -Force
          Start-ClaudeAgent -ProjectPath "${project.path}" -AgentCommand "${project.command}" -AgentName "DCA Agent" -ProjectName "${project.name}"
        `
        execAsync(`powershell -Command "${psCommand}"`).catch(console.error)
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Launched DCA agents for all 6 projects`,
        count: 6
      })
    }
    
    // Handle single agent launches
    const psCommand = `
      Import-Module "C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard\\AgentManager.psm1" -Force
      $result = Start-ClaudeAgent -ProjectPath "${windowsPath}" -AgentCommand "${command}" -AgentName "${agentName}" -ProjectName "${projectName || 'Unknown'}"
      Write-Host "ProcessId: $result"
    `

    console.log('Executing PowerShell command:', psCommand)
    const { stdout, stderr } = await execAsync(`powershell -Command "${psCommand}"`, {
      timeout: 10000,
      encoding: 'utf8'
    })
    console.log('PowerShell stdout:', stdout)
    console.log('PowerShell stderr:', stderr)
    
    // Parse structured output from PowerShell
    let processId = null
    let windowTitle = null
    let success = false
    
    if (stdout.includes('SUCCESS:')) {
      const successMatch = stdout.match(/SUCCESS:ProcessId:(\d+):WindowTitle:(.+)/)
      if (successMatch) {
        processId = parseInt(successMatch[1])
        windowTitle = successMatch[2]
        success = true
      }
    }
    
    console.log('Parsed output - ProcessId:', processId, 'WindowTitle:', windowTitle, 'Success:', success)

    return NextResponse.json({ 
      success: success, 
      message: success ? `Enhanced launch: ${agentName} in ${windowsPath}` : `Failed to launch: ${agentName}`,
      processId,
      windowTitle,
      timestamp: new Date().toISOString(),
      trackingEnabled: true
    })

  } catch (error) {
    console.error('Failed to run enhanced agent:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check agent status using PowerShell module
export async function GET() {
  try {
    const psCommand = `
      Import-Module "C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard\\AgentManager.psm1" -Force
      Get-RunningAgentStatus | ConvertTo-Json
    `

    const { stdout } = await execAsync(`powershell -Command "${psCommand}"`)
    
    let runningAgents = []
    if (stdout.trim()) {
      try {
        runningAgents = JSON.parse(stdout) || []
        if (!Array.isArray(runningAgents)) {
          runningAgents = [runningAgents]
        }
      } catch (e) {
        console.log('No running agents found via PowerShell module')
      }
    }

    return NextResponse.json({ 
      success: true, 
      runningAgents,
      count: runningAgents.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to get agent status:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}