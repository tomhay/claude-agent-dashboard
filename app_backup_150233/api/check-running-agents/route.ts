import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Check for running cmd.exe processes with titles containing "Agent"
    const checkCommand = `
      Get-Process cmd -ErrorAction SilentlyContinue | 
      Where-Object { $_.MainWindowTitle -like "*Agent*" } | 
      Select-Object Id, MainWindowTitle, @{Name="CommandLine";Expression={
        try {
          (Get-WmiObject Win32_Process | Where-Object { $_.ProcessId -eq $_.Id }).CommandLine
        } catch {
          "N/A"
        }
      }} | 
      ConvertTo-Json
    `

    const { stdout } = await execAsync(`powershell -Command "${checkCommand}"`)
    
    let runningProcesses = []
    if (stdout.trim()) {
      try {
        const parsed = JSON.parse(stdout)
        runningProcesses = Array.isArray(parsed) ? parsed : [parsed]
      } catch (e) {
        console.log('No running Claude processes found')
      }
    }

    // Parse the running processes to extract agent information
    const runningAgents = runningProcesses
      .filter(proc => proc.MainWindowTitle && proc.MainWindowTitle.includes('Agent'))
      .map(proc => {
        const windowTitle = proc.MainWindowTitle
        let agentName = 'Unknown'
        let projectName = 'Unknown'
        let projectPath = ''

        // Parse window title format: "BL2 - SOD Agent - 13:45"
        const titleMatch = windowTitle.match(/^(\w+)\s*-\s*(.+?)\s*-\s*\d+:\d+$/)
        if (titleMatch) {
          projectName = titleMatch[1]
          agentName = titleMatch[2]
          
          // Map project names to paths
          const projectPaths: Record<string, string> = {
            'AIBL': 'C:\\Users\\User\\apps\\aibl',
            'BL2': 'C:\\Users\\User\\apps\\bl2',
            'Blxero': 'C:\\Users\\User\\apps\\blxero',
            'PureZone': 'C:\\Users\\User\\Shopify\\purezone',
            'Upify': 'C:\\Users\\User\\apps\\upify',
            'MyDiff': 'C:\\Users\\User\\Shopify\\mydiff'
          }
          projectPath = projectPaths[projectName] || ''
        }

        return {
          processId: proc.Id,
          windowTitle: proc.MainWindowTitle,
          agentName,
          projectName,
          projectPath,
          commandLine: proc.CommandLine || 'N/A',
          startTime: new Date() // We could get actual start time with more complex query
        }
      })

    return NextResponse.json({ 
      success: true, 
      runningAgents,
      count: runningAgents.length
    })

  } catch (error) {
    console.error('Failed to check running agents:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}