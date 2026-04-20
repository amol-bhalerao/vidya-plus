<?php
require_once __DIR__ . '/db.php';

$table = $tableName ?? ($_GET['__table'] ?? null);
if (!$table) {
    http_response_code(400);
    jsonResponse(['error' => 'table not specified']);
}

$allowed = [
    'students',
    'courses',
    'classes',
    'subjects',
    'class_subjects',
    'exams',
    'exam_timetable',
    'exam_marks',
    'online_exams',
    'online_exam_question_bank',
    'online_exam_questions',
    'student_online_exams',
    'student_exam_answers',
    'fee_groups',
    'fee_group_items',
    'fee_types',
    'class_fees',
    'class_fee_groups',
    'fee_bills',
    'fee_transactions',
    'attendance',
    'admission_inquiries',
    'grade_settings',
    'general_ledger',
    'generated_documents',
    'module_settings',
    'syllabus',
    'seating_arrangement'
];

if (!in_array($table, $allowed, true)) {
    http_response_code(404);
    jsonResponse(['error' => 'table not allowed']);
}

if ($table === 'attendance') {
    // Backward-compatible schema guard for subject-wise attendance.
    try {
        $pdo->exec('ALTER TABLE attendance ADD COLUMN subject_id INT NULL AFTER class_id');
    } catch (Throwable $e) {
        // Column already exists or alter failed due to legacy constraints.
    }
}

function decodeJsonFields(array $row): array
{
    foreach (['contact_info', 'social_links', 'settings', 'previous_school_details', 'subjects', 'options', 'document_data', 'misc_fee_details', 'seat_layout'] as $field) {
        if (isset($row[$field]) && is_string($row[$field])) {
            $decoded = json_decode($row[$field], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $row[$field] = $decoded;
            }
        }
    }
    return $row;
}

function normalizeStudentPayload(array $data): array
{
    foreach (['gr_no', 'admission_no', 'abc_number', 'full_name', 'mother_name', 'birth_place', 'aadhaar_no', 'caste', 'category', 'religion', 'mother_tongue', 'status'] as $field) {
        if (array_key_exists($field, $data) && is_string($data[$field])) {
            $data[$field] = trim($data[$field]);
        }
    }

    if (!empty($data['admission_no'])) {
        $data['admission_no'] = strtoupper((string) $data['admission_no']);
    }

    foreach (['gr_no', 'abc_number'] as $field) {
        if (!empty($data[$field])) {
            $data[$field] = strtoupper((string) $data[$field]);
        }
    }

    if (isset($data['aadhaar_no']) && is_string($data['aadhaar_no'])) {
        $data['aadhaar_no'] = preg_replace('/\s+/', '', $data['aadhaar_no']);
    }

    foreach (['gr_no', 'abc_number', 'aadhaar_no', 'birth_place', 'caste', 'category', 'religion', 'mother_tongue'] as $field) {
        if (array_key_exists($field, $data) && $data[$field] === '') {
            $data[$field] = null;
        }
    }

    return $data;
}

function validateStudentDuplicate(PDO $pdo, array $data, $id = null): void
{
    $instituteId = isset($data['institute_id']) ? (int) $data['institute_id'] : 0;
    if ($instituteId <= 0) {
        return;
    }

    $currentId = ($id !== null && $id !== '') ? (int) $id : 0;
    $checks = [
        'admission_no' => 'Admission number',
        'gr_no' => 'GR number',
        'abc_number' => 'ABC number',
        'aadhaar_no' => 'Aadhaar number',
    ];

    foreach ($checks as $field => $label) {
        $value = $data[$field] ?? null;
        if ($value === null || $value === '') {
            continue;
        }

        $sql = "SELECT id, full_name FROM students WHERE institute_id = ? AND `{$field}` = ?";
        $params = [$instituteId, $value];

        if ($currentId > 0) {
            $sql .= ' AND id <> ?';
            $params[] = $currentId;
        }

        $sql .= ' LIMIT 1';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->fetch()) {
            http_response_code(409);
            jsonResponse(['error' => "{$label} already exists for another student."]);
        }
    }

    $fullName = trim((string) ($data['full_name'] ?? ''));
    $motherName = trim((string) ($data['mother_name'] ?? ''));
    $dateOfBirth = $data['date_of_birth'] ?? null;

    if ($fullName !== '' && $motherName !== '' && !empty($dateOfBirth)) {
        $sql = 'SELECT id, gr_no, admission_no FROM students WHERE institute_id = ? AND LOWER(TRIM(full_name)) = LOWER(TRIM(?)) AND LOWER(TRIM(COALESCE(mother_name, ""))) = LOWER(TRIM(?)) AND date_of_birth = ?';
        $params = [$instituteId, $fullName, $motherName, $dateOfBirth];

        if ($currentId > 0) {
            $sql .= ' AND id <> ?';
            $params[] = $currentId;
        }

        $sql .= ' LIMIT 1';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $existing = $stmt->fetch();

        if ($existing) {
            $existingRef = $existing['gr_no'] ?: $existing['admission_no'] ?: ('ID ' . $existing['id']);
            http_response_code(409);
            jsonResponse(['error' => 'A student with the same full name, mother name, and date of birth already exists (' . $existingRef . ').']);
        }
    }
}

