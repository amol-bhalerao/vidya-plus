<?php
// Database connection using PDO. Update credentials if needed.

// CORS headers for local development
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Expose-Headers: Content-Type, X-Total-Count');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Start session with secure cookie params suitable for local dev
if (session_status() === PHP_SESSION_NONE) {
    $httpHost = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $cookieHost = preg_replace('/:\\d+$/', '', $httpHost);
    $isLocalHost = in_array($cookieHost, ['localhost', '127.0.0.1'], true);

    // Configure session before starting
    ini_set('session.use_only_cookies', 1);
    ini_set('session.use_strict_mode', 0); // Allow session resumption
    ini_set('session.cookie_lifetime', 86400); // 1 day cookie lifetime
    ini_set('session.cookie_path', '/');
    ini_set('session.cookie_domain', $isLocalHost ? '' : $cookieHost);
    ini_set('session.cookie_secure', false); // Allow HTTP for local dev
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_samesite', 'Lax');

    // Start the session
    session_start();

    // Regenerate session ID for security
    if (!isset($_SESSION['created_at'])) {
        session_regenerate_id(true);
        $_SESSION['created_at'] = time();
    }
}

// Local development database configuration
$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_PORT = getenv('DB_PORT') ?: '3306';
$DB_NAME = getenv('DB_NAME') ?: 'vidya_plus';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';

// Production database configuration (uncomment for production)
// $DB_HOST = 'auth-db1234.hstgr.io';
// $DB_PORT = '3306';
// $DB_NAME = 'u441114691_vidya';
// $DB_USER = 'u441114691_vidya';
// $DB_PASS = 'Aarya@202112345';

try {
    $dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4";
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
    exit;
}

function jsonResponse($data)
{
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
