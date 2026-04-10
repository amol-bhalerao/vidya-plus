<?php
require_once __DIR__ . '/db.php';

$pdo->exec("CREATE TABLE IF NOT EXISTS website_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    file_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $institute_id = $_GET['institute_id'] ?? null;
    if (!$institute_id) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id required']);
    }
    $stmt = $pdo->prepare('SELECT * FROM website_documents WHERE institute_id = ? ORDER BY category, created_at');
    $stmt->execute([$institute_id]);
    jsonResponse($stmt->fetchAll());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = $data['id'] ?? null;
    $institute_id = $data['institute_id'] ?? null;
    $title = $data['title'] ?? null;
    $category = $data['category'] ?? null;
    $file_url = $data['file_url'] ?? null;
    if (!$institute_id || !$title) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id and title required']);
    }
    if ($id) {
        $stmt = $pdo->prepare('UPDATE website_documents SET title = ?, category = ?, file_url = ? WHERE id = ?');
        $stmt->execute([$title, $category, $file_url, $id]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO website_documents (institute_id, title, category, file_url) VALUES (?, ?, ?, ?)');
        $stmt->execute([$institute_id, $title, $category, $file_url]);
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
    $stmt = $pdo->prepare('DELETE FROM website_documents WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['ok' => true]);
}
