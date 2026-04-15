<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    jsonResponse(['error' => 'Method not allowed']);
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$studentId = $data['student_id'] ?? null;
$newClassId = $data['new_class_id'] ?? null;
$newCourseId = $data['new_course_id'] ?? null;

if (!$studentId || !$newClassId || !$newCourseId) {
    http_response_code(400);
    jsonResponse(['error' => 'student_id, new_class_id and new_course_id are required']);
}

$studentStmt = $pdo->prepare('SELECT * FROM students WHERE id = ? LIMIT 1');
$studentStmt->execute([$studentId]);
$student = $studentStmt->fetch();
if (!$student) {
    http_response_code(404);
    jsonResponse(['error' => 'Student not found']);
}

$update = $pdo->prepare('UPDATE students SET class_id = ?, course_id = ?, status = ? WHERE id = ?');
$update->execute([$newClassId, $newCourseId, 'active', $studentId]);

$classInfoStmt = $pdo->prepare(
    'SELECT c.class_name, c.section, co.course_name
     FROM classes c
     LEFT JOIN courses co ON co.id = ?
     WHERE c.id = ?
     LIMIT 1'
);
$classInfoStmt->execute([$newCourseId, $newClassId]);
$classInfo = $classInfoStmt->fetch() ?: ['class_name' => 'Class', 'section' => null, 'course_name' => 'Course'];
$classLabel = trim((string) $classInfo['course_name'] . ' - ' . (string) $classInfo['class_name'] . (!empty($classInfo['section']) ? ' ' . $classInfo['section'] : ''));

$classFeesStmt = $pdo->prepare(
    'SELECT ft.fee_name, cf.amount
     FROM class_fees cf
     LEFT JOIN fee_types ft ON ft.id = cf.fee_type_id
     WHERE cf.class_id = ? AND cf.institute_id = ?'
);
$classFeesStmt->execute([$newClassId, $student['institute_id']]);
$classFees = $classFeesStmt->fetchAll();

$billInsert = $pdo->prepare(
    'INSERT INTO fee_bills (student_id, institute_id, bill_name, due_date, total_amount, paid_amount, status, last_payment_date)
     VALUES (?, ?, ?, ?, ?, 0, ?, NULL)'
);
$billExists = $pdo->prepare('SELECT id FROM fee_bills WHERE student_id = ? AND bill_name = ? LIMIT 1');

foreach ($classFees as $fee) {
    $billName = $classLabel . ' - ' . ($fee['fee_name'] ?: 'Class Fee');
    $billExists->execute([$studentId, $billName]);
    if ($billExists->fetch()) {
        continue;
    }

    $billInsert->execute([
        $studentId,
        $student['institute_id'],
        $billName,
        date('Y-m-d', strtotime('+30 days')),
        $fee['amount'],
        'unpaid',
    ]);
}

$ledgerDescription = $student['full_name'] . ' promoted to ' . $classLabel . '. New class fee bills added to the student account.';
$ledgerExists = $pdo->prepare('SELECT id FROM general_ledger WHERE institute_id = ? AND transaction_type = ? AND reference_id = ? AND description = ? LIMIT 1');
$ledgerExists->execute([$student['institute_id'], 'student_promotion', $studentId, $ledgerDescription]);
if (!$ledgerExists->fetch()) {
    $ledgerInsert = $pdo->prepare(
        'INSERT INTO general_ledger (institute_id, transaction_date, account, description, debit, credit, transaction_type, reference_id)
         VALUES (?, ?, ?, ?, NULL, NULL, ?, ?)'
    );
    $ledgerInsert->execute([
        $student['institute_id'],
        date('Y-m-d'),
        'Promotions Register',
        $ledgerDescription,
        'student_promotion',
        $studentId,
    ]);
}

jsonResponse([
    'ok' => true,
    'student_id' => $studentId,
    'new_class_id' => $newClassId,
    'new_course_id' => $newCourseId,
]);
