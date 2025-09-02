import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  try {
    const projects = [
      { name: 'AIBL', path: 'C:\\Users\\User\\apps\\aibl' },
      { name: 'BL2', path: 'C:\\Users\\User\\apps\\bl2' },
      { name: 'Blxero', path: 'C:\\Users\\User\\apps\\blxero' },
      { name: 'PureZone', path: 'C:\\Users\\User\\Shopify\\purezone' },
      { name: 'Upify', path: 'C:\\Users\\User\\apps\\upify' },
      { name: 'MyDiff', path: 'C:\\Users\\User\\Shopify\\mydiff' }
    ]

    const gitInfo = await Promise.all(
      projects.map(async (project) => {
        try {
          // Get current branch
          const { stdout: branch } = await execAsync(`cd "${project.path}" && git branch --show-current`, { timeout: 5000 })
          
          // Get remote URL
          const { stdout: remoteUrl } = await execAsync(`cd "${project.path}" && git config --get remote.origin.url`, { timeout: 5000 })
          
          // Convert SSH URL to HTTPS GitHub URL
          let githubUrl = remoteUrl.trim()
          if (githubUrl.startsWith('git@github.com:')) {
            githubUrl = githubUrl.replace('git@github.com:', 'https://github.com/').replace('.git', '')
          }
          
          // Add branch to URL
          const branchName = branch.trim()
          if (branchName && githubUrl.includes('github.com')) {
            githubUrl = `${githubUrl}/tree/${branchName}`
          }

          return {
            project: project.name,
            branch: branchName || 'main',
            githubUrl: githubUrl || null,
            hasGit: true
          }
        } catch (error) {
          return {
            project: project.name,
            branch: null,
            githubUrl: null,
            hasGit: false
          }
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      projects: gitInfo
    })

  } catch (error) {
    console.error('Failed to get git info:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}