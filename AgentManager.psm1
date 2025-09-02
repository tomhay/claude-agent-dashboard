# Claude Agent Manager PowerShell Module
# Enhanced terminal management for agent workflows

# Function to create enhanced terminal window with custom title
function Start-ClaudeAgent {
    param(
        [string]$ProjectPath,
        [string]$AgentCommand,
        [string]$AgentName,
        [string]$ProjectName
    )
    
    Write-Host "Start-ClaudeAgent called with:"
    Write-Host "  ProjectPath: $ProjectPath"
    Write-Host "  AgentCommand: $AgentCommand"
    Write-Host "  AgentName: $AgentName" 
    Write-Host "  ProjectName: $ProjectName"
    
    $timestamp = Get-Date -Format "HH:mm"
    $windowTitle = "$ProjectName - $AgentName - $timestamp"
    
    # Create command for launching Claude
    if ([string]::IsNullOrEmpty($AgentCommand)) {
        # Just launch Claude without specific agent
        $cmdArgs = "/k `"cd /d `"$ProjectPath`" && title `"$windowTitle`" && claude --dangerously-skip-permissions`""
    } else {
        # Launch Claude with specific agent
        $cmdArgs = "/k `"cd /d `"$ProjectPath`" && title `"$windowTitle`" && claude --dangerously-skip-permissions `"$AgentCommand`"`""
    }
    
    Write-Host "Launching cmd.exe with args: $cmdArgs"
    
    # Start the process
    try {
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -PassThru
        
        # Wait a moment for the process to actually start
        Start-Sleep -Milliseconds 500
        
        # Output in format that Node.js can easily parse
        Write-Host "SUCCESS:ProcessId:$($process.Id):WindowTitle:$windowTitle"
        Write-Output "SUCCESS:ProcessId:$($process.Id):WindowTitle:$windowTitle"
        
        return $process.Id
    } catch {
        Write-Host "ERROR:$_"
        Write-Output "ERROR:$_"
        return $null
    }
}

# Function to start development server in background
function Start-DevelopmentServer {
    param(
        [string]$ProjectPath,
        [string]$ServerName = "Dashboard Server",
        [string]$Port = "3500"
    )
    
    Write-Host "Start-DevelopmentServer called with:"
    Write-Host "  ProjectPath: $ProjectPath"
    Write-Host "  ServerName: $ServerName" 
    Write-Host "  Port: $Port"
    
    $timestamp = Get-Date -Format "HH:mm"
    $windowTitle = "$ServerName - Port $Port - $timestamp"
    
    # Create command for launching the server
    $cmdArgs = "/k `"cd /d `"$ProjectPath`" && title `"$windowTitle`" && npm run dev`""
    
    Write-Host "Launching server with cmd.exe args: $cmdArgs"
    
    # Start the process
    try {
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -PassThru
        
        # Wait a moment for the process to actually start
        Start-Sleep -Milliseconds 1000
        
        # Output in format that Node.js can easily parse
        Write-Host "SUCCESS:ProcessId:$($process.Id):WindowTitle:$windowTitle:Port:$Port"
        Write-Output "SUCCESS:ProcessId:$($process.Id):WindowTitle:$windowTitle:Port:$Port"
        
        return $process.Id
    } catch {
        Write-Host "ERROR:$_"
        Write-Output "ERROR:$_"
        return $null
    }
}

# Function to start Warp terminal in new tab instead of new window
function Start-WarpAgent {
    param(
        [string]$ProjectPath,
        [string]$AgentCommand,
        [string]$AgentName,
        [string]$ProjectName
    )
    
    Write-Host "Start-WarpAgent called with:"
    Write-Host "  ProjectPath: $ProjectPath"
    Write-Host "  AgentCommand: $AgentCommand"
    Write-Host "  AgentName: $AgentName" 
    Write-Host "  ProjectName: $ProjectName"
    
    # Check for Warp installation
    $warpPaths = @(
        "$env:LOCALAPPDATA\Programs\Warp\warp.exe",
        "${env:ProgramFiles}\Warp\warp.exe"
    )
    
    $warpPath = $null
    foreach ($path in $warpPaths) {
        if (Test-Path $path) {
            $warpPath = $path
            break
        }
    }
    
    if (-not $warpPath) {
        Write-Host "ERROR: Warp terminal not found. Please install from https://www.warp.dev/download"
        Write-Output "ERROR: Warp terminal not found"
        return $null
    }
    
    $tabTitle = "$ProjectName - $AgentName"
    
    # Create command for launching Warp in new tab
    if ([string]::IsNullOrEmpty($AgentCommand)) {
        # Just launch Claude without specific agent
        $warpArgs = @(
            '--tab',
            "--title=$tabTitle",
            "--cwd=$ProjectPath",
            '--exec=claude --dangerously-skip-permissions'
        )
    } else {
        # Launch Claude with specific agent
        $warpArgs = @(
            '--tab',
            "--title=$tabTitle",
            "--cwd=$ProjectPath",
            "--exec=claude --dangerously-skip-permissions `"$AgentCommand`""
        )
    }
    
    Write-Host "Launching Warp with args: $($warpArgs -join ' ')"
    
    # Start the process
    try {
        $process = Start-Process -FilePath $warpPath -ArgumentList $warpArgs -PassThru
        
        # Wait a moment for the process to actually start
        Start-Sleep -Milliseconds 800
        
        # Output in format that Node.js can easily parse
        Write-Host "SUCCESS:ProcessId:$($process.Id):TabTitle:$tabTitle:Method:NewTab"
        Write-Output "SUCCESS:ProcessId:$($process.Id):TabTitle:$tabTitle:Method:NewTab"
        
        return $process.Id
    } catch {
        Write-Host "ERROR:$_"
        Write-Output "ERROR:$_"
        return $null
    }
}

# Export functions for use
Export-ModuleMember -Function Start-ClaudeAgent, Start-DevelopmentServer, Start-WarpAgent
