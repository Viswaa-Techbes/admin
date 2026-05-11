export const metadata = {
  title: 'Analytics - Members',
}

"use client"
import { useEffect, useState } from "react"

export const metadata = {
  title: 'Analytics - Members',
}

export default function AnalyticsMembersPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/ga/data?domain=members.techbes.co.in')
      .then((r) => r.json())
      .then((j) => { if (mounted) setData(j) })
      .catch((e) => { if (mounted) setData({ error: String(e) }) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Analytics — Members subdomain</h1>
      {loading && <p>Loading…</p>}
      {!loading && data?.error && <pre style={{ color: 'red' }}>{String(data.error)}</pre>}
      {!loading && data && !data.error && (
        <div>
          <h3>Realtime Active Users</h3>
          <div>{data.realtime?.rowCount ?? 'N/A'}</div>

          <h3>Top Pages (7d)</h3>
          {data.pages?.rows ? (
            <ol>{data.pages.rows.map((r, i) => <li key={i}>{(r.dimensionValues?.[1]?.value || r.dimensionValues?.[0]?.value) + ' — ' + (r.metricValues?.[0]?.value || '')}</li>)}</ol>
          ) : <pre>{JSON.stringify(data.pages)}</pre>}

          <h3>Top Cities (Realtime)</h3>
          {data.realtime?.rows ? (
            <ul>{data.realtime.rows.map((r, i) => <li key={i}>{r.dimensionValues?.[1]?.value} ({r.dimensionValues?.[0]?.value}) — {r.metricValues?.[0]?.value}</li>)}</ul>
          ) : <pre>{JSON.stringify(data.realtime)}</pre>}
        </div>
      )}
    </div>
  )
}
