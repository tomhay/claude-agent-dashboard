import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { agentCommand, projectPath, agentName, projectName } = await req.json()
    
    console.log(`Direct Test: ${agentName} in ${projectPath}`)
    
    // Direct approach - use simple cmd start command
    const windowTitle = `${projectName}-${agentName}-${new Date().toLocaleTimeString()}`
    const directCommand = `cmd.exe /c "start \\"${windowTitle}\\" /D \\"${projectPath}\\" cmd.exe /k \\"title ${windowTitle} && claude --dangerously-skip-permissions \\\\\\"${agentCommand}\\\\\\"\\""`
    
    console.log('Executing Direct Command:', directCommand)
    
    const result = await execAsync(directCommand)
    console.log('Direct stdout:', result.stdout)
    console.log('Direct stderr:', result.stderr)
    
    // Direct approach doesn't give us process info, so check if command executed
    const success = true // If no error thrown, assume success
    
    return NextResponse.json({ 
      success,
      method: 'Direct CMD',
      stdout: result.stdout,
      stderr: result.stderr,
      command: directCommand,
      message: 'Direct launch attempted'
    })

  } catch (error) {
    console.error('Direct test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        method: 'Direct CMD',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}