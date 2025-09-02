# Claude Agent Management Dashboard

A beautiful, comprehensive web dashboard for managing Claude Code agents across multiple projects. Built with Next.js 14, React 18, TypeScript, and Tailwind CSS.

![Dashboard Preview](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-blue?style=flat-square&logo=tailwindcss)

## 🚀 Features

### ✅ **Visual Agent Management**
- **Grid Layout**: See all agents across 6+ projects in one view
- **Real-time Status**: Live tracking of running agents with color-coded indicators
- **One-Click Execution**: Launch any agent with a single button click
- **Terminal Management**: Focus running terminal windows with dedicated buttons

### ✅ **Universal Agents (Meta-Agents)**
- **SOD Agent Reviewer**: Reviews and optimizes all Start-of-Day agents
- **Agent Updater**: Maintains agent definitions across projects
- **Cross-Project Sync**: Synchronizes improvements across projects
- **Bulk Operations**: Run all SOD/EOD/DCA agents simultaneously
- **Issue Management**: Plan, execute, and review GitHub issues

### ✅ **GitHub Integration**
- **Universal Issues Tab**: View GitHub issues across all projects
- **Workflow Management**: Automatic stage tracking (backlog → planning → development → review → deploy)
- **Agent Assignment**: Assign specific agents to GitHub issues
- **Productivity Metrics**: Progress tracking, time estimation, completion predictions
- **Advanced Filtering**: Filter by project, stage, complexity, labels

### ✅ **Project Support**
- **AIBL**: Wedding business platform (Next.js + LangGraph + Redis)
- **BL2**: GitHub project management system
- **Blxero**: Financial data and sync automation
- **PureZone**: Shopify theme optimization
- **Upify**: SaaS platform with AI agents
- **MyDiff**: Shopify theme development
- **BaliLove**: Wedding venue platform (Sanity CMS)

## 🏗️ Architecture

### **Frontend**
- **Next.js 14** with App Router
- **Tailwind CSS** with custom components
- **TanStack Table** for advanced data tables
- **Lucide React** for icons
- **TypeScript** for type safety

### **Backend APIs**
- `/api/enhanced-run-agent` - Primary agent execution with PowerShell integration
- `/api/check-running-agents` - Real-time terminal detection and status
- `/api/github-issues` - GitHub repository and issue management
- `/api/focus-terminal` - Windows API integration for terminal focusing
- `/api/get-git-info` - Git repository and branch detection

### **PowerShell Integration**
- **AgentManager.psm1**: Custom PowerShell module for enhanced terminal management
- **Terminal Tracking**: Process monitoring with custom window titles
- **Focus Management**: Windows API integration for terminal switching

## 🎯 Quick Start

### **Prerequisites**
- Node.js 18+
- PowerShell 5.1+ (Windows)
- Claude Code CLI installed and in PATH
- Git for GitHub integration

### **Installation**

1. **Clone and Setup**
   ```bash
   git clone https://github.com/tomhay/claude-agent-dashboard.git
   cd claude-agent-dashboard
   npm install
   ```

2. **Configure GitHub Integration** (Optional)
   ```bash
   cp .env.example .env.local
   # Add your GitHub token to .env.local
   GITHUB_TOKEN=your_github_token_here
   ```

3. **Update Project Paths**
   Edit project paths in `/app/page.tsx` to match your local setup:
   ```typescript
   const projectPaths: Record<string, string> = {
     'AIBL': 'C:\\Users\\User\\apps\\aibl',
     'BL2': 'C:\\Users\\User\\apps\\bl2',
     // ... update paths for your system
   }
   ```

4. **Start the Dashboard**
   ```bash
   npm run dev
   ```

