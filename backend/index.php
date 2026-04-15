<?php
// Simple router for AJAX requests from the frontend.
require_once __DIR__ . '/db.php';

$path = $_SERVER['REQUEST_URI'];
$scriptName = dirname($_SERVER['SCRIPT_NAME']);
// Normalize path
if (strpos($path, $scriptName) === 0) {
    $path = substr($path, strlen($scriptName));
}
$path = strtok($path, '?');
$path = trim($path, '/');

$crudTables = [
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

$crudPath = strpos($path, 'crud/') === 0 ? substr($path, 5) : $path;
$crudSegments = $crudPath === '' ? [] : explode('/', $crudPath);
$tableCandidate = !empty($crudSegments) ? str_replace('-', '_', $crudSegments[0]) : '';

if ($tableCandidate === 'institutes') {
    require __DIR__ . '/institutes.php';
    exit;
}

if ($tableCandidate === 'roles') {
    require __DIR__ . '/roles.php';
    exit;
}

if ($tableCandidate === 'employees') {
    require __DIR__ . '/employees.php';
    exit;
}

if ($tableCandidate === 'fee_receipts') {
    if (count($crudSegments) >= 2 && is_numeric($crudSegments[1])) {
        $_GET['transaction_id'] = $_GET['transaction_id'] ?? $crudSegments[1];
    }
    require __DIR__ . '/fee_receipts.php';
    exit;
}

if ($tableCandidate && in_array($tableCandidate, $crudTables, true)) {
    $tableName = $tableCandidate;

    if (count($crudSegments) === 2 && is_numeric($crudSegments[1])) {
        $_GET['id'] = $_GET['id'] ?? $crudSegments[1];
    } elseif (count($crudSegments) > 1) {
        $filterKeyMap = [
            'class' => 'class_id',
            'student' => 'student_id',
            'exam' => 'exam_id',
            'subject' => 'subject_id',
            'institute' => 'institute_id',
        ];

        for ($i = 1; $i < count($crudSegments); $i++) {
            $rawKey = str_replace('-', '_', $crudSegments[$i]);
            $value = $crudSegments[$i + 1] ?? null;

            if ($value === null) {
                $_GET['__action'] = $_GET['__action'] ?? $rawKey;
                break;
            }

            $key = $filterKeyMap[$rawKey] ?? $rawKey;
            $_GET[$key] = $_GET[$key] ?? $value;
            $i++;
        }
    }

    require __DIR__ . '/crud.php';
    exit;
}

// Handle institute routes with pattern matching
if (preg_match('/^institutes(\/.*)?$/', $path)) {
    require __DIR__ . '/institutes.php';
    exit;
}

if ($path === 'student-fee-bills') {
    require __DIR__ . '/student_fee_bills.php';
    exit;
}

if ($path === 'student-transactions') {
    require __DIR__ . '/student_transactions.php';
    exit;
}

if ($path === 'student-report-card') {
    require __DIR__ . '/student_report_card.php';
    exit;
}

if (strpos($path, 'finance/') === 0) {
    require __DIR__ . '/finance.php';
    exit;
}

switch ($path) {
    case 'auth/login':
        require __DIR__ . '/auth.php';
        break;
    case 'auth/logout':
        require __DIR__ . '/auth.php';
        break;
    case 'auth/session':
        require __DIR__ . '/auth.php';
        break;
    case 'auth/set-institute':
        require __DIR__ . '/auth.php';
        break;
    case 'website/content':
        require __DIR__ . '/website_content.php';
        break;
    case 'website/team':
        require __DIR__ . '/team.php';
        break;
    case 'website/gallery':
        require __DIR__ . '/gallery.php';
        break;
    case 'website/documents':
        require __DIR__ . '/documents.php';
        break;
    case 'website/events':
        require __DIR__ . '/events.php';
        break;
    case 'website/carousel':
        require __DIR__ . '/carousel.php';
        break;
    case 'roles':
        require __DIR__ . '/roles.php';
        break;
    case 'employees':
        require __DIR__ . '/employees.php';
        break;
    case 'uploads':
        require __DIR__ . '/uploads.php';
        break;
    case 'document-sequence':
        require __DIR__ . '/document_sequence.php';
        break;
    case 'student-details':
    case 'student_admission_details':
        require __DIR__ . '/student_details.php';
        break;
    case 'promote_student':
        require __DIR__ . '/promote_student.php';
        break;
    case 'upload-institute-logo':
        require __DIR__ . '/upload_institute_logo.php';
        break;
    // Generic CRUD-backed tables
    case 'students':
    case 'courses':
    case 'classes':
    case 'subjects':
    case 'class_subjects':
    case 'exams':
    case 'exam_timetable':
    case 'exam_marks':
    case 'online_exams':
    case 'online_exam_question_bank':
    case 'online_exam_questions':
    case 'student_online_exams':
    case 'student_exam_answers':
    case 'fee_groups':
    case 'fee_group_items':
    case 'fee_types':
    case 'class_fees':
    case 'class_fee_groups':
    case 'fee_bills':
    case 'fee_transactions':
    case 'attendance':
    case 'admission_inquiries':
    case 'grade_settings':
    case 'general_ledger':
    case 'generated_documents':
    case 'module_settings':
        $tableName = $path;
        require __DIR__ . '/crud.php';
        break;
    default:
        // support serving uploaded assets via /backend/institute-assets/<path>
        if (strpos($path, 'institute-assets/') === 0) {
            // Extract path after 'institute-assets/' and pass as GET param p
            $_GET['p'] = substr($path, strlen('institute-assets/'));
            require __DIR__ . '/institute-assets.php';
            break;
        }
        http_response_code(404);
        echo json_encode(['error' => 'Not Found']);
}
