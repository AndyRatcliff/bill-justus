<?php
require __DIR__ . '/bootstrap.php';

$status = isset($_GET['status']) ? $_GET['status'] : 'proposed';
if ($status !== 'proposed' && $status !== 'confirmed') {
  fail('Invalid status', 400);
}

try {
  if ($status === 'confirmed') {
    $rows = neon_query(
      "SELECT a.id, a.name, a.country, a.genre, a.bio, a.links, a.source, a.status,
              a.created_at, a.confirmed_at,
              COALESCE(COUNT(v.id), 0)::int AS votes
       FROM artists a
       LEFT JOIN votes v ON v.artist_id = a.id
       WHERE a.status = 'confirmed'
       GROUP BY a.id
       ORDER BY a.confirmed_at DESC NULLS LAST, a.name ASC"
    );
  } else {
    $rows = neon_query(
      "SELECT a.id, a.name, a.country, a.genre, a.bio, a.links, a.source, a.status,
              a.created_at, a.confirmed_at,
              COALESCE(COUNT(v.id), 0)::int AS votes
       FROM artists a
       LEFT JOIN votes v ON v.artist_id = a.id
       WHERE a.status = 'proposed'
       GROUP BY a.id
       ORDER BY votes DESC, a.created_at ASC"
    );
  }
  foreach ($rows as &$r) {
    if (isset($r['links']) && is_string($r['links'])) {
      $r['links'] = json_decode($r['links'], true);
    }
    $r['votes'] = (int) $r['votes'];
  }
  respond(array('artists' => $rows));
} catch (Exception $e) {
  fail('Failed to load artists: ' . $e->getMessage(), 500);
}