function ensureStudentAccounting(PDO $pdo, int $studentId): void
{
    $studentStmt = $pdo->prepare(
        'SELECT s.id, s.institute_id, s.class_id, s.course_id, s.full_name, s.admission_date, s.status,
                c.class_name, c.section, co.course_name
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         LEFT JOIN courses co ON s.course_id = co.id
         WHERE s.id = ?
         LIMIT 1'
    );
    $studentStmt->execute([$studentId]);
    $student = $studentStmt->fetch();

    if (!$student || (string) ($student['status'] ?? '') !== 'active' || empty($student['class_id']) || empty($student['institute_id'])) {
        return;
    }

    $feeStmt = $pdo->prepare(
        'SELECT ft.fee_name, cf.amount
         FROM class_fees cf
         LEFT JOIN fee_types ft ON ft.id = cf.fee_type_id
         WHERE cf.class_id = ? AND cf.institute_id = ?
         ORDER BY ft.fee_name ASC'
    );
    $feeStmt->execute([(int) $student['class_id'], (int) $student['institute_id']]);
    $feeRows = $feeStmt->fetchAll();

    $classLabel = trim((string) ($student['course_name'] ?? 'Course') . ' - ' . (string) ($student['class_name'] ?? 'Class') . (!empty($student['section']) ? ' ' . $student['section'] : ''));
    $existingBillStmt = $pdo->prepare('SELECT id FROM fee_bills WHERE student_id = ? AND bill_name = ? LIMIT 1');
    $insertBillStmt = $pdo->prepare(
        'INSERT INTO fee_bills (student_id, institute_id, bill_name, due_date, total_amount, paid_amount, status, last_payment_date)
         VALUES (?, ?, ?, ?, ?, 0, "unpaid", NULL)'
    );

    foreach ($feeRows as $feeRow) {
        $feeName = trim((string) ($feeRow['fee_name'] ?? 'Fee'));
        $billName = $classLabel . ' - ' . $feeName;
        $existingBillStmt->execute([$studentId, $billName]);
        if ($existingBillStmt->fetch()) {
            continue;
        }

        $insertBillStmt->execute([
            $studentId,
            (int) $student['institute_id'],
            $billName,
            date('Y-m-d', strtotime(($student['admission_date'] ?: date('Y-m-d')) . ' +30 days')),
            (float) ($feeRow['amount'] ?? 0),
        ]);
    }

    $ledgerDescription = $student['full_name'] . ' admitted in ' . $classLabel . '. Required fee bills added to the student account.';
    $ledgerExistsStmt = $pdo->prepare(
        'SELECT id FROM general_ledger
         WHERE institute_id = ? AND transaction_type = ? AND reference_id = ? AND description = ?
         LIMIT 1'
    );
    $ledgerExistsStmt->execute([(int) $student['institute_id'], 'student_admission', $studentId, $ledgerDescription]);

    if (!$ledgerExistsStmt->fetch()) {
        $ledgerInsertStmt = $pdo->prepare(
            'INSERT INTO general_ledger (institute_id, transaction_date, account, description, debit, credit, transaction_type, reference_id)
             VALUES (?, ?, ?, ?, NULL, NULL, ?, ?)'
        );
        $ledgerInsertStmt->execute([
            (int) $student['institute_id'],
            $student['admission_date'] ?: date('Y-m-d'),
            'Admissions Register',
            $ledgerDescription,
            'student_admission',
            $studentId,
        ]);
    }
}

