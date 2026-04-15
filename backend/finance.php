<?php
require_once __DIR__ . '/db.php';

$segments = explode('/', trim($path ?? '', '/'));
$action = $segments[1] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

function financePayload(): array
{
    $decoded = json_decode(file_get_contents('php://input'), true);
    return is_array($decoded) ? $decoded : [];
}

if ($action === 'fee-types' && $method === 'GET') {
    $instituteId = (int) ($_GET['institute_id'] ?? 0);
    if ($instituteId <= 0) {
        http_response_code(400);
        jsonResponse(['error' => 'institute_id is required']);
    }

    $stmt = $pdo->prepare('SELECT * FROM fee_types WHERE institute_id = ? ORDER BY fee_name ASC');
    $stmt->execute([$instituteId]);
    jsonResponse($stmt->fetchAll());
}

if ($action === 'student-fee-details' && $method === 'POST') {
    $payload = financePayload();
    $studentId = (int) ($payload['student_id'] ?? 0);
    $feeTypeId = (int) ($payload['fee_type_id'] ?? 0);

    if ($studentId <= 0 || $feeTypeId <= 0) {
        http_response_code(400);
        jsonResponse(['error' => 'student_id and fee_type_id are required']);
    }

    $stmt = $pdo->prepare(
        'SELECT s.class_id, cf.amount AS class_fee_amount
         FROM students s
         LEFT JOIN class_fees cf ON cf.class_id = s.class_id AND cf.fee_type_id = ?
         WHERE s.id = ?
         LIMIT 1'
    );
    $stmt->execute([$feeTypeId, $studentId]);
    $row = $stmt->fetch();

    if (!$row || empty($row['class_id'])) {
        http_response_code(404);
        jsonResponse(['error' => 'Student or class not found']);
    }

    if ($row['class_fee_amount'] === null) {
        http_response_code(404);
        jsonResponse(['error' => 'No class fee configured for this fee type']);
    }

    jsonResponse([
        'student_id' => $studentId,
        'fee_type_id' => $feeTypeId,
        'class_fee_amount' => (float) $row['class_fee_amount'],
    ]);
}

