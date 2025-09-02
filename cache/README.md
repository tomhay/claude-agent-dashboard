# Local Cache Directory

This directory stores cached GitHub data to:
- Prevent API rate limits
- Speed up dashboard loading  
- Enable offline analytics

## Cache Structure
- `github-issues-{project}.json` - All issues for each project
- `github-commits-{project}.json` - Recent commits for each project
- `analytics-cache.json` - Processed analytics data
- `last-updated.json` - Cache timestamps

Cache expires after 30 minutes to ensure fresh data.