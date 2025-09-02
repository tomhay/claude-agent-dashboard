import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { projectPath, serverName = "Dashboard Server", port = "3500" } = await req.json()
    
    console.log(`Starting development server: ${serverName} on port ${port}`)
    console.log(`Project path: ${projectPath}`)
    
    // Convert forward slashes to backslashes for Windows
    const windowsPath = projectPath?.replace(/\//g, '\\') || 'C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard'
    
    // Use PowerShell module to launch server in background
    const psCommand = `powershell -Command "Import-Module 'C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard\\AgentManager.psm1' -Force; Start-DevelopmentServer -ProjectPath '${windowsPath}' -ServerName '${serverName}' -Port '${port}'"`
    
    console.log('Executing PowerShell command:', psCommand)
    const result = await execAsync(psCommand)
    
    console.log('PowerShell stdout:', result.stdout)
    console.log('PowerShell stderr:', result.stderr)
    
    const success = result.stdout.includes('SUCCESS:') || result.stderr.includes('SUCCESS:')
    
    // Parse the output to extract process info
    let processId = null
    let windowTitle = null
    
    const successLine = (result.stdout + result.stderr).split('\n').find(line => line.includes('SUCCESS:'))
    if (successLine) {
      const parts = successLine.split(':')
      if (parts.length >= 6) {
        processId = parts[2]
        windowTitle = parts[4]
      }
    }
    
    // Log the server launch for tracking
    const logEntry = {
      serverName,
      projectPath: windowsPath,
      port,
      processId,
      windowTitle,
      timestamp: new Date().toISOString(),
      status: 'launched'
    }
    
    console.log('Server launch logged:', logEntry)
    
    return NextResponse.json({ 
      success, 
      message: success 
        ? `Launched ${serverName} on port ${port} in background terminal` 
        : `Failed to launch ${serverName}`,
      processId,
      windowTitle,
      url: `http://localhost:${port}`,
      stdout: result.stdout,
      stderr: result.stderr,
      logEntry 
    })
    
  } catch (error) {
    console.error('Failed to start server:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to launch development server in background'
      },
      { status: 500 }
    )
  }
}
