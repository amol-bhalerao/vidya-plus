<?php
// More comprehensive test script to diagnose session flow
require_once __DIR__ . '/db.php';

// 1. Clear any existing session
session_unset();
session_destroy();
session_start();

// 2. Simulate login process
$email = 'hisofttechnology2016@gmail.com';
$password = '1234567890';

// Get user from database
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
    echo "Step 1: Login successful!\n";
    
    // Store user in session
    $_SESSION['user'] = [
        'id' => $user['id'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'role' => $user['role'],
        'institute_id' => $user['institute_id'],
    ];
    
    echo "User stored in session: " . json_encode($_SESSION['user']) . "\n";
    echo "Current session ID: " . session_id() . "\n";
    
    // 3. Simulate a new request to check session
    echo "\nStep 2: Simulating a new request to check session...\n";
    
    // Close the current session and start a new one with the same ID to simulate a new request
    session_write_close();
    session_id(session_id()); // Reuse the same session ID
    session_start();
    
    echo "New request session ID: " . session_id() . "\n";
    echo "User in new session: " . (isset($_SESSION['user']) ? json_encode($_SESSION['user']) : 'null') . "\n";
    
    // 4. Check database for institute data
    echo "\nStep 3: Checking institute data...\n";
    $stmt = $pdo->prepare('SELECT * FROM institutes LIMIT 1');
    $stmt->execute();
    $institute = $stmt->fetch();
    echo "Found institute: " . ($institute ? $institute['name'] : 'No institutes found') . "\n";
    
    // 5. Create a simple HTML page with API test buttons
    create_test_html();
} else {
    echo "Login failed. Check credentials or user existence.\n";
}

function create_test_html() {
    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        button { padding: 10px 20px; margin: 10px; cursor: pointer; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>API Test Page</h1>
    
    <div>
        <h2>Test Authentication</h2>
        <button id="loginBtn">Login</button>
        <button id="checkSessionBtn">Check Session</button>
        <button id="logoutBtn">Logout</button>
    </div>
    
    <div>
        <h2>Test Website Data</h2>
        <button id="getWebsiteContentBtn">Get Website Content</button>
        <button id="getInstitutesBtn">Get Institutes</button>
    </div>
    
    <div>
        <h2>Response</h2>
        <pre id="response"></pre>
    </div>
    
    <script>
        const API_BASE = 'http://localhost:8000';
        
        function showResponse(data) {
            document.getElementById('response').textContent = JSON.stringify(data, null, 2);
        }
        
        document.getElementById('loginBtn').addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'hisofttechnology2016@gmail.com',
                        password: '1234567890'
                    })
                });
                const data = await response.json();
                showResponse({ status: response.status, data });
            } catch (error) {
                showResponse({ error: error.message });
            }
        });
        
        document.getElementById('checkSessionBtn').addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_BASE}/auth/session`, {

                    method: 'GET',
                    credentials: 'include'
                });
                const data = await response.json();
                showResponse({ status: response.status, data });
            } catch (error) {
                showResponse({ error: error.message });
            }
        });
        
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
                const data = await response.json();
                showResponse({ status: response.status, data });
            } catch (error) {
                showResponse({ error: error.message });
            }
        });
        
        document.getElementById('getWebsiteContentBtn').addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_BASE}/website/content`);
                const data = await response.json();
                showResponse({ status: response.status, data });
            } catch (error) {
                showResponse({ error: error.message });
            }
        });
        
        document.getElementById('getInstitutesBtn').addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_BASE}/institutes`);
                const data = await response.json();
                showResponse({ status: response.status, data });
            } catch (error) {
                showResponse({ error: error.message });
            }
        });
    </script>
</body>
</html>
HTML;
    
    file_put_contents(__DIR__ . '/api_test.html', $html);
    echo "\nStep 4: Created API test HTML page at: " . __DIR__ . "/api_test.html\n";
    echo "Open this file in your browser to manually test the API endpoints and session handling.\n";
}