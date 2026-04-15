<?php
require_once __DIR__ . '/db.php';

$studentId = (int) ($_GET['student_id'] ?? 0);
$fromDate = $_GET['from_date'] ?? '1900-01-01';
$toDate = $_GET['to_date'] ?? '2999-12-31';

if ($studentId <= 0) {
    http_response_code(400);
    jsonResponse(['error' => 'student_id is required']);
}

$stmt = $pdo->prepare(
    'SELECT ft.*, fb.bill_name
     FROM fee_transactions ft
     LEFT JOIN fee_bills fb ON ft.fee_bill_id = fb.id
     WHERE ft.student_id = ? AND ft.payment_date BETWEEN ? AND ?
     ORDER BY ft.payment_date DESC, ft.id DESC'
);
$stmt->execute([$studentId, $fromDate, $toDate]);
$rows = $stmt->fetchAll();

$transactions = array_map(static function (array $row): array {
    if (isset($row['transaction_details']) && is_string($row['transaction_details'])) {
        $decoded = json_decode($row['transaction_details'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $row['transaction_details'] = $decoded;
        }
    }

    $row['amount_paid'] = (float) ($row['amount_paid'] ?? 0);
    $row['fee_bills'] = ['bill_name' => $row['bill_name'] ?? 'Misc. Fee'];
    unset($row['bill_name']);
    return $row;
}, $rows);

jsonResponse($transactions);