5. **Open Dashboard**
   Navigate to [http://localhost:3001](http://localhost:3001)

## 🎮 Usage

### **Daily Workflow**
1. **Morning**: Click "Run All SOD" → 6 terminals open with Start-of-Day reports
2. **Development**: Use "Launch Claude" buttons for project-specific work
3. **Issue Management**: Switch to "Universal Issues" tab for GitHub integration
4. **Evening**: Click "Run All EOD" → 6 terminals with End-of-Day summaries

### **Agent Management**
- **👁️ Eye Button**: View agent prompts and descriptions
- **▶️ Play Button**: Execute agents with visual feedback
- **🖥️ Terminal Button**: Focus running terminal windows (appears when agent is running)
- **GitHub Links**: Direct access to repositories and branches

### **Issue Management**
- **Filter & Search**: By project, stage, complexity, labels
- **Agent Assignment**: Assign project-specific or universal agents to issues
- **Progress Tracking**: Real-time metrics and completion predictions
- **Bulk Operations**: Select multiple issues for batch processing

## 🎨 Color Coding

- **🔵 Blue Dots**: Running agents (with pulsing animation)
- **🟢 Green Dots**: Completed agents
- **⚫ Gray Dots**: Idle agents
- **🔴 Red Dots**: Failed agents

## ⚡ Advanced Features

### **Terminal Management**
- **Custom Titles**: Format: "ProjectName - AgentName - HH:MM"
- **Process Tracking**: Global tracking of all running agents
- **Focus Integration**: Windows API for seamless terminal switching
- **Real-time Status**: 5-second polling for live updates

### **Agent Categories**
1. **Daily Operations**: SOD, EOD, DCA agents per project
2. **Workflow Agents**: PR & Deploy, GitHub management, monitoring
3. **Universal Meta-Agents**: Cross-project analysis and optimization
4. **Project-Specific**: Core systems, integrations, specialized tools

### **GitHub Workflow Stages**
- **Backlog**: New/unassigned issues
- **Planning**: Issues with planning labels
- **Development**: Issues with development labels
- **Review**: Issues in review state
- **Deploy**: Issues ready for deployment

## 🔧 Configuration

### **Project Paths**
Update in `app/page.tsx`:
```typescript
const projectPaths: Record<string, string> = {
  'Universal': 'C:\\Users\\User\\apps',
  'AIBL': 'C:\\Users\\User\\apps\\aibl',
  // ... your project paths
}
```

### **GitHub Repositories**
Update in `app/api/github-issues/route.ts`:
```typescript
const projectRepos: Record<string, { owner: string; repo: string }> = {
  'AIBL': { owner: 'your-username', repo: 'your-repo' },
  // ... your repositories
}
```

### **Agent Commands**
All agent commands are defined in `app/page.tsx` in the `agentPrompts` object.

## 📊 Success Metrics

### **Developer Productivity**
- ✅ **Reduced Context Switching**: All projects visible in one dashboard
- ✅ **Faster Agent Access**: 1-click execution vs manual navigation
- ✅ **Better Status Visibility**: Know what's running across all projects
- ✅ **Improved Workflow**: Batch operations for daily routines

### **Agent Management Efficiency**
- ✅ **Centralized Control**: Manage 30+ agents from single interface
- ✅ **Real-time Monitoring**: See agent status without hunting terminals
- ✅ **Cross-Project Insights**: Universal agents provide project comparisons
- ✅ **Automated Maintenance**: Meta-agents keep other agents optimized

## 🛠️ Troubleshooting

### **Agent Not Launching**
1. Ensure Claude Code CLI is installed: `claude --version`
2. Check project paths in configuration
3. Verify PowerShell execution policy: `Get-ExecutionPolicy`
4. Check agent command mappings in `app/page.tsx`

### **GitHub Issues Not Loading**
1. Verify GitHub token in `.env.local`
2. Check token permissions: `repo`, `public_repo`, `issues:write`
3. Update repository information in `api/github-issues/route.ts`
4. Check repository access permissions

### **Terminal Focus Not Working**
1. Ensure Windows API integration is available
2. Check PowerShell module is loading correctly
3. Verify terminal titles match tracking format

## 🔒 Security

- **Local Only**: Dashboard runs on localhost, no external access
- **No Elevated Permissions**: All operations run as current user
- **GitHub Token**: Store securely in `.env.local` (not committed)
- **PowerShell Execution**: Uses standard Windows process creation

## 📈 Future Enhancements

- **Agent Templates**: Reusable configurations for new projects
- **Team Collaboration**: Share agent configurations and results
- **Scheduling**: Automated agent execution on timers
- **Desktop Notifications**: Alerts when agents complete
- **Analytics Dashboard**: Track agent usage and performance
- **Mobile Support**: Responsive design for mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Claude Code**: The AI pair programmer that makes this possible
- **Next.js Team**: For the amazing React framework
- **Tailwind CSS**: For the utility-first CSS framework
- **TanStack**: For the powerful table components
- **Lucide**: For the beautiful icon library

---

**Built with ❤️ for Claude Code agent management**