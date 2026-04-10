<?php
require_once __DIR__ . '/db.php';

$schema = file_get_contents(__DIR__ . '/schema.sql');
$seed = file_get_contents(__DIR__ . '/seed.sql');

try {
    $pdo->exec($schema);
    $pdo->exec($seed);
    // Ensure default super admin exists
    $email = 'hisofttechnology2016@gmail.com';
    $pwd = '1234567890';
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    if (!$stmt->fetch()) {
        $hash = password_hash($pwd, PASSWORD_DEFAULT);
        $ins = $pdo->prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)');
        $ins->execute([$email, $hash, 'Hisoft Admin', 'super_admin']);
    }
    echo "OK\n";
    echo "Super admin: $email / $pwd\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
