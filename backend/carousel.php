<?php
require_once __DIR__ . '/db.php';

$pdo->exec("CREATE TABLE IF NOT EXISTS website_carousel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $institute_id = $_GET['institute_id'] ?? null;
    if (!$institute_id) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id required']);
    }
    $stmt = $pdo->prepare('SELECT * FROM website_carousel WHERE institute_id = ? ORDER BY sort_order ASC');
    $stmt->execute([$institute_id]);
    jsonResponse($stmt->fetchAll());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = $data['id'] ?? null;
    $institute_id = $data['institute_id'] ?? null;
    $title = $data['title'] ?? null;
    $image_url = $data['image_url'] ?? null;
    $sort_order = $data['sort_order'] ?? 0;
    if (!$institute_id || !$image_url) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id and image_url required']);
    }
    if ($id) {
        $stmt = $pdo->prepare('UPDATE website_carousel SET title = ?, image_url = ?, sort_order = ? WHERE id = ?');
        $stmt->execute([$title, $image_url, $sort_order, $id]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO website_carousel (institute_id, title, image_url, sort_order) VALUES (?, ?, ?, ?)');
        $stmt->execute([$institute_id, $title, $image_url, $sort_order]);
    }
    jsonResponse(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    parse_str(file_get_contents('php://input'), $d);
    $id = $d['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        jsonResponse(['error' => 'id required']);
    }
    $stmt = $pdo->prepare('DELETE FROM website_carousel WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['ok' => true]);
}
