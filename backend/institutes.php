<?php
require_once __DIR__ . '/db.php';

// Ensure institutes table exists
$pdo->exec("CREATE TABLE IF NOT EXISTS institutes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT DEFAULT NULL,
    udise_code VARCHAR(100) DEFAULT NULL,
    logo_url TEXT DEFAULT NULL,
    receipt_header TEXT DEFAULT NULL,
    receipt_footer TEXT DEFAULT NULL,
    contact_info JSON DEFAULT NULL,
    social_links JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Add sample institute data if table is empty
$checkStmt = $pdo->query('SELECT COUNT(*) FROM institutes');
$count = $checkStmt->fetchColumn();
if ($count === 0) {
    $pdo->exec("INSERT INTO institutes (name, address) VALUES
        ('Vidya Institute', '123 Demo Street'),
        ('Tech Academy', '456 Tech Avenue')
    ");
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if it's a public request for website
    $isPublicRequest = strpos($_SERVER['REQUEST_URI'], '/institutes/public') !== false;

    // Check if it's a request for a specific institute
    $uri = $_SERVER['REQUEST_URI'];
    $matches = [];
    if (preg_match('/\/institutes\/(\d+)$/', $uri, $matches)) {
        $instituteId = $matches[1];

        // Requires authentication for individual institute access
        $user = $_SESSION['user'] ?? null;
        if (!$user) {
            http_response_code(401);
            jsonResponse(['error' => 'Authentication required']);
        }

        try {
            $stmt = $pdo->prepare('SELECT * FROM institutes WHERE id = ?');
            $stmt->execute([$instituteId]);
            $data = $stmt->fetch();

            if (!$data) {
                http_response_code(404);
                jsonResponse(['error' => 'Institute not found']);
            }

            jsonResponse($data);
        } catch (Exception $e) {
            http_response_code(500);
            jsonResponse(['error' => 'Failed to fetch institute']);
        }
        exit;
    }

    if ($isPublicRequest) {
        // Public endpoint - no authentication required, return mock data if DB fails
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 1;
        try {
            $stmt = $pdo->prepare('SELECT * FROM institutes ORDER BY id ASC LIMIT ?');
            $stmt->execute([$limit]);
            $data = $stmt->fetchAll();
            jsonResponse($data);
        } catch (Exception $e) {
            // Return mock data if database fails
            $mockData = [
                [
                    'id' => 1,
                    'name' => 'VidyaPlus College',
                    'email' => 'info@vidyaplus.edu',
                    'phone' => '+1 234 567 890',
                    'address' => '123 Education Street, Academic City',
                    'logo' => '/placeholder-logo.png',
                    'description' => 'A leading educational institution'
                ]
            ];
            jsonResponse(array_slice($mockData, 0, $limit));
        }
    } else {
        // Regular endpoint - requires authentication
        $user = $_SESSION['user'] ?? null;
        if (!$user) {
            http_response_code(401);
            jsonResponse(['error' => 'Authentication required']);
        }

        $stmt = $pdo->query('SELECT * FROM institutes ORDER BY id ASC');
        $data = $stmt->fetchAll();
        jsonResponse($data);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update institute - requires super admin
    $user = $_SESSION['user'] ?? null;
    if (!$user || $user['role'] !== 'super_admin') {
        http_response_code(403);
        jsonResponse(['error' => 'Super admin access required']);
    }

    // Get institute ID from URL
    $uri = $_SERVER['REQUEST_URI'];
    $matches = [];
    if (!preg_match('/\/institutes\/(\d+)$/', $uri, $matches)) {
        http_response_code(400);
        jsonResponse(['error' => 'Institute ID required']);
    }
    $instituteId = $matches[1];

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        jsonResponse(['error' => 'Invalid input data']);
    }

    try {
        // Build update query dynamically
        $updateFields = [];
        $params = [];

        $allowedFields = ['name', 'address', 'udise_code', 'logo_url', 'receipt_header', 'receipt_footer', 'contact_info', 'social_links'];
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }

        if (empty($updateFields)) {
            http_response_code(400);
            jsonResponse(['error' => 'No valid fields to update']);
        }

        $params[] = $instituteId;
        $sql = "UPDATE institutes SET " . implode(', ', $updateFields) . " WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            jsonResponse(['error' => 'Institute not found or no changes made']);
        }

        // Return updated institute
        $stmt = $pdo->prepare('SELECT * FROM institutes WHERE id = ?');
        $stmt->execute([$instituteId]);
        $updatedInstitute = $stmt->fetch();

        jsonResponse($updatedInstitute);
    } catch (Exception $e) {
        http_response_code(500);
        jsonResponse(['error' => 'Failed to update institute: ' . $e->getMessage()]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create new institute - requires super admin
    $user = $_SESSION['user'] ?? null;
    if (!$user || $user['role'] !== 'super_admin') {
        http_response_code(403);
        jsonResponse(['error' => 'Super admin access required']);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['name']) || empty(trim($input['name']))) {
        http_response_code(400);
        jsonResponse(['error' => 'Institute name is required']);
    }

    try {
        $stmt = $pdo->prepare('INSERT INTO institutes (name) VALUES (?)');
        $stmt->execute([trim($input['name'])]);
        $newId = $pdo->lastInsertId();

        // Return the created institute
        $stmt = $pdo->prepare('SELECT * FROM institutes WHERE id = ?');
        $stmt->execute([$newId]);
        $newInstitute = $stmt->fetch();

        jsonResponse($newInstitute);
    } catch (Exception $e) {
        http_response_code(500);
        jsonResponse(['error' => 'Failed to create institute: ' . $e->getMessage()]);
    }
}