function buildWhere(array $params, array &$values, string $alias = '', array $searchColumns = []): string
{
    $reserved = ['__table', '__action', 'limit', 'offset', 'sort', 'order', 'order_by', 'order_direction', 'fields', 'select', 'search', 'range_from', 'range_to', 'include', 'expand'];
    $ops = [
        '_neq' => '!=',
        '_gte' => '>=',
        '_lte' => '<=',
        '_gt' => '>',
        '_lt' => '<',
    ];

    $prefix = $alias !== '' ? "`{$alias}`." : '';
    $conds = [];

    foreach ($params as $key => $value) {
        if (in_array($key, $reserved, true) || $value === '' || $value === null) {
            continue;
        }

        if ($key === 'month') {
            $conds[] = "DATE_FORMAT({$prefix}`date`, '%Y-%m') = ?";
            $values[] = $value;
            continue;
        }

        $column = $key;
        $operator = '=';

        foreach ($ops as $suffix => $sqlOperator) {
            if (str_ends_with($key, $suffix)) {
                $column = substr($key, 0, -strlen($suffix));
                $operator = $sqlOperator;
                break;
            }
        }

        $conds[] = "{$prefix}`{$column}` {$operator} ?";
        $values[] = $value;
    }

    if (!empty($params['search']) && !empty($searchColumns)) {
        $searchConds = [];
        foreach ($searchColumns as $column) {
            $searchConds[] = "{$prefix}`{$column}` LIKE ?";
            $values[] = '%' . $params['search'] . '%';
        }
        $conds[] = '(' . implode(' OR ', $searchConds) . ')';
    }

    return $conds ? ' WHERE ' . implode(' AND ', $conds) : '';
}

function getSortColumn(array $params, array $allowedColumns, string $default): string
{
    $requested = $params['sort'] ?? $params['order_by'] ?? $default;
    if (strpos((string) $requested, ',') !== false) {
        $requested = explode(',', (string) $requested)[0];
    }
    return in_array($requested, $allowedColumns, true) ? $requested : $default;
}

