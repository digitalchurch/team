import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './kpi-dashboard.module.css';
import { useEffect, useState } from 'react';

function KpiCard({ title, value, subtitle, trend, trendValue }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
          {trend && (
            <span className={`${styles.trend} ${styles[trend]}`}>
              {trendValue}
            </span>
          )}
        </div>
        <p className={styles.cardValue}>{value}</p>
        {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}

function StatBar({ label, value, maxValue, color }) {
  const percentage = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  return (
    <div className={styles.statBar}>
      <div className={styles.statBarHeader}>
        <span className={styles.statBarLabel}>{label}</span>
        <span className={styles.statBarValue}>{value}</span>
      </div>
      <div className={styles.statBarTrack}>
        <div
          className={styles.statBarFill}
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function KpiDashboard() {
  const dataUrl = useBaseUrl('/kpi-data.json');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(dataUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load KPI data');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [dataUrl]);

  if (loading) {
    return (
      <Layout title="KPI Dashboard" description="Digital Church team metrics">
        <main className={styles.dashboard}>
          <div className={styles.loading}>
            <p>Loading KPI data...</p>
          </div>
        </main>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout title="KPI Dashboard" description="Digital Church team metrics">
        <main className={styles.dashboard}>
          <div className={styles.error}>
            <h2>Unable to load KPI data</h2>
            <p>{error || 'Data unavailable'}</p>
          </div>
        </main>
      </Layout>
    );
  }

  const { summary, workspaces, servers, contacts, financials, weeklyMetrics } = data;

  return (
          <h2 className={styles.sectionTitle}>Overview</h2>
          <div className={styles.grid}>
            <KpiCard
              title="Total Workspaces"
              value={summary?.totalWorkspaces || 0}
              subtitle={`${summary?.activeWorkspaces || 0} active`}
            />
            <KpiCard
              title="Active Subscriptions"
              value={summary?.activeWorkspaces || 0}
              subtitle={`${summary?.trialWorkspaces || 0} trials`}
            />
            <KpiCard
              title="Monthly Revenue"
              value={`$${summary?.monthlyRevenue?.toLocaleString() || 0}`}
              subtitle="Last 30 days"
            />
            <KpiCard
              title="Infrastructure"
              value={summary?.totalServers || 0}
              subtitle={`${summary?.runningServers || 0} running`}
            />
            <KpiCard
              title="Contacts"
              value={summary?.totalContacts || 0}
              subtitle={`${summary?.totalOrganizations || 0} organizations`}
            />
            <KpiCard
              title="Monthly Infrastructure"
              value={`$${Math.round(servers?.monthlyCost || 0).toLocaleString()}`}
              subtitle="Server costs"
            />
          </div>
        </section>

        {workspaces?.byTier && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Workspaces by Tier</h2>
            <div className={styles.grid}>
              {Object.entries(workspaces.byTier)
                .sort((a, b) => b[1] - a[1])
                .map(([tier, count]) => (
                  <StatBar
                    key={tier}
                    label={tier}
                    value={count}
                    maxValue={workspaces.total}
                    color="#4f46e5"
                  />
                ))}
            </div>
          </section>
        )}

        {servers?.byDatacenter && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Servers by Datacenter</h2>
            <div className={styles.grid}>
              {Object.entries(servers.byDatacenter)
                .sort((a, b) => b[1] - a[1])
                .map(([dc, count]) => (
                  <StatBar
                    key={dc}
                    label={dc}
                    value={count}
                    maxValue={servers.total}
                    color="#0891b2"
                  />
                ))}
            </div>
          </section>
        )}

        {weeklyMetrics?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Weekly Metrics (Last 12 Weeks)</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Week Of</th>
                    <th>New Workspaces</th>
                    <th>Churned</th>
                    <th>New Trials</th>
                    <th>Trial Conversions</th>
                    <th>MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyMetrics.map((week, i) => (
                    <tr key={i}>
                      <td>{new Date(week.weekOf).toLocaleDateString()}</td>
                      <td className={styles.numberCell}>{week.newWorkspaces}</td>
                      <td className={`${styles.numberCell} ${styles.churnCell}`}>
                        {week.churnedWorkspaces}
                      </td>
                      <td className={styles.numberCell}>{week.newTrials}</td>
                      <td className={styles.numberCell}>{week.trialConversions}</td>
                      <td className={styles.numberCell}>
                        ${week.monthlyRecurringRevenue?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer className={styles.footer}>
          <p>
            Data sourced directly from Airtable. Generated at build time.
          </p>
        </footer>
      </main>
    </Layout>
  );
}
