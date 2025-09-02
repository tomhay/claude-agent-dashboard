# CLAUDE.md

Guidance for Claude Code when working with this Agent Management Dashboard project.

## 🚀 CURRENT STATUS

**Project:** Claude Agent Management Dashboard  
**Server:** http://localhost:3500  
**Tech Stack:** Next.js 14 + React 18 + TypeScript + Tailwind CSS  
**Purpose:** Beautiful web dashboard for managing Claude Code agents across multiple projects  
**GitHub:** https://github.com/tomhay/claude-agent-dashboard

## 🎯 ACTIVE DEVELOPMENT: Boss-Focused Productivity Analytics

### **MISSION STATEMENT**
Build a **reality-based tracking system** that measures actual developer performance and provides actionable insights for workflow improvement and project completion estimation. Focus on understanding **reality** rather than vanity metrics.

### **CORE PHILOSOPHY**
> "If all we do is measure each individual issue well and support developers to improve their practice, then that will actually create the result more than tracking every single other thing."

---

## 📋 DEVELOPMENT PLAN: Phase 1 - Foundation Metrics

### **Week 1 Objectives: Build Core Analytics Foundation**

#### **✅ 1. Commit Velocity Analysis** 
**API Endpoint:** `/api/commit-analysis`
- [x] **Last commit tracking** per developer per project
- [ ] **Commit frequency patterns** (daily/weekly cadence)  
- [ ] **Code complexity analysis** (lines changed, files touched, PR size)
- [ ] **Work pattern identification** (when developers are most productive)

**Implementation Status:**
- ✅ Created comprehensive commit analysis API
- ✅ Developer performance scoring (velocity, activity, quality, consistency)
- ✅ Manager insights and critical alerts
- ✅ Project health assessment
- 🔄 **NEXT:** Add detailed commit pattern analysis

#### **⏳ 2. Issue-to-Commit Correlation**
**Target API:** `/api/issue-correlation`
- [ ] **Map commits to specific issues** using GitHub's API
- [ ] **Calculate actual time spent** on each issue (first commit to closure)
- [ ] **Compare estimated vs actual completion time**
- [ ] **Track issue complexity accuracy** over time

**Key Metrics:**
- Issue lifecycle mapping (creation → first commit → PR → merge → close)
- Developer accuracy in time estimation
- Issue complexity patterns by project
- Commit-to-resolution correlation

#### **⏳ 3. Developer Performance Baseline**
**Target API:** `/api/developer-baseline`
- [ ] **Individual velocity scoring** (issues completed per week)
- [ ] **Quality indicators** (how many commits per issue, rework frequency)
- [ ] **Consistency metrics** (predictability of delivery)
- [ ] **Skill area analysis** (frontend vs backend vs bugs vs features)

**Performance Dimensions:**
- **Velocity**: Issues/commits per time period
- **Quality**: Rework frequency, PR review cycles
- **Consistency**: Predictable delivery patterns
- **Skill**: Area of expertise identification

---

## 🎯 IMPLEMENTATION ROADMAP

### **Phase 1: Foundation (This Week)**
- [x] ✅ **Commit Analysis API** - Real developer activity tracking
- [ ] 🔄 **Issue Correlation** - Map work to outcomes  
- [ ] ⏳ **Developer Baselines** - Individual performance profiles

### **Phase 2: Predictive Analytics (Next Week)**
- [ ] **Completion Time Estimation Engine** - Data-driven project timelines
- [ ] **Project Timeline Forecasting** - Dependencies and critical path
- [ ] **Resource Allocation Optimization** - Right developer for right task

### **Phase 3: Actionable Insights (Week 3)**
- [ ] **Developer Coaching System** - Workflow improvement suggestions
- [ ] **Boss Dashboard Views** - Management-focused insights
- [ ] **Proactive Alert System** - Early warning for project risks

---

## 📊 KEY METRICS FRAMEWORK

### **Developer Performance Scoring (0-100)**
```typescript
interface DeveloperMetrics {
  velocityScore: number      // Commit frequency vs optimal
  activityScore: number      // Recency of contributions  
  qualityScore: number       // Commit size optimization
  consistencyScore: number   // Regular work patterns
  overallScore: number       // Composite performance
}
```

