<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    jsonResponse(['error' => 'Method not allowed']);
}

$payload = json_decode(file_get_contents('php://input'), true) ?? [];
$studentId = (int) ($payload['student_id'] ?? 0);
$examId = (int) ($payload['exam_id'] ?? 0);

if ($studentId <= 0 || $examId <= 0) {
    http_response_code(400);
    jsonResponse(['error' => 'student_id and exam_id are required']);
}

function resolveGrade(array $gradeSettings, float $percentage): string
{
    foreach ($gradeSettings as $grade) {
        $min = (float) ($grade['min_percentage'] ?? 0);
        $max = (float) ($grade['max_percentage'] ?? 0);
        if ($percentage >= $min && $percentage <= $max) {
            return (string) $grade['grade_name'];
        }
    }
    return $percentage >= 40 ? 'PASS' : 'FAIL';
}

function gradePoint(string $grade): float
{
    return match (strtoupper(trim($grade))) {
        'O' => 10.0,
        'A+' => 9.0,
        'A' => 8.0,
        'B+' => 7.0,
        'B' => 6.0,
        'C' => 5.0,
        default => 0.0,
    };
}

function classAward(float $percentage): string
{
    if ($percentage >= 70) {
        return 'Distinction';
    }
    if ($percentage >= 60) {
        return 'First Class';
    }
    if ($percentage >= 50) {
        return 'Second Class';
    }
    if ($percentage >= 40) {
        return 'Pass Class';
    }
    return 'Fail';
}

function classLabels(string $className): array
{
    $className = strtoupper($className);
    if (str_contains($className, 'FY')) {
        return ['First Year', 'Semester I'];
    }
    if (str_contains($className, 'SY')) {
        return ['Second Year', 'Semester III'];
    }
    if (str_contains($className, 'TY')) {
        return ['Third Year', 'Semester V'];
    }
    return ['BCA', 'Semester'];
}

function defaultPatternMeta(string $subjectName): array
{
    $isPractical = preg_match('/lab|project|viva/i', $subjectName) === 1;
    return [
        'paper_type' => $isPractical ? 'Practical/Viva' : 'Theory',
        'credits' => $isPractical ? 2 : 4,
        'internal_max' => $isPractical ? 40 : 20,
        'external_max' => $isPractical ? 60 : 80,
        'component_label' => $isPractical ? 'Practical + Viva' : 'CIA + ESE',
    ];
}

$studentStmt = $pdo->prepare(
    'SELECT s.*, cls.class_name, cls.section, c.course_name,
            i.name AS institute_name, i.logo_url AS institute_logo
     FROM students s
     LEFT JOIN classes cls ON s.class_id = cls.id
     LEFT JOIN courses c ON s.course_id = c.id
     LEFT JOIN institutes i ON s.institute_id = i.id
     WHERE s.id = ?
     LIMIT 1'
);
$studentStmt->execute([$studentId]);
$student = $studentStmt->fetch();

if (!$student) {
    http_response_code(404);
    jsonResponse(['error' => 'Student not found']);
}

$examStmt = $pdo->prepare('SELECT id, name, description FROM exams WHERE id = ? LIMIT 1');
$examStmt->execute([$examId]);
$exam = $examStmt->fetch();
if (!$exam) {
    http_response_code(404);
    jsonResponse(['error' => 'Exam not found']);
}

$academicYearStmt = $pdo->prepare('SELECT year_name FROM academic_years WHERE institute_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1');
$academicYearStmt->execute([(int) $student['institute_id']]);
$academicYear = $academicYearStmt->fetchColumn() ?: date('Y') . '-' . (date('Y') + 1);

$gradeStmt = $pdo->prepare('SELECT grade_name, min_percentage, max_percentage FROM grade_settings WHERE institute_id = ? ORDER BY max_percentage DESC');
$gradeStmt->execute([(int) $student['institute_id']]);
$gradeSettings = $gradeStmt->fetchAll();

if (!$gradeSettings) {
    $gradeSettings = [
        ['grade_name' => 'O', 'min_percentage' => 90, 'max_percentage' => 100],
        ['grade_name' => 'A+', 'min_percentage' => 80, 'max_percentage' => 89.99],
        ['grade_name' => 'A', 'min_percentage' => 70, 'max_percentage' => 79.99],
        ['grade_name' => 'B+', 'min_percentage' => 60, 'max_percentage' => 69.99],
        ['grade_name' => 'B', 'min_percentage' => 50, 'max_percentage' => 59.99],
        ['grade_name' => 'C', 'min_percentage' => 40, 'max_percentage' => 49.99],
        ['grade_name' => 'F', 'min_percentage' => 0, 'max_percentage' => 39.99],
    ];
}

