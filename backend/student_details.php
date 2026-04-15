<?php
require_once __DIR__ . '/db.php';

$studentId = $_GET['student_id'] ?? $_GET['id'] ?? null;
if (!$studentId) {
    http_response_code(400);
    jsonResponse(['error' => 'student_id or id is required']);
}

$stmt = $pdo->prepare(
    'SELECT s.*, cls.class_name, cls.section, c.course_name, c.course_code, i.name AS institute_name, i.address AS institute_address, i.logo_url AS institute_logo
     FROM students s
     LEFT JOIN classes cls ON s.class_id = cls.id
     LEFT JOIN courses c ON s.course_id = c.id
     LEFT JOIN institutes i ON s.institute_id = i.id
     WHERE s.id = ?
     LIMIT 1'
);
$stmt->execute([$studentId]);
$student = $stmt->fetch();

if (!$student) {
    http_response_code(404);
    jsonResponse(['error' => 'Student not found']);
}

if (!empty($student['previous_school_details']) && is_string($student['previous_school_details'])) {
    $decoded = json_decode($student['previous_school_details'], true);
    if (json_last_error() === JSON_ERROR_NONE) {
        $student['previous_school_details'] = $decoded;
    }
}

$billStmt = $pdo->prepare('SELECT bill_name, total_amount, paid_amount, status, due_date FROM fee_bills WHERE student_id = ? ORDER BY created_at DESC');
$billStmt->execute([$studentId]);
$fees = $billStmt->fetchAll();

if (!$fees) {
    $feesStmt = $pdo->prepare(
        'SELECT ft.fee_name AS bill_name, cf.amount AS total_amount, 0 AS paid_amount, "unpaid" AS status, NULL AS due_date
         FROM class_fees cf
         LEFT JOIN fee_types ft ON cf.fee_type_id = ft.id
         WHERE cf.class_id = ? AND cf.institute_id = ?
         ORDER BY ft.fee_name ASC'
    );
    $feesStmt->execute([$student['class_id'], $student['institute_id']]);
    $fees = $feesStmt->fetchAll();
}

jsonResponse([
    'student' => $student,
    'fees' => $fees ?: [],
]);
