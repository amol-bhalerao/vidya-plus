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

// Handle institute routes with pattern matching
if (preg_match('/^institutes(\/.*)?$/', $path)) {
    require __DIR__ . '/institutes.php';
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
