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

# Export functions for use
Export-ModuleMember -Function Start-ClaudeAgent