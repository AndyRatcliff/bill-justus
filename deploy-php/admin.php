<?php
require __DIR__ . '/bootstrap.php';
global $config;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $key = isset($_GET['key']) ? $_GET['key'] : '';
  if ($key !== $config['admin_key']) fail('Unauthorized', 401);

  try {
    $rows = neon_query(
      "SELECT a.id, a.name, a.country, a.genre, a.email, a.source, a.status,
              a.created_at, a.confirmed_at,
              COALESCE(COUNT(v.id), 0)::int AS votes
       FROM artists a
       LEFT JOIN votes v ON v.artist_id = a.id
       WHERE a.status != 'hidden'
       GROUP BY a.id
       ORDER BY a.status ASC, votes DESC, a.created_at ASC"
    );
    foreach ($rows as &$r) {
      $r['votes'] = (int) $r['votes'];
    }
    respond(array('artists' => $rows));
  } catch (Exception $e) {
    fail('Failed to load: ' . $e->getMessage(), 500);
  }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

$body = json_body();
if (!isset($body['key']) || $body['key'] !== $config['admin_key']) fail('Unauthorized', 401);

$id = isset($body['id']) ? $body['id'] : null;
$action = isset($body['action']) ? $body['action'] : null;
if (!$id || !in_array($action, array('confirm', 'unconfirm', 'hide'), true)) {
  fail('Invalid action');
}

try {
  if ($action === 'confirm') {
    $artist = neon_one(
      "UPDATE artists SET status = 'confirmed', confirmed_at = now() WHERE id = $1
       RETURNING id, name, status, confirmed_at",
      array($id)
    );
  } elseif ($action === 'unconfirm') {
    $artist = neon_one(
      "UPDATE artists SET status = 'proposed', confirmed_at = null WHERE id = $1
       RETURNING id, name, status, confirmed_at",
      array($id)
    );
  } else {
    $artist = neon_one(
      "UPDATE artists SET status = 'hidden' WHERE id = $1 RETURNING id, name, status",
      array($id)
    );
  }
  if (!$artist) fail('Artist not found', 404);
  respond(array('artist' => $artist));
} catch (Exception $e) {
  fail('Update failed: ' . $e->getMessage(), 500);
}
