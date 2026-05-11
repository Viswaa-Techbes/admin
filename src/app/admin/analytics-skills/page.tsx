"use client"
import { useEffect, useState } from "react"

export const metadata = {
  title: 'Analytics - Skills',
}

export default function AnalyticsSkillsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ga/data?domain=skills.techbes.co.in')
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch((e) => setData({ error: String(e) }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Analytics — Skills subdomain</h1>
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
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      let mounted = true
      fetch('/api/ga/data?domain=skills.techbes.co.in')
        .then((r) => r.json())
        .then((j) => { if (mounted) setData(j) })
        .catch((e) => { if (mounted) setData({ error: String(e) }) })
        .finally(() => { if (mounted) setLoading(false) })
      return () => { mounted = false }
    }, [])

    return (
      <div style={{ padding: 24 }}>
        <h1>Analytics — Skills subdomain</h1>
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
