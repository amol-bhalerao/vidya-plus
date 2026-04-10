<?php
// Simple smoke tests for backend endpoints and DB setup.
// Run on the server (php dev_smoke_tests.php) after running run_seed.php
require_once __DIR__ . '/db.php';

function out($msg)
{
    echo $msg . "\n";
}

try {
    out("Starting smoke tests...");

    // 1) Create a test institute
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT INTO institutes (name, address) VALUES (?, ?)');
    $stmt->execute(['Smoke Institute', 'Smoke test address']);
    $institute_id = $pdo->lastInsertId();
    out("Created institute id={$institute_id}");

    // 2) Create a role
    $stmt = $pdo->prepare('INSERT INTO roles (name, description) VALUES (?, ?)');
    $stmt->execute(['teacher', 'Teacher role']);
    $role_id = $pdo->lastInsertId();
    out("Created role id={$role_id}");

    // 3) Create an employee via direct DB insert (simulate POST)
    $email = 'smoke+' . time() . '@example.com';
    $stmt = $pdo->prepare('INSERT INTO employees (institute_id, full_name, email, designation, role_id) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$institute_id, 'Smoke Person', $email, 'Instructor', $role_id]);
    $employee_id = $pdo->lastInsertId();
    out("Created employee id={$employee_id} email={$email}");

    // 4) Create a linked user (simulate create_user flow)
    $pwdHash = password_hash('SmokePass123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, full_name, role, institute_id) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$email, $pwdHash, 'Smoke Person', 'teacher', $institute_id]);
    $user_id = $pdo->lastInsertId();
    out("Created user id={$user_id}");

    // 5) Link user to employee
    $stmt = $pdo->prepare('UPDATE employees SET user_id = ? WHERE id = ?');
    $stmt->execute([$user_id, $employee_id]);
    out("Linked user to employee");

    // 6) Read back employee and ensure roles returned
    $stmt = $pdo->prepare('SELECT e.*, r.name as role_name FROM employees e LEFT JOIN roles r ON e.role_id = r.id WHERE e.id = ?');
    $stmt->execute([$employee_id]);
    $row = $stmt->fetch();
    if (!$row)
        throw new Exception('Failed to fetch employee');
    out('Employee fetched: ' . json_encode($row));

    // 7) Test website endpoints (team/gallery/documents/events/carousel)
    out('Testing website endpoints...');
    // website_team
    $tstmt = $pdo->prepare('INSERT INTO website_team (institute_id, name, designation) VALUES (?, ?, ?)');
    $tstmt->execute([$institute_id, 'Test Member', 'Tester']);
    $teamId = $pdo->lastInsertId();
    out("website_team created id={$teamId}");

    // gallery
    $gstmt = $pdo->prepare('INSERT INTO website_gallery (institute_id, title) VALUES (?, ?)');
    $gstmt->execute([$institute_id, 'Smoke Gallery']);
    $galleryId = $pdo->lastInsertId();
    out("website_gallery created id={$galleryId}");

    // documents
    $dstmt = $pdo->prepare('INSERT INTO website_documents (institute_id, title, category) VALUES (?, ?, ?)');
    $dstmt->execute([$institute_id, 'Smoke Doc', 'SmokeCat']);
    $docId = $pdo->lastInsertId();
    out("website_documents created id={$docId}");

    // events
    $estmt = $pdo->prepare('INSERT INTO website_events (institute_id, title, date) VALUES (?, ?, ?)');
    $estmt->execute([$institute_id, 'Smoke Event', date('Y-m-d')]);
    $eventId = $pdo->lastInsertId();
    out("website_events created id={$eventId}");

    // carousel
    $cstmt = $pdo->prepare('INSERT INTO website_carousel (institute_id, title) VALUES (?, ?)');
    $cstmt->execute([$institute_id, 'Smoke Slide']);
    $carouselId = $pdo->lastInsertId();
    out("website_carousel created id={$carouselId}");

    // 8) Test uploads: create a small temp file and ensure uploads directory accepts it
    $tmpDir = __DIR__ . '/uploads/smoke_test';
    if (!is_dir($tmpDir))
        mkdir($tmpDir, 0755, true);
    $tmpFile = $tmpDir . '/smoke.txt';
    file_put_contents($tmpFile, "smoke test content");
    if (is_file($tmpFile)) {
        out('Temp file created for upload test.');
    } else {
        throw new Exception('Failed to create temp file for upload test');
    }

    // 9) Clean up website records
    $pdo->prepare('DELETE FROM website_team WHERE id = ?')->execute([$teamId]);
    $pdo->prepare('DELETE FROM website_gallery WHERE id = ?')->execute([$galleryId]);
    $pdo->prepare('DELETE FROM website_documents WHERE id = ?')->execute([$docId]);
    $pdo->prepare('DELETE FROM website_events WHERE id = ?')->execute([$eventId]);
    $pdo->prepare('DELETE FROM website_carousel WHERE id = ?')->execute([$carouselId]);

    // 10) Delete temp file
    unlink($tmpFile);

    // 11) Delete created records
    $stmt = $pdo->prepare('DELETE FROM employees WHERE id = ?');
    $stmt->execute([$employee_id]);
    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    $stmt = $pdo->prepare('DELETE FROM roles WHERE id = ?');
    $stmt->execute([$role_id]);
    $stmt = $pdo->prepare('DELETE FROM institutes WHERE id = ?');
    $stmt->execute([$institute_id]);

    $pdo->commit();
    out('Smoke tests completed successfully.');
} catch (Exception $e) {
    $pdo->rollBack();
    out('Smoke test failed: ' . $e->getMessage());
    exit(1);
}

?>