function saveRow(PDO $pdo, string $table, array $data, $id = null): array
{
    unset($data['created_at']);

    if ($id !== null && $id !== '') {
        unset($data['id']);
        $sets = [];
        $values = [];
        foreach ($data as $key => $value) {
            $sets[] = "`{$key}` = ?";
            $values[] = is_array($value) ? json_encode($value) : $value;
        }

        if (count($sets) === 0) {
            return ['ok' => true, 'id' => $id];
        }

        $values[] = $id;
        $sql = "UPDATE `{$table}` SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        return ['ok' => true, 'id' => $id];
    }

    $cols = [];
    $placeholders = [];
    $values = [];
    foreach ($data as $key => $value) {
        if ($key === 'id') {
            continue;
        }
        $cols[] = "`{$key}`";
        $placeholders[] = '?';
        $values[] = is_array($value) ? json_encode($value) : $value;
    }

    $sql = "INSERT INTO `{$table}` (" . implode(',', $cols) . ") VALUES (" . implode(',', $placeholders) . ')';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    return ['ok' => true, 'id' => $pdo->lastInsertId()];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $limit = isset($_GET['limit']) ? max(1, (int) $_GET['limit']) : null;
    $offset = isset($_GET['offset']) ? max(0, (int) $_GET['offset']) : 0;

    if ($limit === null && isset($_GET['range_from'], $_GET['range_to'])) {
        $from = max(0, (int) $_GET['range_from']);
        $to = max($from, (int) $_GET['range_to']);
        $offset = $from;
        $limit = ($to - $from) + 1;
    }

    if ($table === 'students') {
        $values = [];
        $where = buildWhere($_GET, $values, 's', ['full_name', 'admission_no', 'gr_no', 'mother_name', 'aadhaar_no']);
        $sortColumn = getSortColumn($_GET, ['id', 'full_name', 'admission_no', 'gr_no', 'admission_date', 'date_of_birth', 'status'], 'full_name');
        $sortDirection = strtolower((string) ($_GET['order'] ?? $_GET['order_direction'] ?? 'asc')) === 'desc' ? 'DESC' : 'ASC';

        $baseFrom = ' FROM `students` s LEFT JOIN `courses` c ON s.course_id = c.id LEFT JOIN `classes` cls ON s.class_id = cls.id LEFT JOIN `institutes` i ON s.institute_id = i.id';
        $countStmt = $pdo->prepare('SELECT COUNT(*)' . $baseFrom . $where);
        $countStmt->execute($values);
        $total = (int) $countStmt->fetchColumn();

        $sql = 'SELECT s.*, c.course_name, c.course_code, cls.class_name, cls.section, i.name AS institute_name, i.address AS institute_address, i.logo_url AS institute_logo, i.contact_info AS institute_contact_info' . $baseFrom . $where . " ORDER BY s.`{$sortColumn}` {$sortDirection}";
        $queryValues = $values;
        if ($limit !== null) {
            $sql .= ' LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($queryValues);

        if (isset($_GET['id'])) {
            $row = $stmt->fetch();
            if (!$row) {
                http_response_code(404);
                jsonResponse(['error' => 'record not found']);
            }
            $row = decodeJsonFields($row);
            $row['institutes'] = [
                'name' => $row['institute_name'] ?? null,
                'address' => $row['institute_address'] ?? null,
                'logo_url' => $row['institute_logo'] ?? null,
                'contact_info' => $row['institute_contact_info'] ?? null,
            ];
            $row['classes'] = [
                'id' => $row['class_id'] ?? null,
                'class_name' => $row['class_name'] ?? null,
                'section' => $row['section'] ?? null,
                'courses' => [
                    'id' => $row['course_id'] ?? null,
                    'course_name' => $row['course_name'] ?? null,
                    'course_code' => $row['course_code'] ?? null,
                ],
            ];
            jsonResponse($row);
        }

        $rows = $stmt->fetchAll();
        $rows = array_map(function ($row) {
            return decodeJsonFields($row);
        }, $rows);
        header('X-Total-Count: ' . $total);
        jsonResponse($rows);
    }

    if ($table === 'class_subjects') {
        $values = [];
        $where = buildWhere($_GET, $values, 'cs');
        $sql = 'SELECT s.id, s.institute_id, s.subject_name, s.subject_code, cs.class_id FROM `class_subjects` cs INNER JOIN `subjects` s ON cs.subject_id = s.id' . $where . ' ORDER BY s.subject_name ASC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        $rows = $stmt->fetchAll();
        header('X-Total-Count: ' . count($rows));
        jsonResponse(array_map('decodeJsonFields', $rows));
    }

    if ($table === 'exam_timetable') {
        $values = [];
        $where = buildWhere($_GET, $values, 'et');
        $sortColumn = getSortColumn($_GET, ['id', 'exam_date', 'start_time', 'max_marks', 'subject_id'], 'exam_date');
        $sortDirection = strtolower((string) ($_GET['order'] ?? $_GET['order_direction'] ?? 'asc')) === 'desc' ? 'DESC' : 'ASC';

        $baseFrom = ' FROM `exam_timetable` et LEFT JOIN `subjects` s ON et.subject_id = s.id LEFT JOIN `classes` cls ON et.class_id = cls.id LEFT JOIN `exams` e ON et.exam_id = e.id';
        $countStmt = $pdo->prepare('SELECT COUNT(*)' . $baseFrom . $where);
        $countStmt->execute($values);
        $total = (int) $countStmt->fetchColumn();

        $sql = 'SELECT et.*, s.subject_name, s.subject_code, cls.class_name, cls.section, e.name AS exam_name' . $baseFrom . $where . " ORDER BY et.`{$sortColumn}` {$sortDirection}";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        $rows = array_map(static function ($row) {
            $row = decodeJsonFields($row);
            $row['subjects'] = [
                'id' => $row['subject_id'] ?? null,
                'subject_name' => $row['subject_name'] ?? null,
                'subject_code' => $row['subject_code'] ?? null,
            ];
            $row['classes'] = [
                'id' => $row['class_id'] ?? null,
                'class_name' => $row['class_name'] ?? null,
                'section' => $row['section'] ?? null,
            ];
            $row['exam'] = [
                'id' => $row['exam_id'] ?? null,
                'name' => $row['exam_name'] ?? null,
            ];
            return $row;
        }, $stmt->fetchAll());

        header('X-Total-Count: ' . $total);
        jsonResponse($rows);
    }

    if ($table === 'admission_inquiries') {
        $values = [];
        $where = buildWhere($_GET, $values, 'ai', ['full_name', 'contact_phone', 'contact_email', 'notes']);
        $sortColumn = getSortColumn($_GET, ['id', 'created_at', 'inquiry_date', 'full_name', 'status'], 'inquiry_date');
        $sortDirection = strtolower((string) ($_GET['order'] ?? $_GET['order_direction'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

        $baseFrom = ' FROM `admission_inquiries` ai LEFT JOIN `courses` c ON ai.course_id = c.id LEFT JOIN `classes` cls ON ai.class_id = cls.id';
        $countStmt = $pdo->prepare('SELECT COUNT(*)' . $baseFrom . $where);
        $countStmt->execute($values);
        $total = (int) $countStmt->fetchColumn();

        $sql = 'SELECT ai.*, c.course_name, c.course_code, cls.class_name, cls.section' . $baseFrom . $where . " ORDER BY ai.`{$sortColumn}` {$sortDirection}";
        if ($limit !== null) {
            $sql .= ' LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        $rows = array_map(static function ($row) {
            $row = decodeJsonFields($row);
            $row['courses'] = [
                'id' => $row['course_id'] ?? null,
                'course_name' => $row['course_name'] ?? null,
                'course_code' => $row['course_code'] ?? null,
            ];
            $row['classes'] = [
                'id' => $row['class_id'] ?? null,
                'class_name' => $row['class_name'] ?? null,
                'section' => $row['section'] ?? null,
            ];
            return $row;
        }, $stmt->fetchAll());

        header('X-Total-Count: ' . $total);
        jsonResponse($rows);
    }

    if ($table === 'fee_transactions') {
        $values = [];
        $where = buildWhere($_GET, $values, 'ft', ['payment_mode']);
        $sortColumn = getSortColumn($_GET, ['id', 'created_at', 'payment_date', 'amount_paid'], 'created_at');
        $sortDirection = strtolower((string) ($_GET['order'] ?? $_GET['order_direction'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

        $baseFrom = ' FROM `fee_transactions` ft LEFT JOIN `students` s ON ft.student_id = s.id LEFT JOIN `fee_bills` fb ON ft.fee_bill_id = fb.id';
        $countStmt = $pdo->prepare('SELECT COUNT(*)' . $baseFrom . $where);
        $countStmt->execute($values);
        $total = (int) $countStmt->fetchColumn();

        $sql = 'SELECT ft.*, s.full_name AS student_full_name, s.gr_no AS student_gr_no, s.admission_no AS student_admission_no, fb.bill_name AS fee_bill_name, fb.total_amount AS fee_bill_total_amount, fb.status AS fee_bill_status' . $baseFrom . $where . " ORDER BY ft.`{$sortColumn}` {$sortDirection}";
        if ($limit !== null) {
            $sql .= ' LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        $rows = array_map(static function ($row) {
            $row = decodeJsonFields($row);
            $row['students'] = [
                'id' => $row['student_id'] ?? null,
                'full_name' => $row['student_full_name'] ?? null,
                'gr_no' => $row['student_gr_no'] ?? null,
                'admission_no' => $row['student_admission_no'] ?? null,
            ];
            $row['fee_bills'] = [
                'id' => $row['fee_bill_id'] ?? null,
                'bill_name' => $row['fee_bill_name'] ?? null,
                'total_amount' => $row['fee_bill_total_amount'] ?? null,
                'status' => $row['fee_bill_status'] ?? null,
            ];
            return $row;
        }, $stmt->fetchAll());

        header('X-Total-Count: ' . $total);
        jsonResponse($rows);
    }

    $values = [];
    $searchColumnsByTable = [
        'courses' => ['course_name', 'course_code'],
        'classes' => ['class_name', 'section'],
        'subjects' => ['subject_name', 'subject_code'],
        'attendance' => ['status'],
        'admission_inquiries' => ['full_name', 'contact_phone', 'contact_email', 'notes'],
        'general_ledger' => ['account', 'description', 'transaction_type'],
        'generated_documents' => ['document_type', 'sequence_number'],
    ];
    $where = buildWhere($_GET, $values, '', $searchColumnsByTable[$table] ?? []);
    $sortColumn = getSortColumn($_GET, ['id', 'created_at', 'updated_at', 'name', 'class_name', 'course_name', 'subject_name', 'transaction_date', 'date', 'exam_date'], 'id');
    $sortDirection = strtolower((string) ($_GET['order'] ?? $_GET['order_direction'] ?? 'asc')) === 'desc' ? 'DESC' : 'ASC';

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM `{$table}`" . $where);
    $countStmt->execute($values);
    $total = (int) $countStmt->fetchColumn();

    $sql = "SELECT * FROM `{$table}`" . $where . " ORDER BY `{$sortColumn}` {$sortDirection}";
    $queryValues = $values;
    if ($limit !== null) {
        $sql .= ' LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($queryValues);

    if (isset($_GET['id'])) {
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            jsonResponse(['error' => 'record not found']);
        }
        jsonResponse(decodeJsonFields($row));
    }

    $rows = array_map('decodeJsonFields', $stmt->fetchAll());
    header('X-Total-Count: ' . $total);
    jsonResponse($rows);
}

if ($method === 'POST' || $method === 'PUT') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    if (($_GET['__action'] ?? '') === 'batch') {
        $items = array_is_list($payload) ? $payload : ($payload['items'] ?? $payload['records'] ?? []);
        if (!is_array($items) || count($items) === 0) {
            http_response_code(400);
            jsonResponse(['error' => 'batch payload required']);
        }

        $results = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            if ($table === 'students') {
                $item = normalizeStudentPayload($item);
                validateStudentDuplicate($pdo, $item, $item['id'] ?? null);
            }

            if ($table === 'exam_marks' && isset($item['timetable_id'], $item['student_id'])) {
                $existing = $pdo->prepare('SELECT id FROM exam_marks WHERE timetable_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1');
                $existing->execute([$item['timetable_id'], $item['student_id']]);
                $found = $existing->fetch();
                if ($found) {
                    $item['id'] = $found['id'];
                }
            }

            $id = $item['id'] ?? null;
            $result = saveRow($pdo, $table, $item, $id);
            if ($table === 'students' && !empty($result['id'])) {
                ensureStudentAccounting($pdo, (int) $result['id']);
            }
            $results[] = $result;
        }

        jsonResponse(['ok' => true, 'count' => count($results), 'results' => $results]);
    }

    if (!$payload) {
        http_response_code(400);
        jsonResponse(['error' => 'no payload']);
    }

    if ($table === 'students') {
        $payload = normalizeStudentPayload($payload);
    }

    if ($table === 'exam_marks' && isset($payload['timetable_id'], $payload['student_id'])) {
        $existing = $pdo->prepare('SELECT id FROM exam_marks WHERE timetable_id = ? AND student_id = ? LIMIT 1');
        $existing->execute([$payload['timetable_id'], $payload['student_id']]);
        $found = $existing->fetch();
        if ($found) {
            $payload['id'] = $found['id'];
        }
    }

    $id = $payload['id'] ?? ($_GET['id'] ?? null);

    if ($table === 'students') {
        validateStudentDuplicate($pdo, $payload, $id);
    }

    $result = saveRow($pdo, $table, $payload, $id);
    if ($table === 'students' && !empty($result['id'])) {
        ensureStudentAccounting($pdo, (int) $result['id']);
    }
    jsonResponse($result);
}

if ($method === 'DELETE') {
    $raw = file_get_contents('php://input');
    $payload = [];
    if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
        $payload = json_decode($raw, true) ?? [];
    } else {
        parse_str($raw, $payload);
    }

    $id = $payload['id'] ?? ($_GET['id'] ?? null);
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM `{$table}` WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['ok' => true]);
    }

    if (!empty($payload)) {
        $values = [];
        $where = buildWhere($payload, $values);
        if ($where !== '') {
            $stmt = $pdo->prepare("DELETE FROM `{$table}`" . $where);
            $stmt->execute($values);
            jsonResponse(['ok' => true]);
        }
    }

    http_response_code(400);
    jsonResponse(['error' => 'id or match required']);
}

http_response_code(405);
jsonResponse(['error' => 'Method not allowed']);
