import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { agentId, projectPath, agentName, projectName } = await req.json()
    
    console.log(`Warp Launch: ${agentName} in ${projectPath}`)
    
    // Get agent command from the same mapping as regular agents
    const agentCommands: Record<string, string> = {
      // Universal Agents
      'universal-sod-reviewer': 'Review all SOD agents across projects. Read each project CLAUDE.md, analyze SOD agent effectiveness, and update SOD agents to be more project-specific and relevant.',
      'universal-agent-updater': 'Scan all .claude/agents/ directories across projects, analyze agent effectiveness, remove outdated agents, and update agent definitions.',
      
      // AIBL agents
      'aibl-sod': '@sod-agent Generate AIBL start of day report',
      'aibl-eod': '@eod-agent Generate AIBL end of day report',
      'aibl-dca': '@aibl-daily-cleanup-agent Generate daily cleanup analysis',
      'aibl-issue-cleanup': 'AIBL GitHub Issue Review Agent: Systematically review all GitHub issues in BaliLove/chat-langchain repository using GitHub CLI. For each issue, determine if it is: (1) Still relevant and actionable, (2) Already resolved but not closed, (3) Duplicate of another issue, (4) Test failure that has been superseded. Only close issues that are genuinely obsolete or resolved.',
      
      // BL2 agents  
      'bl2-sod': '@sod-agent Generate BL2 start of day report',
      'bl2-eod': '@eod-agent Generate BL2 end of day report',
      
      // BaliLove agents
      'balilove-sod': '@sod-agent Generate BaliLove start of day report',
      'balilove-eod': '@eod-agent Generate BaliLove end of day report',
      'balilove-dca': '@daily-cleanup-agent Generate BaliLove daily cleanup analysis',
      'balilove-sanity': '@sanity-cms-agent Analyze Sanity CMS content',
      'balilove-venues': '@venue-manager-agent Review wedding venues',
      'balilove-seo': '@seo-optimizer-agent Run SEO optimization'
    }

    const command = agentCommands[agentId] || `Run ${agentName} agent`
    
    // Check if Warp is installed
    const warpPaths = [
      'C:\\Users\\User\\AppData\\Local\\Programs\\Warp\\warp.exe',
      'C:\\Program Files\\Warp\\warp.exe',
      '%LOCALAPPDATA%\\Programs\\Warp\\warp.exe'
    ]
    
    let warpPath = null
    for (const pathOption of warpPaths) {
      if (fs.existsSync(pathOption.replace('%LOCALAPPDATA%', process.env.LOCALAPPDATA || ''))) {
        warpPath = pathOption
        break
      }
    }
    
    if (!warpPath) {
      return NextResponse.json({
        success: false,
        error: 'Warp terminal not found. Please install Warp terminal.',
        installUrl: 'https://www.warp.dev/download'
      })
    }

    // Create Warp launch configuration for this agent
    const configDir = path.join(process.env.USERPROFILE || '', '.warp', 'launch_configurations')
    const configFile = path.join(configDir, `${projectName.toLowerCase()}-${agentName.toLowerCase().replace(/\s+/g, '-')}.yaml`)
    
    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    // Create tmux session name for this agent
    const tmuxSessionName = `${projectName.toLowerCase()}-${agentName.toLowerCase().replace(/\s+/g, '-')}`
    
    // Create launch configuration YAML with tmux support
    const launchConfig = `name: ${projectName} ${agentName}
windows:
  - tabs:
    - title: "${projectName} - ${agentName}"
      cwd: "${projectPath.replace(/\\/g, '\\\\')}"
      exec: |
        # Create or attach to tmux session for this agent
        if (tmux has-session -t ${tmuxSessionName} 2>$null) {
          Write-Host "Attaching to existing tmux session: ${tmuxSessionName}"
          tmux attach-session -t ${tmuxSessionName}
        } else {
          Write-Host "Creating new tmux session: ${tmuxSessionName}"
          tmux new-session -d -s ${tmuxSessionName} -c "${projectPath.replace(/\\/g, '\\\\')}"
          tmux send-keys -t ${tmuxSessionName} "claude --dangerously-skip-permissions '${command.replace(/'/g, "\\'")}'" Enter
          tmux attach-session -t ${tmuxSessionName}
        }
`

    // Write launch configuration
    fs.writeFileSync(configFile, launchConfig)
    console.log(`Created Warp config: ${configFile}`)

    // Launch Warp with the configuration
    // Method 1: Try direct launch with config
    const warpCommand = `"${warpPath}" --launch-config "${configFile}"`
    
    try {
      const result = await execAsync(warpCommand)
      console.log('Warp launched successfully:', result.stdout)
      
      return NextResponse.json({
        success: true,
        method: 'Warp Terminal',
        configFile,
        stdout: result.stdout,
        message: `Launched ${agentName} in Warp terminal`
      })
    } catch (error) {
      // Fallback: Launch Warp normally and let user open the config manually
      try {
        await execAsync(`"${warpPath}"`)
        
        return NextResponse.json({
          success: true,
          method: 'Warp Terminal (Manual)',
          configFile,
          message: `Warp launched. Use Command Palette -> Launch Configuration -> ${projectName} ${agentName}`,
          instructions: [
            '1. Open Command Palette in Warp (Ctrl+Shift+P)',
            '2. Type "Launch Configuration"',
            `3. Select "${projectName} ${agentName}"`,
            '4. Agent will start in new tab'
          ]
        })
      } catch (fallbackError) {
        return NextResponse.json({
          success: false,
          error: `Failed to launch Warp: ${fallbackError}`,
          warpPath,
          installUrl: 'https://www.warp.dev/download'
        })
      }
    }

  } catch (error) {
    console.error('Warp launch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Make sure Warp terminal is installed from https://www.warp.dev/download'
      },
      { status: 500 }
    )
  }
}