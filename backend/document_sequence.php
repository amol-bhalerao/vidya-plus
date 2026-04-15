<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    jsonResponse(['error' => 'Method not allowed']);
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$instituteId = $data['institute_id'] ?? null;
$documentType = $data['document_type'] ?? 'document';
$usePrefix = !isset($data['use_prefix']) || (bool) $data['use_prefix'];

if (!$instituteId) {
    http_response_code(400);
    jsonResponse(['error' => 'institute_id is required']);
}

$prefixMap = [
    'transfer_certificate' => 'TC',
    'bonafide_certificate' => 'BON',
    'character_certificate' => 'CHAR',
    'form_15a' => '15A',
    'marksheet' => 'MRK',
];

$stmt = $pdo->prepare('SELECT COUNT(*) FROM generated_documents WHERE institute_id = ? AND document_type = ?');
$stmt->execute([$instituteId, $documentType]);
$sequence = ((int) $stmt->fetchColumn()) + 1;

$prefix = $prefixMap[$documentType] ?? strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $documentType), 0, 4));
$number = str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
$sequenceNumber = $usePrefix ? sprintf('%s-%s-%s', $prefix, date('Y'), $number) : $number;

jsonResponse([
    'sequence' => $sequence,
    'sequence_number' => $sequenceNumber,
]);
