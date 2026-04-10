<?php
require_once __DIR__ . '/db.php';

$pdo->exec("CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query('SELECT * FROM roles ORDER BY id ASC');
    jsonResponse($stmt->fetchAll());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $name = $data['name'] ?? null;
    if (!$name) {
        http_response_code(400);
        jsonResponse(['error' => 'name required']);
    }
    $stmt = $pdo->prepare('INSERT INTO roles (name) VALUES (?)');
    $stmt->execute([$name]);
    jsonResponse(['ok' => true]);
}
