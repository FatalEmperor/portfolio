#!/usr/bin/env node
import { writeFile, readFile } from 'node:fs/promises';

const SYMBOLS = ['KSE100', 'OGDC', 'PPL', 'ENGRO', 'HBL'];
const UA = 'Mozilla/5.0 (compatible; PortfolioTickerBot/1.0; +https://github.com/FatalEmperor/portfolio)';

function fmt(value, isIndex) {
  if (!Number.isFinite(value)) return null;
  return isIndex
    ? value.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : value.toFixed(2);
}

function fmtPct(pct) {
  if (!Number.isFinite(pct)) return '+0.00%';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

async function fetchOne(sym) {
  const isIndex = sym === 'KSE100';
  const tryEndpoints = [
    `https://dps.psx.com.pk/timeseries/int/${sym}`,
    `https://dps.psx.com.pk/timeseries/eod/${sym}`,
  ];
  for (const url of tryEndpoints) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
      if (!res.ok) continue;
      const json = await res.json();
      const data = json?.data;
      if (!Array.isArray(data) || data.length < 2) continue;

      const latest = Number(data[0][1]);
      // For intraday: open is the last (oldest) entry of the day.
      // For eod: previous close is data[1][1].
      const baseline = url.includes('/int/') ? Number(data[data.length - 1][1]) : Number(data[1][1]);
      if (!Number.isFinite(latest) || !Number.isFinite(baseline) || baseline === 0) continue;

      const pct = ((latest - baseline) / baseline) * 100;
      return {
        sym,
        val: fmt(latest, isIndex),
        chg: fmtPct(pct),
        dir: pct >= 0 ? 'pos' : 'neg',
      };
    } catch {
      // try next endpoint
    }
  }
  return null;
}

async function main() {
  const results = await Promise.all(SYMBOLS.map(fetchOne));
  const items = results.filter(Boolean);

  if (items.length === 0) {
    console.error('No symbols fetched — keeping existing ticker.json');
    process.exit(0);
  }

  const payload = {
    updated: new Date().toISOString(),
    source: 'dps.psx.com.pk',
    items,
  };

  // Skip write if items are unchanged from previous run (avoids noisy commits).
  try {
    const prev = JSON.parse(await readFile('ticker.json', 'utf8'));
    const prevSig = JSON.stringify(prev.items);
    const nextSig = JSON.stringify(items);
    if (prevSig === nextSig) {
      console.log('Ticker values unchanged — skipping write.');
      return;
    }
  } catch {
    // no prior file, proceed
  }

  await writeFile('ticker.json', JSON.stringify(payload, null, 2) + '\n');
  console.log(`Wrote ticker.json with ${items.length} symbols.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
