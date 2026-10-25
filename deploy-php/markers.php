<?php
require __DIR__ . '/bootstrap.php';

try {
  $rows = neon_query(
    "SELECT m.id, m.kind, m.lat, m.lon, m.country_code, m.artist_id, m.created_at,
            a.name AS artist_name, a.links AS artist_links
     FROM geo_markers m
     LEFT JOIN artists a ON a.id = m.artist_id
     ORDER BY m.created_at DESC
     LIMIT 400"
  );
  foreach ($rows as &$r) {
    $r['lat'] = (float) $r['lat'];
    $r['lon'] = (float) $r['lon'];
    if (isset($r['artist_links']) && is_string($r['artist_links'])) {
      $r['artist_links'] = json_decode($r['artist_links'], true);
    }
  }
  respond(array('markers' => $rows));
} catch (Exception $e) {
  fail('Failed to load markers: ' . $e->getMessage(), 500);
}
