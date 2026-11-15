import { useState } from 'react'
import {
  FileSearch,
  Loader2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Wallet,
  ChartNoAxesCombined,
  FileText
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { extractCompanyData } from '../services/extractionService.js'

function numberValue(value) {
  if (value === null || value === undefined) return null
  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function displayValue(item) {
  if (item?.value === null || item?.value === undefined) {
    return 'N/A'
  }

  const value = item.value
  const unit = String(item.unit || '')
  const currency = String(item.currency || '')

  if (typeof value !== 'number') {
    return `${value}${unit ? ` ${unit}` : ''}`
  }

  const formatted = value.toLocaleString('en-US', {
    maximumFractionDigits: 2
  })

  const isUSD = currency.toUpperCase() === 'USD' ||
    /\bUSD\b/i.test(unit)

  if (/million/i.test(unit)) return `${isUSD ? '$' : ''}${formatted} M`
  if (/billion/i.test(unit)) return `${isUSD ? '$' : ''}${formatted} B`
  if (/thousand/i.test(unit)) return `${isUSD ? '$' : ''}${formatted} K`

  return `${isUSD ? '$' : ''}${formatted}${unit ? ` ${unit}` : ''}`
}

function getLatestMetric(metrics, pattern) {
  const matches = metrics.filter(item =>
    pattern.test(item.metric || '')
  )

  matches.sort((a, b) =>
    String(b.financial_year || '').localeCompare(
      String(a.financial_year || ''),
      undefined,
      { numeric: true }
    )
  )

  return matches[0] || null
}

function buildChartData(metrics, patterns) {
  const years = {}

  metrics.forEach(item => {
    const metricName = item.metric || ''
    const year = String(item.financial_year || '')

    if (!year) return

    const matchingPattern = patterns.find(entry =>
      entry.pattern.test(metricName)
    )

    if (!matchingPattern) return

    const value = numberValue(item.value)
    if (value === null) return

    if (!years[year]) years[year] = { year }
    years[year][matchingPattern.label] = value
  })

  return Object.values(years).sort((a, b) =>
    a.year.localeCompare(b.year, undefined, { numeric: true })
  )
}

function DataTable({ columns, rows, emptyMessage }) {
  if (!rows.length) {
    return <p className="muted">{emptyMessage}</p>
  }

  return (
    <div className="extract-table-wrap">
      <table className="extract-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map(column => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row)
                    : row[column.key] ?? 'N/A'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SourceDetails({ item }) {
  if (!item.source_file && !item.chunk_id && !item.evidence) {
    return <span className="muted">N/A</span>
  }

  return (
    <details className="extract-source">
      <summary>View source</summary>
      <p><strong>File:</strong> {item.source_file || 'N/A'}</p>
      <p><strong>Chunk:</strong> {item.chunk_id ?? 'N/A'}</p>
      {item.evidence && <p><strong>Evidence:</strong> {item.evidence}</p>}
    </details>
  )
}

export default function FinancialExtraction() {
  const [company, setCompany] = useState('Amazon')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const metrics = Array.isArray(result?.financial_metrics)
    ? result.financial_metrics : []

  const ratios = Array.isArray(result?.financial_ratios)
    ? result.financial_ratios : []

  const performance = Array.isArray(result?.performance_numbers)
    ? result.performance_numbers : []

  const revenueData = buildChartData(metrics, [
    { label: 'Revenue', pattern: /revenue|net sales/i }
  ])

  const profitData = buildChartData(metrics, [
    { label: 'Net income', pattern: /net income/i },
    { label: 'Operating income', pattern: /operating income/i }
  ])

  const kpis = [
    {
      title: 'Revenue',
      pattern: /revenue|net sales/i,
      icon: DollarSign
    },
    {
      title: 'Net Income',
      pattern: /net income/i,
      icon: Wallet
    },
    {
      title: 'Operating Income',
      pattern: /operating income/i,
      icon: TrendingUp
    },
    {
      title: 'Total Assets',
      pattern: /total assets/i,
      icon: ChartNoAxesCombined
    }
  ]

  const handleExtract = async () => {
    setLoading(true)
    setResult(null)
    setError('')

    try {
      const data = await extractCompanyData(company)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Financial extraction failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="head">
        <div>
          <h1>Financial Extraction</h1>
          <p className="muted">
            Extract and analyse financial information using your AI document agent.
          </p>
        </div>
      </div>

      <div className="card">
        <h3><FileSearch size={19} /> Select Company</h3>

        <div className="row gap wrap">
          <select
            className="input"
            value={company}
            onChange={e => setCompany(e.target.value)}
            disabled={loading}
          >
            <option value="Amazon">Amazon</option>
            <option value="Apple">Apple</option>
          </select>

          <button
            className="btn pri"
            onClick={handleExtract}
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="spin" size={16} /> Extracting...</>
              : <><TrendingUp size={16} /> Extract Financial Data</>
            }
          </button>

          {result && (
            <button
              className="btn"
              onClick={() => setResult(null)}
              disabled={loading}
            >
              <RefreshCw size={16} /> Reset
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="card">
          <Loader2 className="spin" size={24} />
          <p>Retrieving financial documents and extracting information...</p>
          <p className="muted sm">Please wait for Gemini to finish.</p>
        </div>
      )}

      {error && (
        <div className="card">
          <h3>Extraction Error</h3>
          <p className="wnc">{error}</p>
        </div>
      )}

      {result && (
        <div className="fade extraction-dashboard">
          <div className="extract-result-heading">
            <div>
              <h2>{result.company || company} Financial Overview</h2>
              <p className="muted">
                AI-extracted information from financial documents
              </p>
            </div>
            <span className="badge ok">
              {result.status || 'Extraction complete'}
            </span>
          </div>

          <div className="extract-kpi-grid">
            {kpis.map(kpi => {
              const item = getLatestMetric(metrics, kpi.pattern)
              const Icon = kpi.icon

              return (
                <div className="card extract-kpi" key={kpi.title}>
                  <div className="extract-kpi-top">
                    <span className="muted">{kpi.title}</span>
                    <Icon size={20} />
                  </div>
                  <h2>{item ? displayValue(item) : 'N/A'}</h2>
                  <p className="muted sm">
                    {item
                      ? `Financial year ${item.financial_year || 'Year not identified'}`
                      : 'No extracted value'}
                  </p>
                </div>
              )
            })}
          </div>

          <section className="card extract-section">
            <h3><TrendingUp size={19} /> Revenue Trend</h3>
            {revenueData.length ? (
              <div className="extract-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="muted">Insufficient year-labelled revenue data to generate this chart.</p>
            )}
          </section>

          <section className="card extract-section">
            <h3><ChartNoAxesCombined size={19} /> Profitability Comparison</h3>
            {profitData.length ? (
              <div className="extract-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Net income" fill="#10b981" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="Operating income" fill="#8b5cf6" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="muted">Insufficient year-labelled profitability data to generate this chart.</p>
            )}
          </section>

          <section className="card extract-section">
            <h3><DollarSign size={19} /> Financial Metrics</h3>
            <DataTable
              rows={metrics}
              emptyMessage="No financial metrics were extracted."
              columns={[
                { key: 'metric', label: 'Metric' },
                { key: 'financial_year', label: 'Year', render: row => row.financial_year || 'Year not identified' },
                { key: 'value', label: 'Value', render: displayValue },
                { key: 'type', label: 'Data Type' },
                { key: 'source', label: 'Source', render: row => <SourceDetails item={row} /> }
              ]}
            />
          </section>

          <section className="card extract-section">
            <h3><ChartNoAxesCombined size={19} /> Financial Ratios</h3>
            <DataTable
              rows={ratios}
              emptyMessage="No financial ratios were extracted."
              columns={[
                { key: 'ratio', label: 'Ratio' },
                { key: 'financial_year', label: 'Year', render: row => row.financial_year || 'Year not identified' },
                { key: 'value', label: 'Value', render: row =>
                  row.value === null || row.value === undefined
                    ? 'N/A'
                    : String(row.value)
                },
                { key: 'type', label: 'Data Type' },
                { key: 'source', label: 'Source', render: row => <SourceDetails item={row} /> }
              ]}
            />
          </section>

          <section className="card extract-section">
            <h3><TrendingUp size={19} /> Performance Numbers</h3>
            <DataTable
              rows={performance}
              emptyMessage="No performance numbers were extracted."
              columns={[
                { key: 'metric', label: 'Performance Metric' },
                { key: 'financial_year', label: 'Year', render: row => row.financial_year || 'Year not identified' },
                { key: 'value', label: 'Value', render: row =>
                  row.value === null || row.value === undefined
                    ? 'N/A'
                    : String(row.value)
                },
                { key: 'type', label: 'Data Type' },
                { key: 'source', label: 'Source', render: row => <SourceDetails item={row} /> }
              ]}
            />
          </section>

          <div className="extract-note muted">
            <FileText size={16} />
            Values are displayed according to the information returned by the extraction agent.
            Missing values are shown as N/A. Estimated, calculated and reported values remain separately identified.
          </div>
        </div>
      )}
    </>
  )
}
