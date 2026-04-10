<?php
// Simple file server for uploaded institute assets.
$base = __DIR__ . '/uploads';
$path = $_GET['p'] ?? null;
if (!$path) {
    http_response_code(400);
    echo 'Missing path';
    exit;
}
$safe = trim($path, " /\\");
if (strpos($safe, '..') !== false) {
    http_response_code(400);
    echo 'Invalid path';
    exit;
}
$file = $base . '/' . $safe;
if (!is_file($file)) {
    http_response_code(404);
    echo 'Not found';
    exit;
}
$mime = mime_content_type($file) ?: 'application/octet-stream';
header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($file));
readfile($file);
exit;