$resultStmt = $pdo->prepare(
    'SELECT et.id AS timetable_id, et.max_marks, et.subjects AS subject_meta,
            s.id AS subject_id, s.subject_name, s.subject_code,
            em.marks_obtained, em.is_absent
     FROM exam_timetable et
     INNER JOIN subjects s ON et.subject_id = s.id
     LEFT JOIN exam_marks em ON em.id = (
         SELECT em2.id
         FROM exam_marks em2
         WHERE em2.timetable_id = et.id AND em2.student_id = ?
         ORDER BY em2.id DESC
         LIMIT 1
     )
     WHERE et.exam_id = ? AND et.class_id = ?
     ORDER BY s.subject_code ASC, s.subject_name ASC'
);
$resultStmt->execute([$studentId, $examId, (int) $student['class_id']]);
$rows = $resultStmt->fetchAll();

if (!$rows) {
    http_response_code(404);
    jsonResponse(['error' => 'No exam timetable or marks found for this student and exam']);
}

$selectedExamIsSemester = stripos((string) $exam['name'], 'semester') !== false || stripos((string) $exam['name'], 'end') !== false;
$internalRowStmt = $pdo->prepare(
    'SELECT et.id AS timetable_id, et.max_marks, et.subjects AS subject_meta,
            em.marks_obtained, em.is_absent
     FROM exam_timetable et
     INNER JOIN exams e ON e.id = et.exam_id
     LEFT JOIN exam_marks em ON em.id = (
         SELECT em2.id
         FROM exam_marks em2
         WHERE em2.timetable_id = et.id AND em2.student_id = ?
         ORDER BY em2.id DESC
         LIMIT 1
     )
     WHERE et.class_id = ? AND et.subject_id = ? AND et.exam_id <> ?
       AND (e.name LIKE ? OR e.description LIKE ?)
     ORDER BY et.id DESC
     LIMIT 1'
);

$totalObtained = 0.0;
$totalMax = 0.0;
$totalCredits = 0.0;
$earnedCredits = 0.0;
$gradeWeightedTotal = 0.0;
$failedSubjects = 0;
$results = [];

foreach ($rows as $row) {
    $decodedMeta = [];
    if (!empty($row['subject_meta']) && is_string($row['subject_meta'])) {
        $decodedMeta = json_decode($row['subject_meta'], true);
        if (!is_array($decodedMeta)) {
            $decodedMeta = [];
        }
    }

    $patternMeta = array_merge(defaultPatternMeta((string) $row['subject_name']), $decodedMeta);
    $credits = (float) ($patternMeta['credits'] ?? 0);
    $internalMax = (float) ($patternMeta['internal_max'] ?? 0);
    $externalMax = $selectedExamIsSemester ? (float) ($patternMeta['external_max'] ?? ($row['max_marks'] ?? 0)) : 0.0;
    $internalMarks = null;
    $externalMarks = null;
    $subjectAbsent = false;

    if ($selectedExamIsSemester) {
        $externalMarks = !empty($row['is_absent']) ? null : ($row['marks_obtained'] !== null ? (float) $row['marks_obtained'] : 0.0);
        $subjectAbsent = !empty($row['is_absent']);

        $internalRowStmt->execute([
            $studentId,
            (int) $student['class_id'],
            (int) $row['subject_id'],
            $examId,
            '%Internal Assessment%',
            '%internal assessment%',
        ]);
        $internalRow = $internalRowStmt->fetch();

        if ($internalRow) {
            $internalMeta = [];
            if (!empty($internalRow['subject_meta']) && is_string($internalRow['subject_meta'])) {
                $internalMeta = json_decode($internalRow['subject_meta'], true);
                if (!is_array($internalMeta)) {
                    $internalMeta = [];
                }
            }
            $patternMeta = array_merge($patternMeta, $internalMeta);
            $internalMax = (float) ($patternMeta['internal_max'] ?? ($internalRow['max_marks'] ?? $internalMax));
            $internalMarks = !empty($internalRow['is_absent']) ? null : ($internalRow['marks_obtained'] !== null ? (float) $internalRow['marks_obtained'] : 0.0);
            $subjectAbsent = $subjectAbsent || !empty($internalRow['is_absent']);
        } else {
            $internalMarks = 0.0;
        }
    } else {
        $internalMax = (float) ($row['max_marks'] ?? $internalMax);
        $internalMarks = !empty($row['is_absent']) ? null : ($row['marks_obtained'] !== null ? (float) $row['marks_obtained'] : 0.0);
        $subjectAbsent = !empty($row['is_absent']);
    }

    $obtained = $subjectAbsent
        ? 0.0
        : (float) ($internalMarks ?? 0) + (float) ($externalMarks ?? 0);
    $maxMarks = $selectedExamIsSemester ? ($internalMax + $externalMax) : $internalMax;
    $percentage = $maxMarks > 0 ? (($obtained / $maxMarks) * 100) : 0.0;
    $grade = $subjectAbsent ? 'AB' : resolveGrade($gradeSettings, $percentage);
    $resultStatus = (!$subjectAbsent && $percentage >= 40) ? 'PASS' : 'ATKT';

    $totalObtained += $obtained;
    $totalMax += $maxMarks;
    $totalCredits += $credits;
    $gradeWeightedTotal += gradePoint($grade) * $credits;

    if ($resultStatus === 'PASS') {
        $earnedCredits += $credits;
    } else {
        $failedSubjects++;
    }

    $results[] = [
        'timetable_id' => (int) $row['timetable_id'],
        'subject_id' => (int) $row['subject_id'],
        'subject_code' => $row['subject_code'] ?: 'BCA',
        'subject_name' => $row['subject_name'],
        'paper_type' => $patternMeta['paper_type'] ?? 'Theory',
        'credits' => $credits,
        'component_label' => $patternMeta['component_label'] ?? 'CIA + ESE',
        'internal_max' => round($internalMax, 2),
        'internal_marks' => $subjectAbsent ? null : ($internalMarks !== null ? round((float) $internalMarks, 2) : null),
        'external_max' => round($externalMax, 2),
        'external_marks' => $subjectAbsent ? null : ($externalMarks !== null ? round((float) $externalMarks, 2) : null),
        'total_max' => round($maxMarks, 2),
        'max_marks' => round($maxMarks, 2),
        'marks_obtained' => $subjectAbsent ? null : round($obtained, 2),
        'is_absent' => $subjectAbsent,
        'percentage' => round($percentage, 2),
        'grade' => $grade,
        'result' => $resultStatus,
    ];
}

