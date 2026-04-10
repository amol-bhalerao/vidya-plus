<?php
require_once __DIR__ . '/db.php';

// Ensure table exists
$pdo->exec("CREATE TABLE IF NOT EXISTS website_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    page VARCHAR(100) NOT NULL,
    section VARCHAR(100) NOT NULL,
    content TEXT,
    UNIQUE KEY institute_page_section (institute_id, page, section)
)");

// GET: fetch content with query params: institute_id, page, section
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $institute_id = $_GET['institute_id'] ?? null;
    $page = $_GET['page'] ?? null;
    $section = $_GET['section'] ?? 'main';
    if (!$institute_id || !$page) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id and page are required']);
    }
    $stmt = $pdo->prepare('SELECT content FROM website_content WHERE institute_id = ? AND page = ? AND section = ? LIMIT 1');
    $stmt->execute([$institute_id, $page, $section]);
    $row = $stmt->fetch();
    jsonResponse(['content' => $row ? json_decode($row['content'], true) : null]);
}

// POST: upsert content (expects JSON body)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?? [];
    $institute_id = $data['institute_id'] ?? null;
    $page = $data['page'] ?? null;
    $section = $data['section'] ?? 'main';
    $content = isset($data['content']) ? json_encode($data['content']) : null;

    if (!$institute_id || !$page) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id and page are required']);
    }

    $stmt = $pdo->prepare('INSERT INTO website_content (institute_id, page, section, content) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)');
    $stmt->execute([$institute_id, $page, $section, $content]);
    jsonResponse(['ok' => true]);
}
