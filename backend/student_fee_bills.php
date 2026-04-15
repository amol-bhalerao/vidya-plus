<?php
require_once __DIR__ . '/db.php';

function decodeFeeJson(array $row): array
{
    foreach (['misc_fee_details', 'transaction_details'] as $field) {
        if (isset($row[$field]) && is_string($row[$field])) {
            $decoded = json_decode($row[$field], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $row[$field] = $decoded;
            }
        }
    }
    return $row;
}

$studentId = (int) ($_GET['student_id'] ?? 0);
if ($studentId <= 0) {
    http_response_code(400);
    jsonResponse(['error' => 'student_id is required']);
}

$billsStmt = $pdo->prepare('SELECT * FROM fee_bills WHERE student_id = ? ORDER BY created_at DESC, id DESC');
$billsStmt->execute([$studentId]);
$bills = array_map('decodeFeeJson', $billsStmt->fetchAll());

$txStmt = $pdo->prepare('SELECT * FROM fee_transactions WHERE student_id = ? ORDER BY payment_date DESC, id DESC');
$txStmt->execute([$studentId]);
$transactions = array_map('decodeFeeJson', $txStmt->fetchAll());

$transactionsByBill = [];
foreach ($transactions as $transaction) {
    $billId = (int) ($transaction['fee_bill_id'] ?? 0);
    if (!isset($transactionsByBill[$billId])) {
        $transactionsByBill[$billId] = [];
    }
    $transactionsByBill[$billId][] = $transaction;
}

foreach ($bills as &$bill) {
    $billId = (int) ($bill['id'] ?? 0);
    $bill['fee_transactions'] = $transactionsByBill[$billId] ?? [];
    if (empty($bill['last_payment_date']) && !empty($bill['fee_transactions'])) {
        $bill['last_payment_date'] = $bill['fee_transactions'][0]['payment_date'] ?? null;
    }
}
unset($bill);

jsonResponse($bills);
