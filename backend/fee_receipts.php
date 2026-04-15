<?php
require_once __DIR__ . '/db.php';

function decodeReceiptJson(array $row): array
{
    foreach (['misc_fee_details', 'transaction_details', 'contact_info'] as $field) {
        if (isset($row[$field]) && is_string($row[$field])) {
            $decoded = json_decode($row[$field], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $row[$field] = $decoded;
            }
        }
    }
    return $row;
}

$transactionId = (int) ($_GET['transaction_id'] ?? $_GET['id'] ?? 0);
if ($transactionId <= 0) {
    http_response_code(400);
    jsonResponse(['error' => 'transaction_id is required']);
}

$transactionStmt = $pdo->prepare('SELECT * FROM fee_transactions WHERE id = ? LIMIT 1');
$transactionStmt->execute([$transactionId]);
$transaction = $transactionStmt->fetch();
if (!$transaction) {
    http_response_code(404);
    jsonResponse(['error' => 'Transaction not found']);
}
$transaction = decodeReceiptJson($transaction);

$billStmt = $pdo->prepare('SELECT * FROM fee_bills WHERE id = ? LIMIT 1');
$billStmt->execute([$transaction['fee_bill_id']]);
$bill = decodeReceiptJson($billStmt->fetch() ?: []);

$studentStmt = $pdo->prepare(
    'SELECT s.*, cls.class_name, cls.section, c.course_name, c.course_code,
            i.name AS institute_name, i.address AS institute_address, i.logo_url,
            i.receipt_header, i.receipt_footer, i.contact_info
     FROM students s
     LEFT JOIN classes cls ON s.class_id = cls.id
     LEFT JOIN courses c ON s.course_id = c.id
     LEFT JOIN institutes i ON s.institute_id = i.id
     WHERE s.id = ?
     LIMIT 1'
);
$studentStmt->execute([$transaction['student_id']]);
$studentRow = $studentStmt->fetch();
if (!$studentRow) {
    http_response_code(404);
    jsonResponse(['error' => 'Student not found']);
}
$studentRow = decodeReceiptJson($studentRow);

$previousStmt = $pdo->prepare('SELECT * FROM fee_transactions WHERE fee_bill_id = ? AND id <> ? ORDER BY payment_date DESC, id DESC');
$previousStmt->execute([$transaction['fee_bill_id'], $transactionId]);
$previousTransactions = array_map('decodeReceiptJson', $previousStmt->fetchAll());

$outstandingStmt = $pdo->prepare('SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM fee_bills WHERE student_id = ?');
outstandingStmt->execute([$transaction['student_id']]);
$totalOutstanding = (float) $outstandingStmt->fetchColumn();

jsonResponse([
    'transaction' => $transaction,
    'student' => [
        'id' => $studentRow['id'],
        'full_name' => $studentRow['full_name'],
        'gr_no' => $studentRow['gr_no'],
        'admission_no' => $studentRow['admission_no'],
    ],
    'class_details' => [
        'class_name' => $studentRow['class_name'] ?? null,
        'section' => $studentRow['section'] ?? null,
    ],
    'course_details' => [
        'course_name' => $studentRow['course_name'] ?? null,
        'course_code' => $studentRow['course_code'] ?? null,
    ],
    'bill' => $bill,
    'institute' => [
        'name' => $studentRow['institute_name'] ?? null,
        'address' => $studentRow['institute_address'] ?? null,
        'logo_url' => $studentRow['logo_url'] ?? null,
        'receipt_header' => $studentRow['receipt_header'] ?? null,
        'receipt_footer' => $studentRow['receipt_footer'] ?? null,
        'contact_info' => $studentRow['contact_info'] ?? null,
    ],
    'student_total_outstanding' => $totalOutstanding,
    'previous_transactions' => $previousTransactions,
]);
