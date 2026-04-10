<?php
// This script tests the authentication flow with updated cookie settings

// Make a login request
$loginUrl = 'http://localhost:8000/auth/login';
$loginData = [
    'email' => 'hisofttechnology2016@gmail.com',
    'password' => '1234567890'  // Correct password from auth.php
];

$loginContext = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json\r\n',
        'content' => json_encode($loginData),
        'follow_location' => false,
        'ignore_errors' => true
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
]);

// Make the login request and capture cookies
$loginResponse = file_get_contents($loginUrl, false, $loginContext);
$loginHeaders = $http_response_header;

// Extract cookies from response headers
$cookies = [];
foreach ($loginHeaders as $header) {
    if (strpos($header, 'Set-Cookie:') === 0) {
        // Get cookie string after 'Set-Cookie: '
        $cookiePart = substr($header, 12);
        // Extract just the cookie name=value part before any semicolon
        $cookiePair = explode(';', $cookiePart)[0];
        $cookies[] = $cookiePair;
    }
}

// Now make a session check request with the captured cookies
$sessionUrl = 'http://localhost:8000/auth/session';
$cookieHeader = 'Cookie: ' . implode('; ', $cookies);

$sessionContext = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => $cookieHeader . "\r\n",
        'follow_location' => false,
        'ignore_errors' => true
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
]);

$sessionResponse = file_get_contents($sessionUrl, false, $sessionContext);

// Output results
echo "\n=== PHP Authentication Flow Test ===\n";
echo "Login Response Status: " . getHttpStatus($loginHeaders) . "\n";
echo "Login Response Data: " . $loginResponse . "\n";
echo "Captured Cookies: " . implode('; ', $cookies) . "\n";
echo "Session Check Status: " . getHttpStatus($http_response_header) . "\n";
echo "Session Data: " . $sessionResponse . "\n";

// Helper function to extract HTTP status code
function getHttpStatus($headers) {
    foreach ($headers as $header) {
        if (strpos($header, 'HTTP/') === 0) {
            return substr($header, 9, 3);
        }
    }
    return 'Unknown';
}

// Now try to access a protected resource (with authentication)
$institutesUrl = 'http://localhost:8000/institutes';
$institutesContext = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => $cookieHeader . "\r\n",
        'follow_location' => false,
        'ignore_errors' => true
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
]);

$institutesResponse = file_get_contents($institutesUrl, false, $institutesContext);
echo "\nProtected Resource (Institutes) with Authentication Status: " . getHttpStatus($http_response_header) . "\n";
echo "Institutes Data Preview: " . substr($institutesResponse, 0, 200) . (strlen($institutesResponse) > 200 ? '...' : '') . "\n";

// Now try to access the same resource without authentication
$institutesNoAuthContext = stream_context_create([
    'http' => [
        'method' => 'GET',
        'follow_location' => false,
        'ignore_errors' => true
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
]);

$institutesNoAuthResponse = file_get_contents($institutesUrl, false, $institutesNoAuthContext);
echo "\nProtected Resource (Institutes) WITHOUT Authentication Status: " . getHttpStatus($http_response_header) . "\n";
echo "Institutes No Auth Response: " . $institutesNoAuthResponse . "\n";