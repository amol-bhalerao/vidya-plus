<?php
require_once __DIR__ . '/db.php';

// Ensure table exists
$pdo->exec("CREATE TABLE IF NOT EXISTS website_team (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $institute_id = $_GET['institute_id'] ?? null;
    if (!$institute_id) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id required']);
    }
    $stmt = $pdo->prepare('SELECT * FROM website_team WHERE institute_id = ? ORDER BY sort_order ASC');
    $stmt->execute([$institute_id]);
    $rows = $stmt->fetchAll();
    jsonResponse($rows);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?? [];
    $id = $data['id'] ?? null;
    $institute_id = $data['institute_id'] ?? null;
    $name = $data['name'] ?? '';
    $designation = $data['designation'] ?? null;
    $image_url = $data['image_url'] ?? null;

    if (!$institute_id || !$name) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id and name required']);
    }

    if ($id) {
        $stmt = $pdo->prepare('UPDATE website_team SET name = ?, designation = ?, image_url = ? WHERE id = ?');
        $stmt->execute([$name, $designation, $image_url, $id]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO website_team (institute_id, name, designation, image_url) VALUES (?, ?, ?, ?)');
        $stmt->execute([$institute_id, $name, $designation, $image_url]);
    }
    jsonResponse(['ok' => true]);
}

if ($method === 'DELETE') {
    // Expect query param id
    parse_str(file_get_contents('php://input'), $delVars);
    $id = $delVars['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        jsonResponse(['error' => 'id required']);
    }
    $stmt = $pdo->prepare('DELETE FROM website_team WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['ok' => true]);
}
