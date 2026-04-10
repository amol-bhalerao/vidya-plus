<?php
require_once __DIR__ . '/db.php';

// Enhanced file upload handler with validation and remove support
$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir))
    mkdir($uploadDir, 0755, true);

// Allowed mime prefixes / extensions
$allowedMimes = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
$maxFileSize = 10 * 1024 * 1024; // 10 MB

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        jsonResponse(['error' => 'No file uploaded']);
    }
    $file = $_FILES['file'];
    if ($file['size'] > $maxFileSize) {
        http_response_code(400);
        jsonResponse(['error' => 'File too large (max 10MB)']);
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    $okMime = false;
    foreach ($allowedMimes as $p) {
        if (strpos($mime, $p) === 0) {
            $okMime = true;
            break;
        }
        if ($mime === $p) {
            $okMime = true;
            break;
        }
    }
    if (!$okMime) {
        http_response_code(400);
        jsonResponse(['error' => 'File type not allowed']);
    }

    $subpath = $_POST['path'] ?? '';
    $safeSub = trim(preg_replace('/[^a-zA-Z0-9_\-\/\.]/', '', $subpath), '/');
    $destDir = $uploadDir . ($safeSub ? '/' . $safeSub : '');
    if (!is_dir($destDir))
        mkdir($destDir, 0755, true);
    $filename = time() . '-' . preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', basename($file['name']));
    $dest = $destDir . '/' . $filename;
    if (move_uploaded_file($file['tmp_name'], $dest)) {
        // Public URL relative to backend folder
        $publicUrl = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/') . '/uploads' . ($safeSub ? '/' . $safeSub : '') . '/' . $filename;
        jsonResponse(['publicUrl' => $publicUrl]);
    } else {
        http_response_code(500);
        jsonResponse(['error' => 'Failed to move uploaded file']);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Expect body: path=/uploads/...
    parse_str(file_get_contents('php://input'), $d);
    $path = $d['path'] ?? null;
    if (!$path) {
        http_response_code(400);
        jsonResponse(['error' => 'path required']);
    }
    // sanitize and map to file system
    $clean = trim($path, " /\\");
    // Prevent path traversal
    if (strpos($clean, '..') !== false) {
        http_response_code(400);
        jsonResponse(['error' => 'invalid path']);
    }
    // The publicUrl format may be '/backend/uploads/...' or '/backend/institute-assets/...'
    if (strpos($clean, '/uploads/') !== false) {
        $parts = explode('/uploads/', $clean);
        $relative = end($parts);
    } elseif (strpos($clean, '/institute-assets/') !== false) {
        $parts = explode('/institute-assets/', $clean);
        $relative = end($parts);
    } else {
        $relative = $clean;
    }
    $filePath = $uploadDir . '/' . $relative;
    if (is_file($filePath)) {
        unlink($filePath);
        jsonResponse(['ok' => true]);
    } else {
        http_response_code(404);
        jsonResponse(['error' => 'file not found']);
    }
}

http_response_code(405);
jsonResponse(['error' => 'Method not allowed']);
