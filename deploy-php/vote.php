<?php
require __DIR__ . '/bootstrap.php';
global $config;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

$body = json_body();
$artistId = isset($body['artistId']) ? $body['artistId'] : null;
if (!$artistId) fail('artistId required');

try {
  $artist = neon_one('SELECT id, status FROM artists WHERE id = $1 LIMIT 1', array($artistId));
  if (!$artist) fail('Artist not found', 404);
  if ($artist['status'] !== 'proposed') fail('Only proposed artists can receive votes.');

  $cookieName = 'orb_voter';
  $raw = isset($_COOKIE[$cookieName]) ? $_COOKIE[$cookieName] : null;
  $created = false;
  if (!$raw) {
    if (function_exists('random_bytes')) {
      $raw = bin2hex(random_bytes(16));
    } else {
      $raw = md5(uniqid(mt_rand(), true));
    }
    $created = true;
  }
  $voterKey = hash('sha256', $raw . ':' . $config['vote_secret']);

  try {
    neon_query('INSERT INTO votes (artist_id, voter_key) VALUES ($1, $2)', array($artistId, $voterKey));
  } catch (Exception $e) {
    if (strpos($e->getMessage(), 'unique') !== false || strpos($e->getMessage(), 'duplicate') !== false) {
      fail('You already voted for this artist.', 409);
    }
    throw $e;
  }

  record_marker('voter', client_ip(), null, $artistId);

  $countRow = neon_one('SELECT COUNT(*)::int AS votes FROM votes WHERE artist_id = $1', array($artistId));
  $votes = (int) $countRow['votes'];

  if ($created) {
    setcookie($cookieName, $raw, time() + 365 * 24 * 3600, '/orb.me');
  }

  respond(array('ok' => true, 'votes' => $votes));
} catch (Exception $e) {
  fail('Vote failed: ' . $e->getMessage(), 500);
}
