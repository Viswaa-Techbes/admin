export const metadata = {
  title: 'Analytics - Members',
}

export default function AnalyticsMembersPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Analytics — Members subdomain</h1>
      <p>This page will surface aggregated metrics from the Google Analytics Data API for <strong>members.techbes.co.in</strong>.</p>
      <p>Planned metrics: total visitors, realtime users, top cities, top pages, device breakdown, traffic trends.</p>
  "use client"
  import { useEffect, useState } from "react"

  export const metadata = {
    title: 'Analytics - Members',
  }

  export default function AnalyticsMembersPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      fetch('/api/ga/data?domain=members.techbes.co.in')
        .then((r) => r.json())
        .then((j) => setData(j))
        .catch((e) => setData({ error: String(e) }))
        .finally(() => setLoading(false))
    }, [])

    return (
      <div style={{ padding: 24 }}>
        <h1>Analytics — Members subdomain</h1>
        {loading && <p>Loading…</p>}
        {!loading && data?.error && <pre style={{ color: 'red' }}>{data.error}</pre>}
        {!loading && data && !data.error && (
          <div>
            <h3>Realtime</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data.realtime, null, 2)}</pre>

            <h3>7-day Totals</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data.totals, null, 2)}</pre>

            <h3>Top Pages (7d)</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data.pages, null, 2)}</pre>
          </div>
        )}
      </div>
    )
  }
