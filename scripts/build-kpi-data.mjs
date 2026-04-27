#!/usr/bin/env node
/**
 * Build-time KPI data fetch from Airtable
 * Generates static JSON for the dashboard page
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

// Airtable config
const AIRTABLE_CONFIG = JSON.parse(
  fs.readFileSync(path.join(process.env.HOME, '.clawdbot/airtable.json'), 'utf8')
);
const AIRTABLE_TOKEN = AIRTABLE_CONFIG.token;

// Base IDs
const BASES = {
  HQ: 'appRDT5DTCCfcSTeQ',
  DEVOPS: 'app23ahxhjMU0HUr3',
  CRM: 'app4jyLDX0G1cUkl4',
  CFO: 'appdjRrdd4wuV4EVK',
};

// Table IDs (from sync-airtable.mjs)
const TABLES = {
  HQ_WORKSPACES: 'tbl9uNlg8ibIerMSE',
  HQ_SERVERS: 'tblmCkaVeUO23HbV5',
  HQ_CONTACTS: 'tbl34G2u85sU254Yt',
  HQ_ORGANIZATIONS: 'tblP6j8uACZgPyRH1',
  DEVOPS_SERVERS: 'tblkqTR0OZGDR4dn8',
  CRM_CONTACTS: 'tblYxavCeAcKTLPHo',
  CFO_WEEKLY_METRICS: 'tbljDONcVWo28JdTM',
  CFO_SUBSCRIPTIONS: 'tblEkBGtoRyP6Ii04',
  CFO_PAYMENTS: 'tbleW1MWApQf1LOnc',
};

async function fetchAllRecords(baseId, tableId) {
  const allRecords = [];
  let offset = null;

  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);
    url.searchParams.set('pageSize', '100');
    if (offset) {
      url.searchParams.set('offset', offset);
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });

    if (!res.ok) {
      console.warn(`⚠️  Airtable API error: ${res.status} ${res.statusText} for ${tableId}`);
      break;
    }

    const data = await res.json();
    if (data.error) {
      console.warn(`⚠️  Airtable error: ${data.error.message}`);
      break;
    }

    allRecords.push(...data.records);
    offset = data.offset;

    if (offset) {
      await new Promise((r) => setTimeout(r, 250)); // Rate limiting
    }
  } while (offset);

  return allRecords;
}

async function buildKpiData() {
  console.log('📊 Building KPI data from Airtable...\n');

  const kpis = {
    generatedAt: new Date().toISOString(),
    workspaces: {},
    servers: {},
    contacts: {},
    organizations: {},
    financials: {},
    weeklyMetrics: [],
  };

  try {
    // ─── Workspaces ────────────────────────────────────────────────
    console.log('  → Fetching workspaces...');
    const workspaces = await fetchAllRecords(BASES.HQ, TABLES.HQ_WORKSPACES);

    const workspaceStats = {
      total: workspaces.length,
      active: 0,
      trial: 0,
      churned: 0,
      trialEnded: 0,
      byTier: {},
    };

    workspaces.forEach((ws) => {
      const status = ws.fields['Subscription Status'] || 'Unknown';
      const tier = ws.fields['Subscription Tier'] || 'Unknown';

      if (status === 'Active') workspaceStats.active++;
      else if (status === 'Trial') workspaceStats.trial++;
      else if (status === 'Churned') workspaceStats.churned++;
      else if (status === 'Trial Ended') workspaceStats.trialEnded++;

      workspaceStats.byTier[tier] = (workspaceStats.byTier[tier] || 0) + 1;
    });

    kpis.workspaces = workspaceStats;
    console.log(`    ✅ ${workspaces.length} workspaces processed`);

    // ─── Servers ───────────────────────────────────────────────────
    console.log('  → Fetching servers...');
    const hqServers = await fetchAllRecords(BASES.HQ, TABLES.HQ_SERVERS);
    const devopsServers = await fetchAllRecords(BASES.DEVOPS, TABLES.DEVOPS_SERVERS);
    const allServers = [...hqServers, ...devopsServers];

    const serverStats = {
      total: allServers.length,
      running: 0,
      byDatacenter: {},
      byProvider: {},
      monthlyCost: 0,
    };

    allServers.forEach((srv) => {
      const status = srv.fields['Status'] || 'Unknown';
      const datacenter = srv.fields['Datacenter'] || 'Unknown';
      const provider = srv.fields['Provider'] || 'Unknown';
      const cost = parseFloat(srv.fields['Monthly Cost'] || 0);

      if (status === 'Running') serverStats.running++;
      serverStats.byDatacenter[datacenter] = (serverStats.byDatacenter[datacenter] || 0) + 1;
      serverStats.byProvider[provider] = (serverStats.byProvider[provider] || 0) + 1;
      serverStats.monthlyCost += cost;
    });

    kpis.servers = serverStats;
    console.log(`    ✅ ${allServers.length} servers processed`);

    // ─── Contacts ──────────────────────────────────────────────────
    console.log('  → Fetching contacts...');
    const hqContacts = await fetchAllRecords(BASES.HQ, TABLES.HQ_CONTACTS);
    const crmContacts = await fetchAllRecords(BASES.CRM, TABLES.CRM_CONTACTS);
    const allContacts = [...hqContacts, ...crmContacts];

    const contactStats = {
      total: allContacts.length,
      byStatus: {},
    };

    allContacts.forEach((c) => {
      const status = c.fields['Status'] || 'Unknown';
      contactStats.byStatus[status] = (contactStats.byStatus[status] || 0) + 1;
    });

    kpis.contacts = contactStats;
    console.log(`    ✅ ${allContacts.length} contacts processed`);

    // ─── Organizations ─────────────────────────────────────────────
    console.log('  → Fetching organizations...');
    const hqOrgs = await fetchAllRecords(BASES.HQ, TABLES.HQ_ORGANIZATIONS);
    const crmOrgs = await fetchAllRecords(BASES.CRM, TABLES.CRM_ORGANIZATIONS);

    kpis.organizations = {
      total: hqOrgs.length,
      crmTotal: crmOrgs.length,
    };
    console.log(`    ✅ ${hqOrgs.length} HQ orgs, ${crmOrgs.length} CRM orgs processed`);

    // ─── Financial Data (CFO Base) ──────────────────────────────
    console.log('  → Fetching financial data...');

    try {
      const subscriptions = await fetchAllRecords(BASES.CFO, TABLES.CFO_SUBSCRIPTIONS);
      const payments = await fetchAllRecords(BASES.CFO, TABLES.CFO_PAYMENTS);

      const monthlyRevenue = payments
        .filter((p) => {
          const date = p.fields['Payment Date'];
          if (!date) return false;
          const paymentDate = new Date(date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return paymentDate >= thirtyDaysAgo;
        })
        .reduce((sum, p) => sum + parseFloat(p.fields['Amount'] || 0), 0);

      kpis.financials = {
        activeSubscriptions: subscriptions.filter((s) => s.fields['Status'] === 'Active').length,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        totalPayments: payments.length,
      };
      console.log(`    ✅ Financial data processed ($${monthlyRevenue} revenue last 30d)`);
    } catch (err) {
      console.warn(`    ⚠️  Could not fetch financial data: ${err.message}`);
      kpis.financials = { error: 'Data unavailable' };
    }

    // ─── Weekly Metrics (CFO Base) ──────────────────────────────
    console.log('  → Fetching weekly metrics...');
    try {
      const weeklyMetrics = await fetchAllRecords(BASES.CFO, TABLES.CFO_WEEKLY_METRICS);

      kpis.weeklyMetrics = weeklyMetrics
        .sort((a, b) => {
          const dateA = new Date(a.fields['Week Of'] || 0);
          const dateB = new Date(b.fields['Week Of'] || 0);
          return dateB - dateA;
        })
        .slice(0, 12)
        .map((m) => ({
          weekOf: m.fields['Week Of'] || '',
          newWorkspaces: m.fields['New Workspaces'] || 0,
          churnedWorkspaces: m.fields['Churned Workspaces'] || 0,
          newTrials: m.fields['New Trials'] || 0,
          trialConversions: m.fields['Trial Conversions'] || 0,
          monthlyRecurringRevenue: m.fields['Monthly Recurring Revenue'] || 0,
        }));

      console.log(`    ✅ ${kpis.weeklyMetrics.length} weeks of metrics processed`);
    } catch (err) {
      console.warn(`    ⚠️  Could not fetch weekly metrics: ${err.message}`);
      kpis.weeklyMetrics = [];
    }

    // ─── Summary ────────────────────────────────────────────────────
    kpis.summary = {
      totalWorkspaces: kpis.workspaces.total,
      activeWorkspaces: kpis.workspaces.active,
      totalServers: kpis.servers.total,
      runningServers: kpis.servers.running,
      totalContacts: kpis.contacts.total,
      totalOrganizations: kpis.organizations.total + kpis.organizations.crmTotal,
      monthlyRevenue: kpis.financials.monthlyRevenue || 0,
    };

    console.log('\n📈 KPI Summary:');
    console.log(`   Workspaces: ${kpis.summary.totalWorkspaces} (${kpis.summary.activeWorkspaces} active)`);
    console.log(`   Servers: ${kpis.summary.totalServers} (${kpis.summary.runningServers} running)`);
    console.log(`   Contacts: ${kpis.summary.totalContacts}`);
    console.log(`   Revenue (30d): $${kpis.summary.monthlyRevenue}`);
  } catch (err) {
    console.error('❌ Error building KPI data:', err.message);
    // Write partial data so dashboard still works
    kpis.error = err.message;
  }

  return kpis;
}

function main() {
  const outputPath = path.join(process.cwd(), 'static', 'kpi-data.json');
  const outputDir = path.dirname(outputPath);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  buildKpiData()
    .then((kpis) => {
      fs.writeFileSync(outputPath, JSON.stringify(kpis, null, 2));
      console.log(`\n✅ KPI data written to ${outputPath}`);
      console.log(`   Generated at: ${kpis.generatedAt}`);
    })
    .catch((err) => {
      console.error('❌ Failed to build KPI data:', err);
      process.exit(1);
    });
}

main();
