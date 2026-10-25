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
    "INSERT INTO artists (name, country, genre, bio, links, email, source, status)
     VALUES ($1, $2, $3, $4, CAST($5 AS jsonb), $6, 'self', 'proposed')
     RETURNING id, name, status",
    array(
      $name,
      $country,
      !empty($body['genre']) ? trim($body['genre']) : null,
      !empty($body['bio']) ? trim($body['bio']) : null,
      $links,
      !empty($body['email']) ? trim($body['email']) : null,
    )
  );
  record_marker('band', client_ip(), $country, $artist['id']);
  respond(array('artist' => $artist), 201);
} catch (Exception $e) {
  fail('Signup failed: ' . $e->getMessage(), 500);
}
