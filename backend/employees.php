<?php
require_once __DIR__ . '/db.php';

$pdo->exec("CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT DEFAULT NULL,
    full_name VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    designation VARCHAR(255) DEFAULT NULL,
    role_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $institute_id = $_GET['institute_id'] ?? null;
    if ($institute_id) {
        $stmt = $pdo->prepare('SELECT e.*, r.name as role_name FROM employees e LEFT JOIN roles r ON e.role_id = r.id WHERE e.institute_id = ?');
        $stmt->execute([$institute_id]);
    } else {
        $stmt = $pdo->query('SELECT e.*, r.name as role_name FROM employees e LEFT JOIN roles r ON e.role_id = r.id');
    }
    $rows = $stmt->fetchAll();
    // adapt to frontend expectation: include roles object
    $out = array_map(function ($r) {
        $r['roles'] = ['name' => $r['role_name'] ?? null];
        unset($r['role_name']);
        return $r;
    }, $rows);
    jsonResponse($out);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = $data['id'] ?? null;
    $institute_id = $data['institute_id'] ?? null;
    $full_name = $data['full_name'] ?? null;
    $email = $data['email'] ?? null;
    $designation = $data['designation'] ?? null;
    $role_id = $data['role_id'] ?? null;
    $create_user = $data['create_user'] ?? false;
    $password = $data['password'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare('UPDATE employees SET full_name = ?, email = ?, designation = ?, role_id = ?, institute_id = ? WHERE id = ?');
        $stmt->execute([$full_name, $email, $designation, $role_id, $institute_id, $id]);
        $employee_id = $id;
    } else {
        $stmt = $pdo->prepare('INSERT INTO employees (institute_id, full_name, email, designation, role_id) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$institute_id, $full_name, $email, $designation, $role_id]);
        $employee_id = $pdo->lastInsertId();
    }

    // Optionally create or link a user account
    if ($create_user && $email) {
        // Check if user exists
        $us = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $us->execute([$email]);
        $existing = $us->fetch();
        if ($existing) {
            $user_id = $existing['id'];
        } else {
            if (!$password) {
                http_response_code(400);
                jsonResponse(['error' => 'password required to create user']);
            }
            // Determine role name for user
            $roleName = null;
            if ($role_id) {
                $rstmt = $pdo->prepare('SELECT name FROM roles WHERE id = ?');
                $rstmt->execute([$role_id]);
                $rrow = $rstmt->fetch();
                $roleName = $rrow['name'] ?? null;
            }
            $userRole = $roleName ?? 'user';
            $pwdHash = password_hash($password, PASSWORD_DEFAULT);
            $insu = $pdo->prepare('INSERT INTO users (email, password_hash, full_name, role, institute_id) VALUES (?, ?, ?, ?, ?)');
            $insu->execute([$email, $pwdHash, $full_name, $userRole, $institute_id]);
            $user_id = $pdo->lastInsertId();
        }
        // update employee row with user_id
        $ustmt = $pdo->prepare('UPDATE employees SET user_id = ? WHERE id = ?');
        $ustmt->execute([$user_id, $employee_id]);
    }

    // return the created/updated employee record (with roles object)
    $fstmt = $pdo->prepare('SELECT e.*, r.name as role_name FROM employees e LEFT JOIN roles r ON e.role_id = r.id WHERE e.id = ? LIMIT 1');
    $fstmt->execute([$employee_id]);
    $row = $fstmt->fetch();
    if ($row) {
        $row['roles'] = ['name' => $row['role_name'] ?? null];
        unset($row['role_name']);
    }
    jsonResponse(['ok' => true, 'employee' => $row]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    parse_str(file_get_contents('php://input'), $d);
    $id = $d['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        jsonResponse(['error' => 'id required']);
    }
    $stmt = $pdo->prepare('DELETE FROM employees WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['ok' => true]);
}
