<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$config = require __DIR__ . '/config.php';

function respond($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data);
  exit;
}

function fail($message, $code = 400) {
  respond(array('error' => $message), $code);
}

function json_body() {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : array();
}

function client_ip() {
  if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
    return trim($parts[0]);
  }
  return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
}

/**
 * Neon SQL-over-HTTP (host has no pgsql PDO).
 * Returns array of row objects.
 */
function neon_query($query, $params = array()) {
  global $config;
  $payload = json_encode(array(
    'query' => $query,
    'params' => array_values($params),
  ));

  $ch = curl_init($config['neon_http']);
  curl_setopt_array($ch, array(
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => array(
      'Content-Type: application/json',
      'Neon-Connection-String: ' . $config['connection_string'],
    ),
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_TIMEOUT => 20,
  ));
  $raw = curl_exec($ch);
  $err = curl_error($ch);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($raw === false) {
    throw new Exception('Neon HTTP error: ' . $err);
  }
  $data = json_decode($raw, true);
  if ($status >= 400) {
    $msg = isset($data['message']) ? $data['message'] : ('HTTP ' . $status . ': ' . $raw);
    throw new Exception($msg);
  }
  if (!isset($data['rows']) || !is_array($data['rows'])) {
    throw new Exception('Unexpected Neon response');
  }
  return $data['rows'];
}

function neon_one($query, $params = array()) {
  $rows = neon_query($query, $params);
  return isset($rows[0]) ? $rows[0] : null;
}

function country_centroid($country) {
  $map = array(
    'nigeria' => array(9.08, 8.68),
    'japan' => array(36.2, 138.25),
    'mexico' => array(23.63, -102.55),
    'ireland' => array(53.14, -7.69),
    'ghana' => array(7.95, -1.02),
    'sweden' => array(60.13, 18.64),
    'united states' => array(39.83, -98.58),
    'usa' => array(39.83, -98.58),
    'uk' => array(54.0, -2.0),
    'united kingdom' => array(54.0, -2.0),
  );
  if (!$country) return null;
  $key = strtolower(trim($country));
  if (!isset($map[$key])) return null;
  $j = 2.5;
  return array(
    'lat' => $map[$key][0] + (mt_rand() / mt_getrandmax() - 0.5) * $j,
    'lon' => $map[$key][1] + (mt_rand() / mt_getrandmax() - 0.5) * $j,
    'countryCode' => strtoupper(substr($key, 0, 2)),
  );
}

function geo_from_ip($ip) {
  if (!$ip || $ip === 'unknown' || $ip === '127.0.0.1' || $ip === '::1') return null;
  if (strpos($ip, '10.') === 0 || strpos($ip, '192.168.') === 0) return null;
  $url = 'http://ip-api.com/json/' . rawurlencode($ip) . '?fields=status,lat,lon,countryCode';
  $ctx = stream_context_create(array('http' => array('timeout' => 2.5)));
  $raw = @file_get_contents($url, false, $ctx);
  if (!$raw) return null;
  $data = json_decode($raw, true);
  if (!isset($data['status']) || $data['status'] !== 'success') return null;
  $j = 0.8;
  return array(
    'lat' => $data['lat'] + (mt_rand() / mt_getrandmax() - 0.5) * $j,
    'lon' => $data['lon'] + (mt_rand() / mt_getrandmax() - 0.5) * $j,
    'countryCode' => isset($data['countryCode']) ? $data['countryCode'] : null,
  );
}

function resolve_location($ip, $country = null) {
  $fromIp = geo_from_ip($ip);
  if ($fromIp) return $fromIp;
  return country_centroid($country);
}

function record_marker($kind, $ip, $country = null, $artistId = null) {
  $loc = resolve_location($ip, $country);
  if (!$loc) return;
  neon_query(
    'INSERT INTO geo_markers (kind, lat, lon, country_code, artist_id) VALUES ($1, $2, $3, $4, $5)',
    array($kind, $loc['lat'], $loc['lon'], isset($loc['countryCode']) ? $loc['countryCode'] : null, $artistId)
  );
}
