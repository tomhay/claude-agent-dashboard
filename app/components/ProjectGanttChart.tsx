'use client'

import { useMemo } from 'react'

interface Issue {
  number: number
  title: string
  agentEstimate?: {
    estimatedHours: number
    complexity: string
  }
  reality?: {
    hasStarted: boolean
    daysWorked: number
    firstCommitDate?: string
    lastCommitDate?: string
  }
  tracking?: {
    status: string
    completionPrediction?: {
      predictedDate: string
    }
  }
  issue: {
    createdAt: string
    closedAt?: string
    state: string
  }
}

interface ProjectGanttChartProps {
  issues: Issue[]
  projectName: string
}

export default function ProjectGanttChart({ issues, projectName }: ProjectGanttChartProps) {
  // Generate 180 days starting from 60 days ago
  const timelineData = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 60) // Start 60 days ago
    
    const days = []
    for (let i = 0; i < 180; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push({
        date: date,
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'long' }),
        monthShort: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: date.toDateString() === today.toDateString(),
        dayOfWeek: date.getDay()
      })
    }
    
    return days
  }, [])

  // Group days by month for header
  const monthGroups = useMemo(() => {
    const groups: { month: string; days: typeof timelineData; startIndex: number }[] = []
    let currentMonth = ''
    let currentGroup: typeof timelineData = []
    let startIndex = 0
    
    timelineData.forEach((day, index) => {
      if (day.month !== currentMonth) {
        if (currentGroup.length > 0) {
          groups.push({ month: currentMonth, days: currentGroup, startIndex })
        }
        currentMonth = day.month
        currentGroup = [day]
        startIndex = index
      } else {
        currentGroup.push(day)
      }
    })
    
    if (currentGroup.length > 0) {
      groups.push({ month: currentMonth, days: currentGroup, startIndex })
    }
    
    return groups
  }, [timelineData])

  // Calculate issue timeline positions
  const calculateTimelinePosition = (issue: Issue) => {
    const today = new Date()
    
    // Predicted timeline
    const createdDate = new Date(issue.issue.createdAt)
    const estimatedDays = issue.agentEstimate ? Math.ceil(issue.agentEstimate.estimatedHours / 8) : 5
    const predictedEndDate = new Date(createdDate)
    predictedEndDate.setDate(predictedEndDate.getDate() + estimatedDays)
    
    // Actual timeline
    let actualStartDate = null
    let actualEndDate = null
    
    if (issue.reality?.hasStarted && issue.reality.firstCommitDate) {
      actualStartDate = new Date(issue.reality.firstCommitDate)
      if (issue.issue.state === 'closed' && issue.issue.closedAt) {
        actualEndDate = new Date(issue.issue.closedAt)
      } else if (issue.reality.lastCommitDate) {
        actualEndDate = new Date(issue.reality.lastCommitDate)
      } else {
        actualEndDate = today
      }
    }
    
    return {
      predicted: {
        startDate: createdDate,
        endDate: predictedEndDate,
        startIndex: Math.floor((createdDate.getTime() - timelineData[0].date.getTime()) / (1000 * 60 * 60 * 24)),
        duration: estimatedDays
      },
      actual: actualStartDate ? {
        startDate: actualStartDate,
        endDate: actualEndDate,
        startIndex: Math.floor((actualStartDate.getTime() - timelineData[0].date.getTime()) / (1000 * 60 * 60 * 24)),
        duration: actualEndDate ? Math.ceil((actualEndDate.getTime() - actualStartDate.getTime()) / (1000 * 60 * 60 * 24)) : 1
      } : null
    }
  }

  const todayIndex = timelineData.findIndex(day => day.isToday)
  const milestoneIndex = timelineData.findIndex(day => {
    const sep7 = new Date('2025-09-07')
    return day.date.toDateString() === sep7.toDateString()
  })

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-medium text-slate-900">{projectName} Timeline - Predicted vs Actual</h3>
        <div className="text-sm text-slate-600">Day-by-day view • Scroll to see full 180-day timeline</div>
      </div>
      
      <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
        <div className="min-w-max">
          {/* Month Headers */}
          <div className="sticky top-0 bg-gray-50 border-b">
            <div className="flex">
              <div className="w-64 p-2 font-medium text-sm text-slate-900">Issues</div>
              {monthGroups.map((group) => (
                <div 
                  key={group.month} 
                  className="border-l border-gray-300 text-center text-xs font-medium text-slate-700 py-2"
                  style={{ width: `${group.days.length * 24}px` }}
                >
                  {group.month}
                </div>
              ))}
            </div>
          </div>

          {/* Day Headers */}
          <div className="sticky top-8 bg-gray-50 border-b">
            <div className="flex">
              <div className="w-64 p-1"></div>
              {timelineData.map((day, index) => (
                <div 
                  key={index}
                  className={`w-6 h-6 text-xs text-center flex items-center justify-center border-r border-gray-200 ${
                    day.isToday ? 'bg-blue-100 text-blue-800 font-bold' :
                    day.dayOfWeek === 0 || day.dayOfWeek === 6 ? 'bg-gray-100 text-gray-500' :
                    'text-gray-700'
                  }`}
                >
                  {day.dayNumber}
                </div>
              ))}
            </div>
          </div>

          {/* Issue Rows */}
          <div>
            {issues.slice(0, 10).map((issue) => {
              const timeline = calculateTimelinePosition(issue)
              
              return (
                <div key={issue.number} className="border-b hover:bg-gray-50">
                  {/* Issue Info */}
                  <div className="flex">
                    <div className="w-64 p-3 border-r">
                      <div className="text-sm font-medium">#{issue.number}</div>
                      <div className="text-xs text-slate-600 truncate">{issue.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {issue.agentEstimate?.estimatedHours || 0}h ({issue.agentEstimate?.complexity || 'unknown'})
                      </div>
                    </div>
                    
                    {/* Timeline Days */}
                    <div className="flex">
                      {timelineData.map((day, dayIndex) => (
                        <div 
                          key={dayIndex} 
                          className="w-6 h-16 border-r border-gray-200 relative"
                        >
                          {/* Today Marker */}
                          {day.isToday && (
                            <div className="absolute inset-0 bg-blue-200 opacity-30"></div>
                          )}
                          
                          {/* Milestone Marker */}
                          {dayIndex === milestoneIndex && (
                            <div className="absolute inset-0 bg-red-200 opacity-40 border-l-2 border-red-500"></div>
                          )}
                          
                          {/* Predicted Timeline */}
                          {dayIndex >= timeline.predicted.startIndex && 
                           dayIndex < timeline.predicted.startIndex + timeline.predicted.duration && (
                            <div className="absolute top-2 left-0.5 right-0.5 h-2 bg-gray-300 rounded-sm"></div>
                          )}
                          
                          {/* Actual Timeline */}
                          {timeline.actual && 
                           dayIndex >= timeline.actual.startIndex && 
                           dayIndex < timeline.actual.startIndex + timeline.actual.duration && (
                            <div className={`absolute top-5 left-0.5 right-0.5 h-2 rounded-sm ${
                              issue.tracking?.status === 'on-track' ? 'bg-green-500' :
                              issue.tracking?.status === 'at-risk' ? 'bg-yellow-500' :
                              issue.tracking?.status === 'overdue' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      issue.tracking?.status === 'on-track' ? 'bg-green-100 text-green-700' :
                      issue.tracking?.status === 'at-risk' ? 'bg-yellow-100 text-yellow-700' :
                      issue.tracking?.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      issue.issue.state === 'closed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {issue.issue.state === 'closed' ? '✅ DONE' :
                       issue.tracking?.status === 'overdue' ? '🔴 OVERDUE' :
                       issue.tracking?.status === 'at-risk' ? '🟡 AT RISK' :
                       issue.reality?.hasStarted ? '🟢 IN PROGRESS' : '⚪ NOT STARTED'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="text-xs text-slate-600 mb-2">Legend:</div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                <span>Predicted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                <span>Actual (On Track)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 bg-red-500 rounded-sm"></div>
                <span>Actual (Overdue)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-1 bg-blue-200"></div>
                <span>Today</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-1 bg-red-200 border-l-2 border-red-500"></div>
                <span>Milestone</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}