if ($action === 'fee-transactions' && $method === 'POST') {
    $payload = financePayload();
    $studentId = (int) ($payload['student_id'] ?? 0);
    $instituteId = (int) ($payload['institute_id'] ?? 0);
    $feeBillId = (int) ($payload['fee_bill_id'] ?? 0);
    $amountPaid = (float) ($payload['amount_paid'] ?? 0);
    $discountAmount = (float) ($payload['discount_amount'] ?? 0);
    $paymentMode = trim((string) ($payload['payment_mode'] ?? 'cash'));
    $paymentDate = substr((string) ($payload['payment_date'] ?? date('Y-m-d')), 0, 10);
    $collectedBy = !empty($payload['collected_by']) ? (int) $payload['collected_by'] : null;
    $transactionDetails = isset($payload['transaction_details']) ? json_encode($payload['transaction_details']) : null;

    if ($studentId <= 0 || $instituteId <= 0 || $feeBillId <= 0 || $amountPaid <= 0) {
        http_response_code(400);
        jsonResponse(['error' => 'Valid student, bill, institute, and amount are required']);
    }

    $billStmt = $pdo->prepare('SELECT id, total_amount, paid_amount FROM fee_bills WHERE id = ? AND student_id = ? AND institute_id = ? LIMIT 1');
    $billStmt->execute([$feeBillId, $studentId, $instituteId]);
    $bill = $billStmt->fetch();

    if (!$bill) {
        http_response_code(404);
        jsonResponse(['error' => 'Fee bill not found']);
    }

    $currentPaid = (float) $bill['paid_amount'];
    $totalAmount = (float) $bill['total_amount'];
    $balance = max($totalAmount - $currentPaid, 0);
    if ($amountPaid > $balance) {
        http_response_code(400);
        jsonResponse(['error' => 'Amount exceeds outstanding balance']);
    }

    $pdo->beginTransaction();
    try {
        $insertTransaction = $pdo->prepare(
            'INSERT INTO fee_transactions (
                student_id, institute_id, fee_bill_id, amount_paid, discount_amount,
                payment_mode, transaction_details, payment_date, collected_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $insertTransaction->execute([
            $studentId,
            $instituteId,
            $feeBillId,
            $amountPaid,
            $discountAmount,
            $paymentMode,
            $transactionDetails,
            $paymentDate,
            $collectedBy,
        ]);
        $transactionId = (int) $pdo->lastInsertId();

        $newPaidAmount = $currentPaid + $amountPaid;
        $newStatus = $newPaidAmount >= $totalAmount ? 'paid' : ($newPaidAmount > 0 ? 'partially_paid' : 'unpaid');

        $updateBill = $pdo->prepare('UPDATE fee_bills SET paid_amount = ?, last_payment_date = ?, status = ? WHERE id = ?');
        $updateBill->execute([$newPaidAmount, $paymentDate, $newStatus, $feeBillId]);

        $pdo->commit();
        jsonResponse([
            'ok' => true,
            'id' => $transactionId,
            'transaction_id' => $transactionId,
            'status' => $newStatus,
            'paid_amount' => $newPaidAmount,
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        jsonResponse(['error' => 'Failed to save fee transaction', 'details' => $e->getMessage()]);
    }
}

if ($action === 'collect-misc-fee' && $method === 'POST') {
    $payload = financePayload();
    $studentId = (int) ($payload['student_id'] ?? 0);
    $instituteId = (int) ($payload['institute_id'] ?? 0);
    $feeTypeId = (int) ($payload['fee_type_id'] ?? 0);
    $amountPaid = (float) ($payload['amount_paid'] ?? 0);
    $paymentMode = trim((string) ($payload['payment_mode'] ?? 'cash'));
    $paymentDate = date('Y-m-d');
    $collectedBy = !empty($payload['collected_by']) ? (int) $payload['collected_by'] : null;
    $transactionDetails = $payload['transaction_details'] ?? null;

    if ($studentId <= 0 || $instituteId <= 0 || $feeTypeId <= 0 || $amountPaid <= 0) {
        http_response_code(400);
        jsonResponse(['error' => 'Valid student, fee type, institute, and amount are required']);
    }

    $feeTypeStmt = $pdo->prepare('SELECT fee_name FROM fee_types WHERE id = ? AND institute_id = ? LIMIT 1');
    $feeTypeStmt->execute([$feeTypeId, $instituteId]);
    $feeType = $feeTypeStmt->fetch();
    if (!$feeType) {
        http_response_code(404);
        jsonResponse(['error' => 'Fee type not found']);
    }

    $pdo->beginTransaction();
    try {
        $billName = $feeType['fee_name'] . ' - One Time Fee';
        $miscFeeDetails = json_encode([
            'fee_type_id' => $feeTypeId,
            'description' => $billName,
            'transaction_details' => $transactionDetails,
        ]);

        $insertBill = $pdo->prepare(
            'INSERT INTO fee_bills (student_id, institute_id, bill_name, due_date, total_amount, paid_amount, status, last_payment_date, misc_fee_details)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $insertBill->execute([
            $studentId,
            $instituteId,
            $billName,
            $paymentDate,
            $amountPaid,
            $amountPaid,
            'paid',
            $paymentDate,
            $miscFeeDetails,
        ]);
        $billId = (int) $pdo->lastInsertId();

        $insertTransaction = $pdo->prepare(
            'INSERT INTO fee_transactions (student_id, institute_id, fee_bill_id, amount_paid, discount_amount, payment_mode, transaction_details, payment_date, collected_by)
             VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)'
        );
        $insertTransaction->execute([
            $studentId,
            $instituteId,
            $billId,
            $amountPaid,
            $paymentMode,
            json_encode($transactionDetails),
            $paymentDate,
            $collectedBy,
        ]);

        $transactionId = (int) $pdo->lastInsertId();
        $pdo->commit();

        jsonResponse([
            'ok' => true,
            'bill_id' => $billId,
            'transaction_id' => $transactionId,
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        jsonResponse(['error' => 'Failed to collect one-time fee', 'details' => $e->getMessage()]);
    }
}

http_response_code(404);
jsonResponse(['error' => 'Finance route not found']);
