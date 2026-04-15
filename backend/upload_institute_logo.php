<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    jsonResponse(['error' => 'Method not allowed']);
}

if (empty($_FILES['logo']) || ($_FILES['logo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    http_response_code(400);
    jsonResponse(['error' => 'Logo file is required']);
}

$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

$originalName = basename($_FILES['logo']['name']);
$extension = pathinfo($originalName, PATHINFO_EXTENSION) ?: 'png';
$fileName = 'institute-logo-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $extension;
$targetPath = $uploadDir . '/' . $fileName;

if (!move_uploaded_file($_FILES['logo']['tmp_name'], $targetPath)) {
    http_response_code(500);
    jsonResponse(['error' => 'Failed to save uploaded logo']);
}

$logoUrl = 'http://localhost:8000/uploads/' . $fileName;
$instituteId = $_POST['institute_id'] ?? null;
if ($instituteId) {
    $stmt = $pdo->prepare('UPDATE institutes SET logo_url = ? WHERE id = ?');
    $stmt->execute([$logoUrl, $instituteId]);
}

jsonResponse([
    'ok' => true,
    'logo_url' => $logoUrl,
]);
