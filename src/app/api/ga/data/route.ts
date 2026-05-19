import { NextResponse } from 'next/server'
import { google } from 'googleapis'

// Server-side GA4 Data API proxy. Expects service account key in
// process.env.GA_SERVICE_ACCOUNT_KEY (JSON string) and numeric property IDs
// in process.env.GA_PROPERTY_MAIN, GA_PROPERTY_SKILLS, GA_PROPERTY_MEMBERS

const HOST_MAPPING: Record<string, string | undefined> = {
  'techbes.co.in': process.env.GA_PROPERTY_MAIN,
  'www.techbes.co.in': process.env.GA_PROPERTY_MAIN,
  'skills.techbes.co.in': process.env.GA_PROPERTY_SKILLS,
  'members.techbes.co.in': process.env.GA_PROPERTY_MEMBERS,
  'localhost': process.env.GA_PROPERTY_MAIN,
}

async function getAuthClient() {
  if (!process.env.GA_SERVICE_ACCOUNT_KEY) {
    throw new Error('GA_SERVICE_ACCOUNT_KEY not set')
  }
  const credentials = JSON.parse(process.env.GA_SERVICE_ACCOUNT_KEY)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })
  return auth
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const domain = url.searchParams.get('domain') || url.searchParams.get('host') || 'techbes.co.in'
    const propertyId = HOST_MAPPING[domain] || process.env.GA_PROPERTY_MAIN
    if (!propertyId) return NextResponse.json({ error: 'GA property not configured for domain' }, { status: 400 })

    const auth = await getAuthClient()
    const analyticsdata = google.analyticsdata({ version: 'v1beta', auth })
    const property = `properties/${propertyId}`

    // Realtime users (active users + top cities)
    let realtime: any = { error: 'unavailable' }
    try {
      const rt = await analyticsdata.properties.runRealtimeReport({
        property,
        requestBody: {
          metrics: [{ name: 'activeUsers' }],
          dimensions: [{ name: 'country' }, { name: 'city' }],
          limit: '100',
        },
      })
      realtime = rt.data || null
    } catch (e) {
      realtime = { error: String(e) }
    }

    // 7-day device breakdown and totals
    let totals: any = null
    try {
      const totalsRes = await analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'totalUsers' }, { name: 'newUsers' }],
          dimensions: [{ name: 'deviceCategory' }, { name: 'country' }],
          limit: '50',
        },
      })
      totals = totalsRes.data
    } catch (e) {
      totals = { error: String(e) }
    }

    // top pages by pagePath (7d)
    let pages: any = null
    try {
      const pagesRes = await analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          limit: '25',
        },
      })
      pages = pagesRes.data
    } catch (e) {
      pages = { error: String(e) }
    }

    // visitors today
    let visitorsToday: any = null
    try {
      const todayRes = await analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: 'today', endDate: 'today' }],
          metrics: [{ name: 'totalUsers' }],
        },
      })
      visitorsToday = todayRes.data
    } catch (e) {
      visitorsToday = { error: String(e) }
    }

    // traffic trends (7d by date)
    let trafficTrends: any = null
    try {
      const trendsRes = await analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'totalUsers' }],
          dimensions: [{ name: 'date' }],
          limit: '50',
        },
      })
      trafficTrends = trendsRes.data
    } catch (e) {
      trafficTrends = { error: String(e) }
    }

    return NextResponse.json({ realtime, totals, pages, visitorsToday, trafficTrends })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
