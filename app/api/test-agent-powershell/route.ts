import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { agentCommand, projectPath, agentName, projectName } = await req.json()
    
    // Convert forward slashes to backslashes for Windows
    const windowsPath = projectPath.replace(/\//g, '\\')
    
    console.log(`PowerShell Test: ${agentName} in ${windowsPath}`)
    
    // Use PowerShell module approach
    const psCommand = `powershell -Command "Import-Module 'C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard\\AgentManager.psm1' -Force; Start-ClaudeAgent -ProjectPath '${windowsPath}' -AgentCommand '${agentCommand}' -AgentName '${agentName}' -ProjectName '${projectName}'"`
    
    console.log('Executing PowerShell:', psCommand)
    
    const result = await execAsync(psCommand)
    console.log('PowerShell stdout:', result.stdout)
    console.log('PowerShell stderr:', result.stderr)
    
    const success = result.stdout.includes('SUCCESS:') || result.stderr.includes('SUCCESS:')
    
    return NextResponse.json({ 
      success,
      method: 'PowerShell Module',
      stdout: result.stdout,
      stderr: result.stderr,
      message: success ? 'Agent launched successfully' : 'Agent launch failed'
    })

  } catch (error) {
    console.error('PowerShell test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        method: 'PowerShell Module',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}