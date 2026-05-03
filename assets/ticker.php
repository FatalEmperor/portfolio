<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$symbols = ['KSE100', 'OGDC', 'PPL', 'ENGRO', 'HBL', 'HUBC', 'SYS', 'MEBL', 'LUCK'];
$results = [];

// Function to fetch data for a single symbol
function fetchSymbolData($symbol) {
    $url = "https://dps.psx.com.pk/timeseries/int/" . $symbol;
    $options = [
        "http" => [
            "method" => "GET",
            "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36\r\n"
        ]
    ];
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === FALSE) return null;
    
    $json = json_decode($response, true);
    if (!isset($json['data']) || empty($json['data'])) return null;
    
    $data = $json['data'];
    $latest = $data[0][1]; // Most recent price
    $open = end($data)[1]; // Oldest price in the intraday set
    
    $change = $latest - $open;
    $pctChange = ($open != 0) ? ($change / $open) * 100 : 0;
    
    return [
        'price' => number_format($latest, 2),
        'change' => number_format($pctChange, 2) . '%'
    ];
}

foreach ($symbols as $sym) {
    $data = fetchSymbolData($sym);
    if ($data) {
        $results[$sym] = [$data['price'], $data['change'], $data['change']];
    }
}

echo json_encode([
    'source'  => 'psx-timeseries',
    'updated' => gmdate('Y-m-d H:i:s') . ' UTC',
    'data'    => $results,
], JSON_UNESCAPED_UNICODE);