$overallPercentage = $totalMax > 0 ? (($totalObtained / $totalMax) * 100) : 0.0;
$overallGrade = resolveGrade($gradeSettings, $overallPercentage);
$sgpa = $totalCredits > 0 ? round($gradeWeightedTotal / $totalCredits, 2) : 0.0;
$overallResult = $failedSubjects === 0 ? 'PASS' : ($failedSubjects <= 2 ? 'ATKT' : 'FAIL');
[$yearLabel, $semesterLabel] = classLabels((string) ($student['class_name'] ?? ''));
$seatDigits = preg_replace('/\D+/', '', (string) ($student['gr_no'] ?? $student['id']));
$seatNumber = sprintf('BCA/%s/%04d', date('Y'), (int) substr(str_pad($seatDigits ?: (string) $student['id'], 4, '0', STR_PAD_LEFT), -4));
$patternNote = $selectedExamIsSemester
    ? 'Pattern followed for demo: theory papers use 20 marks CIA + 80 marks semester end, while practical / project papers use 40 internal-practical + 60 external or viva marks.'
    : 'Internal assessment sheet prepared for the same BCA semester pattern used in the local demo.';

jsonResponse([
    'student' => [
        'id' => (int) $student['id'],
        'full_name' => $student['full_name'],
        'gr_no' => $student['gr_no'],
        'seat_no' => $seatNumber,
        'abc_number' => $student['abc_number'],
        'date_of_birth' => $student['date_of_birth'],
        'course_name' => $student['course_name'],
        'class_name' => $student['class_name'],
        'section' => $student['section'],
        'year_label' => $yearLabel,
        'semester_label' => $semesterLabel,
        'academic_year' => $academicYear,
        'university_name' => 'Swami Ramanand Teerth Marathwada University, Nanded',
        'institute_name' => $student['institute_name'],
        'institute_logo' => $student['institute_logo'],
    ],
    'exam' => [
        'id' => (int) $exam['id'],
        'name' => $exam['name'],
        'description' => $exam['description'],
        'pattern_note' => $patternNote,
        'report_heading' => 'Statement of Marks / Semester Grade Card',
    ],
    'results' => $results,
    'summary' => [
        'total_marks_obtained' => round($totalObtained, 2),
        'total_max_marks' => round($totalMax, 2),
        'overall_percentage' => round($overallPercentage, 2),
        'overall_grade' => $overallGrade,
        'sgpa' => $sgpa,
        'credits_registered' => round($totalCredits, 2),
        'credits_earned' => round($earnedCredits, 2),
        'class_award' => classAward($overallPercentage),
        'result' => $overallResult,
        'failed_subjects' => $failedSubjects,
    ],
]);
