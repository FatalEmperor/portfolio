<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Disable error reporting for clean JSON output
error_reporting(0);

$symbols = ['KSE100', 'OGDC', 'PPL', 'ENGRO', 'HBL', 'HUBC', 'SYS', 'MEBL', 'LUCK'];
$results = [];

function fetchSymbolData($symbol) {
    $url = "https://dps.psx.com.pk/timeseries/int/" . $symbol;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    // Important for some PHP environments that lack proper CA bundles
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) return null;
    
    $json = json_decode($response, true);
    if (!isset($json['data']) || empty($json['data'])) return null;
    
    $data = $json['data'];
    $latest = $data[0][1]; 
    $open = end($data)[1]; 
    
    $change = $latest - $open;
    $pctChange = ($open != 0) ? ($change / $open) * 100 : 0;
    
    // Formatting: Handle KSE100 large numbers vs stocks
    $formattedPrice = ($latest > 1000) ? number_format($latest, 0) : number_format($latest, 2);
    
    return [
        'price' => $formattedPrice,
        'change' => number_format($pctChange, 2) . '%'
    ];
}

foreach ($symbols as $sym) {
    $res = fetchSymbolData($sym);
    if ($res) {
        $results[$sym] = [$res['price'], $res['change']];
    }
}

// Fallback if PSX is down
if (empty($results)) {
    $results = [
        'KSE100' => ['162,994', '+0.00%'],
        'OGDC' => ['299.63', '+0.00%'],
        'PPL' => ['218.70', '+0.00%']
    ];
}

echo json_encode([
    'source'  => 'psx-timeseries-v2',
    'updated' => gmdate('Y-m-d H:i:s') . ' UTC',
    'data'    => $results,
], JSON_UNESCAPED_UNICODE);
