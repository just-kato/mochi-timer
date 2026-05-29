export function getAppUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured && !configured.includes('localhost')) return configured
  // VERCEL_URL is automatically set for all Vercel deployments
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return new URL(request.url).origin
}
