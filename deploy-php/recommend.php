<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);
$body = json_body();
if (!empty($body['website_url'])) respond(array('ok' => true));

$name = trim(isset($body['name']) ? $body['name'] : '');
if (strlen($name) < 2) fail('Artist name is required.');

$country = trim(isset($body['country']) ? $body['country'] : '');
$country = $country !== '' ? $country : null;
$links = json_encode(array(
  'website' => !empty($body['website']) ? trim($body['website']) : null,
  'spotify' => !empty($body['spotify']) ? trim($body['spotify']) : null,
  'instagram' => !empty($body['instagram']) ? trim($body['instagram']) : null,
));

try {
  $artist = neon_one(
    "INSERT INTO artists (name, country, genre, bio, links, source, status)
     VALUES ($1, $2, $3, $4, CAST($5 AS jsonb), 'recommendation', 'proposed')
     RETURNING id, name",
    array(
      $name,
      $country,
      !empty($body['genre']) ? trim($body['genre']) : null,
      !empty($body['bio']) ? trim($body['bio']) : null,
      $links,
    )
  );

  neon_query(
    'INSERT INTO recommendations (artist_id, recommender_name, note) VALUES ($1, $2, $3)',
    array(
      $artist['id'],
      !empty($body['recommenderName']) ? trim($body['recommenderName']) : null,
      !empty($body['note']) ? trim($body['note']) : null,
    )
  );

  $ip = client_ip();
  record_marker('band', $ip, $country, $artist['id']);
  record_marker('proposer', $ip, null, $artist['id']);

  respond(array('artist' => $artist), 201);
} catch (Exception $e) {
  fail('Recommendation failed: ' . $e->getMessage(), 500);
}
