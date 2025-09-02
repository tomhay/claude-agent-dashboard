# Warp Terminal & Git Integration Fixes

## Problem: "Terminal is not fully functional" Warning

The warning `WARNING: terminal is not fully functional` occurs when Git tries to use a pager (like `less`) in non-interactive contexts, particularly when run through Node.js exec commands.

## Solution Applied

### 1. Global Git Configuration
Disabled pagers for all common Git commands:

```bash
git config --global pager.branch false
git config --global pager.log false  
git config --global pager.diff false
git config --global pager.show false
git config --global pager.status false
git config --global core.pager cat
```

### 2. Consistent --no-pager Usage
All Git commands in the application now use `--no-pager` flag when appropriate:

```javascript
// Good
git --no-pager log --oneline -5

// Also works now due to global config
git log --oneline -5
```

## Warp Agent Launcher Enhancement

### Problem: Opening Agents in Tmux
The original Warp launcher opened agents directly in terminal tabs, which could block the interface.

### Solution: Windows-Native Session Management
Enhanced the Warp launcher (`app/api/launch-warp-agent/route.ts`) to:

1. **Create named Warp tabs** for each agent: `ProjectName - AgentName`
2. **Proper error handling** with user-friendly messages
3. **Launch configurations** stored in `.warp/launch_configurations/`
4. **PowerShell-native execution** with Windows Terminal integration

### Benefits
- ✅ **Windows-native**: No external dependencies (tmux not required)
- ✅ **Warp-integrated**: Uses Warp's built-in launch configurations
- ✅ **Error-friendly**: Shows helpful error messages and waits for user input
- ✅ **Project-aware**: Each agent gets its own properly named tab
- ✅ **Reusable**: Launch configurations are saved for future use

### Usage
When you click the ⚡ (Warp) button in the dashboard:

1. **Creates Warp launch configuration** in `~/.warp/launch_configurations/`
2. **Opens new Warp tab** with proper working directory
3. **Displays session info** (project, agent, directory)
4. **Runs agent** with error handling
5. **Keeps tab open** on errors for debugging

### Manual Warp Usage
You can also use the launch configurations manually:

1. **Command Palette**: `Ctrl+Shift+P` → "Launch Configuration"
2. **Select configuration**: Choose your project-agent combo
3. **Direct launch**: Warp opens new tab and runs the agent

Configurations are saved in: `%USERPROFILE%\.warp\launch_configurations\`

## Environment Requirements

For optimal functionality, ensure:

1. **Warp terminal installed**: https://www.warp.dev/download
2. **Claude CLI available**: In your PATH
3. **PowerShell 5.1+**: (Standard on Windows 10/11)

## Testing the Fix

Run these commands to verify the fixes:

```bash
# Should work without warnings
git branch
git log --oneline -3
git status

# Should work with explicit flag
git --no-pager branch
```

## Troubleshooting

### If pager warnings persist:
```bash
# Check your Git config
git config --list | grep pager

# Reset if needed
git config --global --unset core.pager
git config --global core.pager cat
```

### If Warp doesn't launch:
- Verify installation: https://www.warp.dev/download
- Check PATH: `where warp` or `Get-Command warp`
- Try manual launch first

---
*Updated: 2025-09-02*
*Related: Issue #2 - Workflow testing and professional Git practices*
