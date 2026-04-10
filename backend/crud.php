<?php
require_once __DIR__ . '/db.php';

// Generic CRUD handler. Expects $tableName to be set by the router (index.php).
$table = $tableName ?? null;
// Fallback: allow direct calls like /backend/crud.php?__table=students
if (!$table && isset($_GET['__table'])) {
    $table = $_GET['__table'];
}
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

if (!in_array($table, $allowed)) {
    http_response_code(404);
    jsonResponse(['error' => 'table not allowed']);
}

function buildWhere($params, &$values)
{
    $conds = [];
    foreach ($params as $k => $v) {
        if ($k === '__table')
            continue;
        $conds[] = "`$k` = ?";
        $values[] = $v;
    }
    return $conds ? ' WHERE ' . implode(' AND ', $conds) : '';
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Simple GET with query params as filters
    $values = [];
    $where = buildWhere($_GET, $values);
    $sql = "SELECT * FROM `$table`" . $where;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    $rows = $stmt->fetchAll();
    jsonResponse($rows);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    if (!$data) {
        jsonResponse(['error' => 'no payload']);
    }
    // If id provided -> update
    if (!empty($data['id'])) {
        $id = $data['id'];
        unset($data['id']);
        $sets = [];
        $vals = [];
        foreach ($data as $k => $v) {
            $sets[] = "`$k` = ?";
            $vals[] = $v;
        }
        if (count($sets) === 0)
            jsonResponse(['ok' => true]);
        $vals[] = $id;
        $sql = "UPDATE `$table` SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($vals);
        jsonResponse(['ok' => true, 'id' => $id]);
    }

    // Special-case upsert for exam_marks (timetable_id + student_id)
    if ($table === 'exam_marks' && isset($data['timetable_id']) && isset($data['student_id'])) {
        $stmt = $pdo->prepare('SELECT id FROM exam_marks WHERE timetable_id = ? AND student_id = ? LIMIT 1');
        $stmt->execute([$data['timetable_id'], $data['student_id']]);
        $found = $stmt->fetch();
        if ($found) {
            $id = $found['id'];
            unset($data['id']);
            $sets = [];
            $vals = [];
            foreach ($data as $k => $v) {
                $sets[] = "`$k` = ?";
                $vals[] = $v;
            }
            $vals[] = $id;
            $sql = "UPDATE `$table` SET " . implode(', ', $sets) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($vals);
            jsonResponse(['ok' => true, 'id' => $id]);
        }
    }

    // Otherwise insert
    $cols = array_keys($data);
    $placeholders = implode(',', array_fill(0, count($cols), '?'));
    $sql = "INSERT INTO `$table` (`" . implode('`,`', $cols) . "`) VALUES ($placeholders)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_values($data));
    $id = $pdo->lastInsertId();
    jsonResponse(['ok' => true, 'id' => $id]);
}

if ($method === 'DELETE') {
    // Accept body as form-encoded or JSON
    $raw = file_get_contents('php://input');
    $d = [];
    if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
        $d = json_decode($raw, true) ?? [];
    } else {
        parse_str($raw, $d);
    }
    if (!empty($d['id'])) {
        $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id = ?");
        $stmt->execute([$d['id']]);
        jsonResponse(['ok' => true]);
    }
    // match deletion: all provided keys used as WHERE
    if (count($d)) {
        $vals = [];
        $where = buildWhere($d, $vals);
        $sql = "DELETE FROM `$table`" . $where;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($vals);
        jsonResponse(['ok' => true]);
    }
    http_response_code(400);
    jsonResponse(['error' => 'id or match required']);
}

http_response_code(405);
jsonResponse(['error' => 'Method not allowed']);
