<?php
require_once __DIR__ . '/db.php';

$pdo->exec("CREATE TABLE IF NOT EXISTS website_gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $institute_id = $_GET['institute_id'] ?? null;
    if (!$institute_id) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id required']);
    }
    $stmt = $pdo->prepare('SELECT * FROM website_gallery WHERE institute_id = ? ORDER BY created_at DESC');
    $stmt->execute([$institute_id]);
    jsonResponse($stmt->fetchAll());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $institute_id = $data['institute_id'] ?? null;
    $title = $data['title'] ?? null;
    $image_url = $data['image_url'] ?? null;
    if (!$institute_id) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id required']);
    }
    $stmt = $pdo->prepare('INSERT INTO website_gallery (institute_id, title, image_url) VALUES (?, ?, ?)');
    $stmt->execute([$institute_id, $title, $image_url]);
    jsonResponse(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    parse_str(file_get_contents('php://input'), $d);
    $id = $d['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        jsonResponse(['error' => 'id required']);
    }
    $stmt = $pdo->prepare('DELETE FROM website_gallery WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['ok' => true]);
}
