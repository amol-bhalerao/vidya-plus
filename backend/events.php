<?php
require_once __DIR__ . '/db.php';

$pdo->exec("CREATE TABLE IF NOT EXISTS website_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    date DATE DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $institute_id = $_GET['institute_id'] ?? null;
    if (!$institute_id) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id required']);
    }
    $stmt = $pdo->prepare('SELECT * FROM website_events WHERE institute_id = ? ORDER BY date DESC');
    $stmt->execute([$institute_id]);
    jsonResponse($stmt->fetchAll());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = $data['id'] ?? null;
    $institute_id = $data['institute_id'] ?? null;
    $title = $data['title'] ?? null;
    $description = $data['description'] ?? null;
    $date = $data['date'] ?? null;
    $image_url = $data['image_url'] ?? null;
    if (!$institute_id || !$title) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id and title required']);
    }
    if ($id) {
        $stmt = $pdo->prepare('UPDATE website_events SET title = ?, description = ?, date = ?, image_url = ? WHERE id = ?');
        $stmt->execute([$title, $description, $date, $image_url, $id]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO website_events (institute_id, title, description, date, image_url) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$institute_id, $title, $description, $date, $image_url]);
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
    $stmt = $pdo->prepare('DELETE FROM website_events WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['ok' => true]);
}
