import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { windowTitle, processId } = await req.json()

    console.log(`Focusing terminal: ${windowTitle} (PID: ${processId})`)

    // PowerShell command to find and focus the terminal window
    const focusCommand = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
          [DllImport("user32.dll")]
          public static extern bool SetForegroundWindow(IntPtr hWnd);
          [DllImport("user32.dll")]
          public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
          [DllImport("user32.dll")]
          public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        }
"@
      
      # Find window by title containing the agent name
      $windows = Get-Process | Where-Object { $_.ProcessName -eq "cmd" -and $_.MainWindowTitle -like "*${windowTitle}*" }
      
      if ($windows) {
        $window = $windows[0]
        [Win32]::ShowWindow($window.MainWindowHandle, 9)  # SW_RESTORE
        [Win32]::SetForegroundWindow($window.MainWindowHandle)
        Write-Output "Focused terminal window: $($window.MainWindowTitle)"
      } else {
        Write-Output "Terminal window not found for: ${windowTitle}"
      }
    `.replace(/\n\s+/g, ' ')

    await execAsync(`powershell -Command "${focusCommand}"`)

    return NextResponse.json({ 
      success: true, 
      message: `Focused terminal for ${windowTitle}` 
    })

  } catch (error) {
    console.error('Failed to focus terminal:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}