### **Project Health Indicators**
- **🟢 Active**: Recent commits, multiple developers
- **🟡 Moderate**: Sporadic activity, single developer
- **🔴 Stale**: No activity 7+ days, needs attention

### **Boss-Level Insights**
- **Critical Alerts**: Immediate attention required
- **Performance Distribution**: High performers vs struggling developers  
- **Capacity Utilization**: Team efficiency assessment
- **Completion Estimates**: Data-driven project timelines

---

## 🔥 IMMEDIATE FOCUS AREAS

### **AIBL Project Crisis**
- **20+ test failure issues** (#246-#266) - needs batch resolution
- **Recent build sync** (#304) - monitor for completion
- **Developer activity analysis** required

### **BL2 Complex Feature Set**
- **Multiple critical bugs** (#144, #145) affecting user experience
- **Large feature backlog** (product management, payments, etc.)
- **Developer assignment optimization** needed

### **Cross-Project Patterns**
- **Test failure automation** - detect and auto-assign
- **Bug vs feature ratio** - ensure healthy balance
- **Developer specialization** - match skills to tasks

---

## 🛠️ TECHNICAL IMPLEMENTATION NOTES

### **🚀 CRITICAL: Background Server Launch Pattern**

**NEVER run development servers in foreground** - this blocks the chat session and kills productivity!

#### **✅ CORRECT: Background Launch via PowerShell Module**
```powershell
# Launch server in background terminal
powershell -Command "Import-Module './AgentManager.psm1' -Force; Start-DevelopmentServer -ProjectPath '$(PWD)' -ServerName 'Dashboard Server' -Port '3500'"
```

#### **❌ WRONG: Foreground Launch**
```bash
# This BLOCKS the chat session - never do this!
npm run dev
```

#### **PowerShell Module Functions**
```powershell
# For development servers
Start-DevelopmentServer -ProjectPath $path -ServerName $name -Port $port

# For Claude agents  
Start-ClaudeAgent -ProjectPath $path -AgentCommand $command -AgentName $name -ProjectName $project
```

**Benefits:**
- ✅ Server runs in separate terminal window
- ✅ Chat session remains active for continued development
- ✅ Process ID tracking for management
- ✅ Clear window titles for identification
- ✅ **PRODUCTIVITY MAINTAINED** 🎯

### **GitHub API Integration**
```typescript
// Key endpoints for analytics
const criticalEndpoints = {
  commits: 'GET /repos/{owner}/{repo}/commits',
  commitDetails: 'GET /repos/{owner}/{repo}/commits/{sha}',
  issues: 'GET /repos/{owner}/{repo}/issues',
  issueEvents: 'GET /repos/{owner}/{repo}/issues/{issue_number}/timeline',
  pullRequests: 'GET /repos/{owner}/{repo}/pulls',
  reviews: 'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews'
}
```

### **Data Structure**
```typescript
interface ProductivityData {
  developer: string
  project: string
  lastCommit: Date
  velocity: number           // commits per day
  complexity: number         // avg lines changed per commit
  consistency: number        // % of days active
  issuesCompleted: number
  avgTimePerIssue: number    // days from first commit to issue close
  workflowSuggestions: string[]
}
```

---

## 🎯 SUCCESS CRITERIA

### **Week 1 Goals**
- ✅ **Real developer activity visibility** - who's working on what
- [ ] **Accurate completion predictions** - within 20% of actual
- [ ] **Actionable workflow suggestions** - developers actually use them
- [ ] **Management-ready insights** - clear project status without digging

### **Key Questions to Answer**
1. **Reality Check**: Who's actually working and who isn't?
2. **Velocity Truth**: How fast is work really getting done?
3. **Quality Assessment**: Are developers producing sustainable code?
4. **Completion Prediction**: When will projects actually be finished?
5. **Workflow Optimization**: What specific changes will improve velocity?

---

## 📈 MEASUREMENT PHILOSOPHY

**Focus on Individual Issue Quality** → **Project Success**

> Instead of tracking dozens of vanity metrics, measure each individual issue well and support developers to improve their practice. This creates real results more than tracking every possible metric.

**Reality-Based Management**
- Track what actually happens, not what should happen
- Use data to support developers, not punish them
- Focus on workflow improvement over performance evaluation
- Predict project completion based on actual patterns, not wishful thinking

---

This document will be updated as we implement each phase. All progress and insights will be documented here to prevent loss of context or direction.