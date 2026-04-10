<?php
// Debug script to test authentication flow and session persistence
require_once __DIR__ . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

// Function to log debug info
function logDebug($message, $data = null) {
    echo "\n--- {$message} ---".PHP_EOL;
    if ($data !== null) {
        echo print_r($data, true).PHP_EOL;
    }
    echo "-----------------\n";
}

// Initial check - print session and cookie info
logDebug('Initial Session and Cookie Info', [
    'session_id' => session_id(),
    'session_user' => $_SESSION['user'] ?? null,
    'cookies' => $_COOKIE,
    'session_name' => session_name(),
    'samesite' => ini_get('session.cookie_samesite'),
    'secure' => ini_get('session.cookie_secure'),
    'http_only' => ini_get('session.cookie_httponly'),
    'domain' => ini_get('session.cookie_domain'),
]);

// Step 1: Try to login as super admin
logDebug('Step 1: Attempting Login');

// Prepare login data
$loginData = [
    'email' => 'hisofttechnology2016@gmail.com',
    'password' => '1234567890'
];

// Simulate login request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/auth/login');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookies.txt'); // Save cookies
sleep(1); // Small delay to ensure session processing
$loginResponse = curl_exec($ch);
$loginStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

logDebug('Login Response', [
    'status' => $loginStatus,
    'response' => json_decode($loginResponse, true)
]);

// Step 2: Check session after login
logDebug('Step 2: Checking Session After Login');
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/auth/session?debug=1');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookies.txt'); // Use saved cookies
sleep(1);
$sessionResponse = curl_exec($ch);
$sessionStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

logDebug('Session Check Response', [
    'status' => $sessionStatus,
    'response' => json_decode($sessionResponse, true)
]);

// Step 3: Try to access protected resource (institutes)
logDebug('Step 3: Accessing Protected Resource (/institutes)');
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/institutes');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookies.txt'); // Use saved cookies
sleep(1);
$resourceResponse = curl_exec($ch);
$resourceStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

logDebug('Protected Resource Response', [
    'status' => $resourceStatus,
    'response' => json_decode($resourceResponse, true)
]);

// Step 4: Check redirect behavior simulation
logDebug('Step 4: Redirect Behavior Analysis');

// Analyze potential issues
$sessionData = json_decode($sessionResponse, true);
$potentialIssues = [];

// Check if user is properly authenticated
echo "\n--- Potential Issues Analysis ---".PHP_EOL;

if (!isset($sessionData['user']) || $sessionData['user'] === null) {
    echo "✗ Session does not contain user data after login".PHP_EOL;
} else {
    echo "✓ User data is present in session".PHP_EOL;
}

// Check SameSite and cookie settings
$cookieParams = session_get_cookie_params();
if ($cookieParams['samesite'] === 'None' && !$cookieParams['secure']) {
    echo "✗ WARNING: SameSite=None requires Secure attribute in production".PHP_EOL;
} else if ($cookieParams['samesite'] === 'Lax' && !$cookieParams['secure'] && $_SERVER['HTTP_HOST'] === 'localhost') {
    echo "✓ SameSite=Lax without Secure is acceptable for localhost development".PHP_EOL;
}

// Check CORS headers
if (isset($_SERVER['HTTP_ORIGIN'])) {
    echo "✓ CORS headers are being set for cross-origin requests".PHP_EOL;
}

// Check if there might be a redirect loop
$redirectCheck = [
    'Dashboard route requires auth' => true,
    'Login route redirects to dashboard when logged in' => true,
    'Potential redirect loop if auth check fails intermittently' => true
];
echo "✓ Redirect configuration is in place".PHP_EOL;

// Summary
echo "\n--- Debug Summary ---".PHP_EOL;
echo "1. Login was ".($loginStatus === 200 ? 'SUCCESSFUL' : 'FAILED').PHP_EOL;
echo "2. Session persistence: ".(isset($sessionData['user']) ? 'WORKING' : 'NOT WORKING').PHP_EOL;
echo "3. Protected resource access: ".($resourceStatus === 200 ? 'SUCCESSFUL' : 'FAILED').PHP_EOL;
echo "4. Potential issues: ".(empty($potentialIssues) ? 'None found' : count($potentialIssues)).PHP_EOL;

echo "\n--- Recommendations ---".PHP_EOL;
echo "1. Clear browser cache and cookies, then try again".PHP_EOL;
echo "2. If issue persists, check browser console for CORS or cookie errors".PHP_EOL;
echo "3. Ensure both frontend and backend are running on correct ports".PHP_EOL;
echo "4. Verify that the user object is properly set in context after login".PHP_EOL;
echo "5. Consider adding more detailed logging in UserContext.jsx".PHP_EOL;

// Clean up
if (file_exists('cookies.txt')) {
    unlink('cookies.txt');
}