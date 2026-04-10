<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Ensure users table exists (simple schema)
$pdo->exec("CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) DEFAULT NULL,
    role VARCHAR(50) DEFAULT 'user',
    institute_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Create default super admin if not exists
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute(['hisofttechnology2016@gmail.com']);
if (!$stmt->fetch()) {
    $pwd = password_hash('1234567890', PASSWORD_DEFAULT);
    $insert = $pdo->prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)');
    $insert->execute(['hisofttechnology2016@gmail.com', $pwd, 'Hisoft Admin', 'super_admin']);
}

function getJsonInput()
{
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

if ($_SERVER['REQUEST_URI'] === '/backend/auth/login' || strpos($_SERVER['REQUEST_URI'], 'auth/login') !== false) {
    $data = getJsonInput();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if ($user && password_verify($password, $user['password_hash'])) {
        // store minimal session and regenerate id so cookie is set/updated
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id' => $user['id'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'role' => $user['role'],
            'institute_id' => $user['institute_id'],
        ];
        // Ensure cookie is explicitly set with appropriate SameSite settings
        if (!headers_sent()) {
            $params = session_get_cookie_params();
            $host = isset($_SERVER['HTTP_HOST']) ? explode(':', $_SERVER['HTTP_HOST'])[0] : '';
            // For localhost development with different ports, set domain with prefix
            $domain = '.localhost'; // Domain prefix allows sharing across all localhost ports
            $secure = false; // HTTP for local dev

            // For localhost development with different ports, use SameSite=Lax which works better
            // For production, consider SameSite=None with Secure flag
            $sameSite = 'Lax';

            $cookieOptions = [
                'expires' => time() + 86400, // Set cookie to expire in 1 day
                'path' => '/',
                'domain' => $domain,
                'secure' => $secure,
                'httponly' => true,
                'samesite' => $sameSite,
            ];

            // Regenerate session ID to ensure cookie is updated
            session_regenerate_id(true);

            // Set the session cookie explicitly
            setcookie(session_name(), session_id(), $cookieOptions);
        }
        // If login request includes debug=1 query param, return session cookie details for debugging
        $debugLogin = isset($_GET['debug']) && $_GET['debug'] == '1';
        if ($debugLogin) {
            $cookieName = session_name();
            $sessionCookie = $_COOKIE[$cookieName] ?? null;
            jsonResponse([
                'user' => $_SESSION['user'],
                'session_id' => session_id(),
                'session_cookie' => $sessionCookie,
                'all_cookies' => $_COOKIE,
                'set_cookie_header' => headers_list(),
            ]);
        }
        jsonResponse(['user' => $_SESSION['user']]);
    } else {
        http_response_code(401);
        jsonResponse(['error' => 'Invalid credentials']);
    }
    exit;
}

if ($_SERVER['REQUEST_URI'] === '/backend/auth/logout' || strpos($_SERVER['REQUEST_URI'], 'auth/logout') !== false) {
    session_unset();
    session_destroy();
    jsonResponse(['ok' => true]);
}

if ($_SERVER['REQUEST_URI'] === '/backend/auth/session' || strpos($_SERVER['REQUEST_URI'], 'auth/session') !== false) {
    $user = $_SESSION['user'] ?? null;
    // If debug flag present, return session id and cookie info to help development troubleshooting
    $debug = isset($_GET['debug']) && $_GET['debug'] == '1';
    if ($debug) {
        $cookieName = session_name();
        $sessionCookie = $_COOKIE[$cookieName] ?? null;
        jsonResponse([
            'user' => $user,
            'session_id' => session_id(),
            'session_cookie' => $sessionCookie,
            'all_cookies' => $_COOKIE,
        ]);
    }
    // Start debug info
    $debugInfo = [
        'session_id' => session_id(),
        'has_session_user' => isset($_SESSION['user']),
        'session_user' => $_SESSION['user'] ?? null,
        'cookies_received' => $_COOKIE,
        'session_cookie_name' => session_name(),
        'session_cookie_value' => $_COOKIE[session_name()] ?? null,
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'request_uri' => $_SERVER['REQUEST_URI'],
        'http_origin' => $_SERVER['HTTP_ORIGIN'] ?? null
    ];
    // Always include debug info in response
    jsonResponse([
        'user' => $user,
        'debug' => $debugInfo
    ]);
}

// Handle set institute for super admin
if (($_SERVER['REQUEST_URI'] === '/backend/auth/set-institute' || strpos($_SERVER['REQUEST_URI'], 'auth/set-institute') !== false) && ($_SERVER['REQUEST_METHOD'] === 'POST')) {
    $userSession = $_SESSION['user'] ?? null;
    if (!$userSession) {
        http_response_code(401);
        jsonResponse(['error' => 'Not authenticated']);
    }

    $data = getJsonInput();
    $instituteId = $data['institute_id'] ?? null;

    if ($instituteId === null) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id is required']);
    }

    // Update session
    $_SESSION['user']['institute_id'] = $instituteId;

    // Also update the database for persistence
    $stmt = $pdo->prepare('UPDATE users SET institute_id = ? WHERE id = ?');
    $stmt->execute([$instituteId, $userSession['id']]);

    jsonResponse(['success' => true, 'user' => $_SESSION['user']]);
    exit;
}

// Handle updateUser (similar to Supabase auth.updateUser)
if (strpos($_SERVER['REQUEST_URI'], 'auth') !== false && ($_SERVER['REQUEST_METHOD'] === 'POST')) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?? [];
    // If body contains 'data' key, treat as updateUser
    if (isset($data['data'])) {
        $userSession = $_SESSION['user'] ?? null;
        if (!$userSession) {
            http_response_code(401);
            jsonResponse(['error' => 'Not authenticated']);
        }
        $fields = $data['data'];
        $allowed = ['institute_id'];
        $updates = [];
        $params = [];
        foreach ($fields as $k => $v) {
            if (in_array($k, $allowed)) {
                $updates[] = "$k = ?";
                $params[] = $v;
            }
        }
        if (count($updates)) {
            $params[] = $userSession['id'];
            $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            // Refresh session
            $stmt2 = $pdo->prepare('SELECT id, email, full_name, role, institute_id FROM users WHERE id = ?');
            $stmt2->execute([$userSession['id']]);
            $u = $stmt2->fetch();
            $_SESSION['user'] = $u;
            jsonResponse(['user' => $_SESSION['user']]);
        } else {
            jsonResponse(['user' => $userSession]);
        }
    }
}
