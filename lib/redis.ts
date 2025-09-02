import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache key generators
export const cacheKeys = {
  issues: (project: string) => `github:issues:${project}`,
  commits: (project: string) => `github:commits:${project}`,
  analytics: (project: string) => `analytics:${project}`,
  developerMetrics: (developer: string) => `developer:${developer}`,
  managerAlerts: () => 'manager:alerts',
  lastUpdated: (key: string) => `updated:${key}`
}

// Cache management functions
export async function getCachedData<T>(key: string, maxAgeMinutes: number = 30): Promise<T | null> {
  try {
    const lastUpdated = await redis.get(cacheKeys.lastUpdated(key))
    if (lastUpdated) {
      const ageMinutes = (Date.now() - (lastUpdated as number)) / (1000 * 60)
      if (ageMinutes < maxAgeMinutes) {
        console.log(`Using Redis cache for ${key} (${Math.round(ageMinutes)}min old)`)
        return await redis.get(key) as T
      }
    }
    return null
  } catch (error) {
    console.error(`Redis cache read error for ${key}:`, error)
    return null
  }
}

export async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    await Promise.all([
      redis.set(key, data),
      redis.set(cacheKeys.lastUpdated(key), Date.now())
    ])
    console.log(`Cached data to Redis: ${key}`)
  } catch (error) {
    console.error(`Redis cache write error for ${key}:`, error)
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`Invalidated ${keys.length} Redis cache keys matching: ${pattern}`)
    }
  } catch (error) {
    console.error(`Redis cache invalidation error:`, error)
  }
}

// GitHub data specific functions
export async function getGitHubIssues(project: string): Promise<any[] | null> {
  return await getCachedData<any[]>(cacheKeys.issues(project), 30)
}

export async function setGitHubIssues(project: string, issues: any[]): Promise<void> {
  await setCachedData(cacheKeys.issues(project), issues)
}

export async function getGitHubCommits(project: string): Promise<any[] | null> {
  return await getCachedData<any[]>(cacheKeys.commits(project), 30)
}

export async function setGitHubCommits(project: string, commits: any[]): Promise<void> {
  await setCachedData(cacheKeys.commits(project), commits)
}

// Analytics data functions
export async function getAnalytics(project: string): Promise<any | null> {
  return await getCachedData<any>(cacheKeys.analytics(project), 15) // More frequent updates for analytics
}

export async function setAnalytics(project: string, analytics: any): Promise<void> {
  await setCachedData(cacheKeys.analytics(project), analytics)
}

// Developer metrics
export async function getDeveloperMetrics(developer: string): Promise<any | null> {
  return await getCachedData<any>(cacheKeys.developerMetrics(developer), 60) // Longer cache for developer data
}

export async function setDeveloperMetrics(developer: string, metrics: any): Promise<void> {
  await setCachedData(cacheKeys.developerMetrics(developer), metrics)
}

// Manager alerts
export async function getManagerAlerts(): Promise<any | null> {
  return await getCachedData<any>(cacheKeys.managerAlerts(), 10) // Very frequent updates for alerts
}

export async function setManagerAlerts(alerts: any): Promise<void> {
  await setCachedData(cacheKeys.managerAlerts(), alerts)
}

export default redis