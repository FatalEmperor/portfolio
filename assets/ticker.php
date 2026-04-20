<?php
/**
 * PSX Live Ticker Proxy
 * Fetches live stock data from dps.psx.com.pk/screener (server-side rendered)
 * and returns JSON to the front-end ticker script.
 *
 * Deploy this file alongside index.html on your web server (Apache/Nginx + PHP).
 * The front-end calls: /ticker.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=180'); // 3-minute cache

// ── Symbols we want in the ticker ──────────────────────────────────────────
$WANTED = ['OGDC','PPL','HBL','ENGROH','MCB','UBL','LUCK','FFC','PSO'];

// ── Static fallback prices (used when all live sources fail) ───────────────
$FALLBACK = [
    'KSE-100' => ['165,634',   '',     ''],
    'OGDC'    => ['299.63',    '',     ''],
    'PPL'     => ['218.70',    '',     ''],
    'HBL'     => ['301.16',    '',     ''],
    'ENGROH'  => ['279.07',    '',     ''],
    'MCB'     => ['405.62',    '',     ''],
    'UBL'     => ['355.93',    '',     ''],
    'LUCK'    => ['434.36',    '',     ''],
    'FFC'     => ['526.99',    '',     ''],
    'PSO'     => ['362.22',    '',     ''],
];

// ── HTTP context ───────────────────────────────────────────────────────────
function makeCtx(bool $sslVerify = true) {
    return stream_context_create([
        'http' => [
            'method'  => 'GET',
            'header'  => implode("\r\n", [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language: en-US,en;q=0.5',
                'Cache-Control: no-cache',
            ]),
            'timeout' => 12,
            'follow_location' => 1,
        ],
        'ssl' => [
            'verify_peer'      => $sslVerify,
            'verify_peer_name' => $sslVerify,
        ],
    ]);
}

// ── Source 1: Floret Capitals ticker page ─────────────────────────────────
function fetchFloret(array $wanted): ?array {
    $html = @file_get_contents('https://trade.floretcapitals.com/ticker.html', false, makeCtx(false));
    if (!$html) return null;

    $data = [];

    // Try to parse table rows: <tr><td>SYMBOL</td><td>PRICE</td>...
    libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    $doc->loadHTML('<?xml encoding="UTF-8">' . $html);
    libxml_clear_errors();
    $xp = new DOMXPath($doc);

    $rows = $xp->query('//tr|//div[contains(@class,"tick")]|//span[contains(@class,"tick")]');
    foreach ($rows as $row) {
        $text = preg_replace('/\s+/', ' ', trim($row->textContent));
        foreach ($wanted as $sym) {
            if (stripos($text, $sym) !== false) {
                // Extract price: number with optional comma separators and decimal
                if (preg_match('/\b(\d[\d,]*\.\d{2})\b/', $text, $pm)) {
                    // Extract percent change
                    $pct = '';
                    if (preg_match('/([+-]?\d+\.\d+)\s*%/', $text, $pp)) $pct = $pp[1].'%';
                    $data[$sym] = [$pm[1], $pct, $pct];
                }
            }
        }
    }

    // Also try KSE-100
    if (preg_match('/KSE.?100[^0-9]*([0-9,]+\.[0-9]+)/i', $html, $m)) {
        $pct = '';
        if (preg_match('/KSE.?100[^0-9]*[0-9,]+\.[0-9]+[^0-9%]*([+-]?\d+\.\d+)\s*%/i', $html, $pp)) $pct = $pp[1].'%';
        $data['KSE-100'] = [$m[1], $pct, $pct];
    }

    return count($data) >= 3 ? $data : null;
}

// ── Source 2: PSX Data Portal screener ────────────────────────────────────
function fetchPSXScreener(array $wanted): ?array {
    $html = @file_get_contents('https://dps.psx.com.pk/screener', false, makeCtx(true));
    if (!$html) return null;

    $data = [];

    libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    $doc->loadHTML('<?xml encoding="UTF-8">' . $html);
    libxml_clear_errors();
    $xp = new DOMXPath($doc);

    // ── Extract KSE-100 index ────────────────────────────────────────────
    // PSX screener header shows "KSE100  168,519.94  +1.74%"
    // Try to find it in a structured header element first
    $hdrNodes = $xp->query('//*[contains(@class,"index") or contains(@class,"kse") or contains(@id,"kse")]');
    foreach ($hdrNodes as $n) {
        $t = trim($n->textContent);
        if (preg_match('/([0-9]{2,3}[,\s]?\d{3}[\.,]\d{2})/', $t, $m)) {
            $pct = '';
            if (preg_match('/([+-]?\d+\.\d+)\s*%/', $t, $pp)) $pct = $pp[1].'%';
            $data['KSE-100'] = [str_replace(' ', '', $m[1]), $pct, $pct];
            break;
        }
    }

    // Regex fallback for KSE-100
    if (!isset($data['KSE-100'])) {
        if (preg_match('/KSE.?100[^0-9]*([0-9,]+\.[0-9]{2})/i', $html, $m)) {
            $pct = '';
            if (preg_match('/KSE.?100[^0-9]*[0-9,]+\.[0-9]{2}[^0-9%]*([+-]?\d+\.\d+)\s*%/i', $html, $pp)) $pct = $pp[1].'%';
            $data['KSE-100'] = [$m[1], $pct, $pct];
        }
    }

    // ── Extract stock table rows ─────────────────────────────────────────
    // Screener table: Symbol | Price | Change% | MarketCap | PE | DivYield
    $rows = $xp->query('//table//tr');
    foreach ($rows as $row) {
        $cells = $xp->query('td', $row);
        if ($cells->length < 2) continue;

        $sym = strtoupper(trim($cells->item(0)->textContent));
        if (!in_array($sym, $wanted)) continue;

        // Scan cells for a price-like value (digits, optional comma, decimal point)
        $price = '';
        $pct   = '';
        for ($i = 1; $i < $cells->length; $i++) {
            $txt = trim($cells->item($i)->textContent);
            // Price: e.g. 304.71 or 1,234.56 (no % sign)
            if (empty($price) && preg_match('/^[\d,]+\.\d{2}$/', $txt)) {
                $price = $txt;
            }
            // Percent: e.g. 1.18% or -1.13%
            if (empty($pct) && preg_match('/^[+-]?\d+\.\d+\s*%$/', $txt)) {
                $pct = $txt;
            }
        }

        if (!empty($price)) {
            $data[$sym] = [$price, $pct, $pct];
        }
    }

    return count($data) >= 3 ? $data : null;
}

// ── Source 3: PSX individual company pages ────────────────────────────────
function fetchPSXCompanyPages(array $wanted): array {
    $data = [];
    foreach ($wanted as $sym) {
        $html = @file_get_contents("https://dps.psx.com.pk/company/{$sym}", false, makeCtx(true));
        if (!$html) continue;

        // Extract current price (Rs. 304.12 or similar)
        if (preg_match('/Rs\.?\s*([\d,]+\.\d{2})/i', $html, $pm)) {
            $price = $pm[1];
            $pct   = '';
            if (preg_match('/\((\s*[+-]?\d+\.\d+\s*%\s*)\)/i', $html, $pp)) $pct = trim($pp[1]);
            $data[$sym] = [$price, $pct, $pct];
        }
        usleep(100000); // 100ms between requests
    }
    return $data;
}

// ── Main ──────────────────────────────────────────────────────────────────
$liveData = null;
$source   = 'fallback';

// Try Source 1: Floret Capitals
$liveData = fetchFloret($WANTED);
if ($liveData) {
    $source = 'floret';
}

// Try Source 2: PSX Screener
if (!$liveData) {
    $liveData = fetchPSXScreener($WANTED);
    if ($liveData) $source = 'psx-screener';
}

// Try Source 3: Individual PSX pages (slower, last resort)
if (!$liveData) {
    $tmp = fetchPSXCompanyPages($WANTED);
    if (count($tmp) >= 3) {
        $liveData = $tmp;
        $source   = 'psx-pages';
    }
}

// Build final response — merge live data over fallback
$output = $FALLBACK;
if ($liveData) {
    foreach ($liveData as $sym => $vals) {
        if (isset($output[$sym]) || in_array($sym, $WANTED) || $sym === 'KSE-100') {
            $output[$sym] = $vals;
        }
    }
}

echo json_encode([
    'source'  => $source,
    'updated' => gmdate('Y-m-d H:i:s') . ' UTC',
    'data'    => $output,
], JSON_UNESCAPED_UNICODE);
