<?php
// Simple test script to diagnose session issues
require_once __DIR__ . '/db.php';

// Test login directly
$email = 'hisofttechnology2016@gmail.com';
$password = '1234567890';

// Get user from database
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    echo "User found: " . $user['email'] . "\n";
    echo "Password hash: " . $user['password_hash'] . "\n";
    echo "Role: " . $user['role'] . "\n";
    
    // Verify password
    $password_verified = password_verify($password, $user['password_hash']);
    echo "Password verified: " . ($password_verified ? "YES" : "NO") . "\n";
    
    // Test session
    echo "\nTesting session:\n";
    
    // Set session data
    $_SESSION['user'] = [
        'id' => $user['id'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'role' => $user['role'],
        'institute_id' => $user['institute_id'],
    ];
    
    echo "Session user set: " . json_encode($_SESSION['user']) . "\n";
    echo "Session ID: " . session_id() . "\n";
    
    // Check if session data is actually stored
    $session_file = session_save_path() . '/sess_' . session_id();
    echo "Session file path: " . $session_file . "\n";
    if (file_exists($session_file)) {
        echo "Session file exists\n";
        echo "Session file content (first 200 chars): " . substr(file_get_contents($session_file), 0, 200) . "...\n";
    } else {
        echo "Session file does not exist\n";
        echo "Session save path: " . session_save_path() . "\n";
        echo "Error: " . error_get_last()['message'] . "\n";
    }
} else {
    echo "User not found\n";
}