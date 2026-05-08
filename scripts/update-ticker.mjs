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
  // Always use EOD: gives consistent "latest session close vs previous session close"
  // for every symbol. PSX updates the most recent EOD row intraday during trading hours.
  const url = `https://dps.psx.com.pk/timeseries/eod/${sym}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!Array.isArray(data) || data.length < 2) return null;

    const latest = Number(data[0][1]);
    const prevClose = Number(data[1][1]);
    if (!Number.isFinite(latest) || !Number.isFinite(prevClose) || prevClose === 0) return null;

    const pct = ((latest - prevClose) / prevClose) * 100;
    return {
      sym,
      val: fmt(latest, isIndex),
      chg: fmtPct(pct),
      dir: pct >= 0 ? 'pos' : 'neg',
    };
  } catch {
    return null;
  }
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
