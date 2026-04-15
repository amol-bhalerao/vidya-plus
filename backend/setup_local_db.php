<?php

declare(strict_types=1);

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_NAME') ?: 'vidya_plus';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

function executeSqlFile(PDO $pdo, string $filePath): void
{
    if (!file_exists($filePath)) {
        throw new RuntimeException("SQL file not found: {$filePath}");
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES);
    $statement = '';

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if ($trimmed === '' || str_starts_with($trimmed, '--')) {
            continue;
        }

        $statement .= $line . PHP_EOL;

        if (str_ends_with(rtrim($line), ';')) {
            $pdo->exec($statement);
            $statement = '';
        }
    }

    if (trim($statement) !== '') {
        $pdo->exec($statement);
    }
}

function seedMockStudents(PDO $pdo, int $perClassTarget = 120): int
{
    $classes = $pdo->query(
        'SELECT c.id, c.institute_id, c.course_id, COUNT(s.id) AS student_count
         FROM classes c
         LEFT JOIN students s ON s.class_id = c.id
         GROUP BY c.id, c.institute_id, c.course_id
         ORDER BY c.id ASC'
    )->fetchAll();

    if (!$classes) {
        return 0;
    }

    $currentCount = array_sum(array_map(static fn(array $class): int => (int) $class['student_count'], $classes));
    $allClassesCovered = !array_filter($classes, static fn(array $class): bool => (int) $class['student_count'] < $perClassTarget);
    if ($allClassesCovered) {
        return $currentCount;
    }

    $maleFirstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Rahul', 'Rohan', 'Karan', 'Harsh', 'Manav', 'Ishaan', 'Pranav', 'Soham', 'Atharva'];
    $femaleFirstNames = ['Aditi', 'Ananya', 'Diya', 'Kavya', 'Priya', 'Sana', 'Riya', 'Pooja', 'Sneha', 'Neha', 'Ira', 'Mahi', 'Vaishnavi', 'Sakshi', 'Tanvi'];
    $middleNames = ['Ajay', 'Bhushan', 'Chaitanya', 'Deepak', 'Eknath', 'Farhan', 'Ganesh', 'Hemant', 'Ishwar', 'Jitendra', 'Kishor', 'Lokesh', 'Madhav', 'Nilesh', 'Omkar', 'Pratap', 'Ritesh'];
    $lastNames = ['Patil', 'Sharma', 'Jadhav', 'Khan', 'Kulkarni', 'Pawar', 'Deshmukh', 'Reddy', 'Joshi', 'Gupta', 'More', 'Chavan', 'Shinde', 'Kadam', 'Shaikh', 'Wagh', 'Bhosale'];
    $motherNames = ['Sunita', 'Kavita', 'Anita', 'Rekha', 'Maya', 'Vandana', 'Lata', 'Geeta', 'Seema', 'Shobha', 'Usha', 'Asha', 'Meera', 'Savita', 'Nanda', 'Jyoti', 'Archana'];
    $schools = ['ZP High School', 'Modern Public School', 'Shivaji Vidyalaya', 'National Junior College', 'Vidya Mandir', 'Scholar Academy'];
    $casteMatrix = [
        ['General', 'Open'],
        ['OBC', 'Reserved'],
        ['SC', 'Reserved'],
        ['ST', 'Reserved'],
    ];

    $insert = $pdo->prepare(
        'INSERT INTO students (
            institute_id, class_id, course_id, gr_no, admission_no, abc_number, full_name, mother_name,
            date_of_birth, birth_place, gender, aadhaar_no, caste, category, religion, mother_tongue,
            previous_school_details, admission_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $index = ((int) $pdo->query('SELECT COUNT(*) FROM students')->fetchColumn()) + 1;

    while (true) {
        $insertedInPass = false;

        foreach ($classes as &$class) {
            if ((int) $class['student_count'] >= $perClassTarget) {
                continue;
            }

            $isFemale = $index % 2 === 0;
            $firstName = $isFemale
                ? $femaleFirstNames[$index % count($femaleFirstNames)]
                : $maleFirstNames[$index % count($maleFirstNames)];
            $middleName = $middleNames[($index * 3) % count($middleNames)];
            $lastName = $lastNames[($index * 5) % count($lastNames)];
            [$caste, $category] = $casteMatrix[$index % count($casteMatrix)];

            $fullName = $firstName . ' ' . $middleName . ' ' . $lastName;
            $motherName = $motherNames[($index * 7) % count($motherNames)] . ' ' . $lastName;
            $grNo = sprintf('GR%05d', $index);
            $admissionNo = sprintf('BCA%05d', $index);
            $abcNumber = sprintf('ABC%06d', $index);
            $birthDate = (new DateTime('2001-01-01'))->modify('+' . (($index * 37) % 2400) . ' days')->format('Y-m-d');
            $admissionDate = (new DateTime('2024-06-15'))->modify('+' . (($index * 5) % 210) . ' days')->format('Y-m-d');
            $previousSchool = json_encode(['school' => $schools[($index * 2) % count($schools)]]);

            $insert->execute([
                $class['institute_id'],
                $class['id'],
                $class['course_id'],
                $grNo,
                $admissionNo,
                $abcNumber,
                $fullName,
                $motherName,
                $birthDate,
                'Hingoli',
                $isFemale ? 'female' : 'male',
                str_pad((string) (500000000000 + $index), 12, '0', STR_PAD_LEFT),
                $caste,
                $category,
                'Hindu',
                'Marathi',
                $previousSchool,
                $admissionDate,
                'active',
            ]);

            $class['student_count'] = (int) $class['student_count'] + 1;
            $currentCount++;
            $index++;
            $insertedInPass = true;
        }
        unset($class);

        if (!$insertedInPass) {
            break;
        }
    }

    return $currentCount;
}

function prepareSingleInstituteBcaDemo(PDO $pdo): array
{
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');

    foreach ([
        'student_exam_answers', 'student_online_exams', 'online_exam_questions', 'online_exams',
        'exam_marks', 'exam_timetable', 'seating_arrangement', 'generated_documents',
        'fee_transactions', 'fee_bills', 'attendance', 'class_fee_groups', 'fee_group_items',
        'class_fees', 'fee_groups', 'fee_types', 'class_subjects', 'syllabus', 'subjects',
        'classes', 'courses', 'admission_inquiries', 'general_ledger', 'grade_settings', 'students',
        'academic_years'
    ] as $table) {
        $pdo->exec("DELETE FROM `{$table}`");
    }

    $pdo->exec('DELETE FROM `institutes` WHERE id <> 1');
    $pdo->exec('DELETE FROM `module_settings`');

    $updateInstitute = $pdo->prepare(
        'UPDATE institutes
         SET name = ?, address = ?, udise_code = ?, logo_url = ?, receipt_header = ?, receipt_footer = ?, contact_info = ?, social_links = ?
         WHERE id = 1'
    );
    $updateInstitute->execute([
        'Kai. Bapurao Patil Arts, Science and Commerce College, Hingoli',
        'College Road, Hingoli, Maharashtra 431513',
        'SRTMUN-BCA-001',
        'logo.png',
        '<h1 style="font-size:18px;margin:0;">Kai. Bapurao Patil Arts, Science and Commerce College</h1><p style="margin:4px 0;">Affiliated to SRTMUN, Nanded</p>',
        '<p style="margin:0;">This is a computer-generated document issued for academic use.</p>',
        json_encode(['phone' => '+91-2456-220101', 'email' => 'bca@kbphingoli.edu.in', 'website' => 'https://example.edu.in']),
        json_encode(['facebook' => 'fb.com/kbphingoli', 'instagram' => '@kbphingoli'])
    ]);

    $academicYear = $pdo->prepare('INSERT INTO academic_years (institute_id, year_name, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)');
    $academicYear->execute([1, '2026-2027', '2026-06-15', '2027-05-31', 1]);

    $moduleSettings = $pdo->prepare('INSERT INTO module_settings (institute_id, settings) VALUES (?, ?)');
    $moduleSettings->execute([1, json_encode([
        'attendance' => true,
        'exams' => true,
        'finance' => true,
        'documents' => true,
        'website' => true,
    ])]);

    $courseInsert = $pdo->prepare('INSERT INTO courses (institute_id, course_name, course_code) VALUES (?, ?, ?)');
    $courseInsert->execute([1, 'Bachelor of Computer Applications', 'BCA']);
    $courseId = (int) $pdo->lastInsertId();

    $classInsert = $pdo->prepare('INSERT INTO classes (institute_id, course_id, class_name, section) VALUES (?, ?, ?, ?)');
    $classMap = [];
    foreach ([
        'FY BCA' => 'A',
        'SY BCA' => 'A',
        'TY BCA' => 'A',
    ] as $className => $section) {
        $classInsert->execute([1, $courseId, $className, $section]);
        $classMap[$className] = (int) $pdo->lastInsertId();
    }

    $subjectInsert = $pdo->prepare('INSERT INTO subjects (institute_id, subject_name, subject_code) VALUES (?, ?, ?)');
    $classSubjectInsert = $pdo->prepare('INSERT INTO class_subjects (class_id, subject_id) VALUES (?, ?)');
    $subjectMatrix = [
        'FY BCA' => [
            ['Programming in C', 'BCA101'],
            ['Digital Computer Fundamentals', 'BCA102'],
            ['Mathematics for Computing', 'BCA103'],
            ['Communication Skills', 'BCA104'],
            ['C Programming Lab', 'BCA105'],
        ],
        'SY BCA' => [
            ['Data Structures', 'BCA201'],
            ['Database Management Systems', 'BCA202'],
            ['Object Oriented Programming with Java', 'BCA203'],
            ['Operating Systems', 'BCA204'],
            ['Web Technology Lab', 'BCA205'],
        ],
        'TY BCA' => [
            ['Python Programming', 'BCA301'],
            ['Computer Networks', 'BCA302'],
            ['Software Engineering', 'BCA303'],
            ['Web Application Development', 'BCA304'],
            ['Project and Viva Voce', 'BCA305'],
        ],
    ];

    foreach ($subjectMatrix as $className => $subjects) {
        foreach ($subjects as [$subjectName, $subjectCode]) {
            $subjectInsert->execute([1, $subjectName, $subjectCode]);
            $subjectId = (int) $pdo->lastInsertId();
            $classSubjectInsert->execute([$classMap[$className], $subjectId]);
        }
    }

    $gradeInsert = $pdo->prepare('INSERT INTO grade_settings (institute_id, grade_name, min_percentage, max_percentage, description) VALUES (?, ?, ?, ?, ?)');
    foreach ([
        ['O', 90, 100, 'Outstanding'],
        ['A+', 80, 89.99, 'Excellent'],
        ['A', 70, 79.99, 'Very Good'],
        ['B+', 60, 69.99, 'Good'],
        ['B', 50, 59.99, 'Above Average'],
        ['C', 40, 49.99, 'Pass'],
        ['F', 0, 39.99, 'Fail'],
    ] as [$gradeName, $min, $max, $description]) {
        $gradeInsert->execute([1, $gradeName, $min, $max, $description]);
    }

    $feeTypeInsert = $pdo->prepare('INSERT INTO fee_types (institute_id, fee_name, description, default_amount) VALUES (?, ?, ?, ?)');
    $feeTypeIds = [];
    foreach ([
        ['Tuition Fee', 'Annual tuition charges for BCA programme', 18000],
        ['University Exam Fee', 'University examination and assessment charges', 2500],
        ['Lab and Practical Fee', 'Computer lab and practical charges', 3000],
    ] as [$feeName, $description, $amount]) {
        $feeTypeInsert->execute([1, $feeName, $description, $amount]);
        $feeTypeIds[$feeName] = (int) $pdo->lastInsertId();
    }

    $classFeeInsert = $pdo->prepare('INSERT INTO class_fees (institute_id, class_id, fee_type_id, amount) VALUES (?, ?, ?, ?)');
    $classFeePlan = [
        'FY BCA' => ['Tuition Fee' => 18000, 'University Exam Fee' => 2500, 'Lab and Practical Fee' => 3000],
        'SY BCA' => ['Tuition Fee' => 19500, 'University Exam Fee' => 2500, 'Lab and Practical Fee' => 3500],
        'TY BCA' => ['Tuition Fee' => 21000, 'University Exam Fee' => 3000, 'Lab and Practical Fee' => 4000],
    ];

    foreach ($classFeePlan as $className => $fees) {
        foreach ($fees as $feeName => $amount) {
            $classFeeInsert->execute([1, $classMap[$className], $feeTypeIds[$feeName], $amount]);
        }
    }

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

    return ['courseId' => $courseId, 'classMap' => $classMap];
}

function seedBcaExamData(PDO $pdo): array
{
    $classes = $pdo->query('SELECT id, class_name FROM classes ORDER BY id ASC')->fetchAll();
    if (!$classes) {
        return ['exams' => 0, 'marks' => 0, 'attendance' => 0, 'transactions' => 0];
    }

    $labelForClass = static function (string $className): array {
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
    };

    $buildPatternMeta = static function (string $className, array $subject) use ($labelForClass): array {
        [$yearLabel, $semesterLabel] = $labelForClass($className);
        $subjectName = (string) $subject['subject_name'];
        $isPractical = preg_match('/lab|project|viva/i', $subjectName) === 1;

        return [
            'subject_name' => $subjectName,
            'subject_code' => $subject['subject_code'],
            'year_label' => $yearLabel,
            'semester_label' => $semesterLabel,
            'paper_type' => $isPractical ? 'Practical/Viva' : 'Theory',
            'credits' => $isPractical ? 2 : 4,
            'internal_max' => $isPractical ? 40 : 20,
            'external_max' => $isPractical ? 60 : 80,
            'component_label' => $isPractical ? 'Practical + Viva' : 'CIA + ESE',
            'pattern_note' => $isPractical
                ? 'Practical / project papers follow 40 marks continuous practical assessment plus 60 marks semester-end viva or external performance for this BCA demo.'
                : 'Theory papers follow 20 marks internal assessment plus 80 marks semester-end university examination for this BCA demo.',
        ];
    };

    $examInsert = $pdo->prepare('INSERT INTO exams (institute_id, name, description) VALUES (?, ?, ?)');
    $examInsert->execute([1, 'BCA Internal Assessment 2026', 'Continuous internal assessment for BCA semester papers following an SRTMUN-affiliated-college style demo pattern.']);
    $internalExamId = (int) $pdo->lastInsertId();
    $examInsert->execute([1, 'BCA Semester End Examination 2026', 'Semester-end BCA examination aligned to a CBCS-style 20+80 theory and 40+60 practical pattern for the local demo.']);
    $semesterExamId = (int) $pdo->lastInsertId();

    $ttInsert = $pdo->prepare(
        'INSERT INTO exam_timetable (institute_id, exam_id, class_id, subject_id, exam_date, start_time, end_time, max_marks, subjects)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $subjectsByClassStmt = $pdo->prepare(
        'SELECT s.id, s.subject_name, s.subject_code
         FROM class_subjects cs
         INNER JOIN subjects s ON cs.subject_id = s.id
         WHERE cs.class_id = ?
         ORDER BY s.subject_code ASC'
    );

    $markInsert = $pdo->prepare('INSERT INTO exam_marks (institute_id, timetable_id, student_id, marks_obtained, is_absent) VALUES (?, ?, ?, ?, ?)');
    $studentStmt = $pdo->prepare('SELECT id FROM students WHERE class_id = ? ORDER BY id ASC');
    $attendanceInsert = $pdo->prepare('INSERT INTO attendance (student_id, class_id, institute_id, date, status, marked_by) VALUES (?, ?, 1, ?, ?, NULL)');
    $transactionInsert = $pdo->prepare(
        'INSERT INTO fee_transactions (student_id, institute_id, fee_bill_id, amount_paid, discount_amount, payment_mode, transaction_details, payment_date, collected_by)
         VALUES (?, 1, ?, ?, 0, ?, ?, ?, NULL)'
    );
    $billUpdate = $pdo->prepare('UPDATE fee_bills SET paid_amount = ?, last_payment_date = ?, status = ? WHERE id = ?');
    $billRows = $pdo->query('SELECT id, student_id, total_amount FROM fee_bills ORDER BY student_id ASC LIMIT 24')->fetchAll();

    $marksCount = 0;
    $attendanceCount = 0;
    $internalDays = ['2026-08-18', '2026-08-20', '2026-08-22', '2026-08-24', '2026-08-26'];
    $semesterDays = ['2026-10-10', '2026-10-12', '2026-10-14', '2026-10-16', '2026-10-18'];
    $attendanceDates = [
        date('Y-m-d', strtotime('-2 days')),
        date('Y-m-d', strtotime('-1 day')),
        date('Y-m-d'),
    ];
    $dayIndex = 0;

    foreach ($classes as $class) {
        $subjectsByClassStmt->execute([$class['id']]);
        $subjects = $subjectsByClassStmt->fetchAll();
        $studentStmt->execute([$class['id']]);
        $students = $studentStmt->fetchAll();

        foreach ($subjects as $subject) {
            $patternMeta = $buildPatternMeta($class['class_name'], $subject);
            $isPractical = $patternMeta['paper_type'] === 'Practical/Viva';
            $internalDate = $internalDays[$dayIndex % count($internalDays)];
            $semesterDate = $semesterDays[$dayIndex % count($semesterDays)];

            $ttInsert->execute([
                1,
                $internalExamId,
                $class['id'],
                $subject['id'],
                $internalDate,
                $isPractical ? '10:30:00' : '11:00:00',
                $isPractical ? '12:00:00' : '12:00:00',
                $patternMeta['internal_max'],
                json_encode(array_merge($patternMeta, ['assessment_component' => 'internal'])),
            ]);
            $internalTimetableId = (int) $pdo->lastInsertId();

            $ttInsert->execute([
                1,
                $semesterExamId,
                $class['id'],
                $subject['id'],
                $semesterDate,
                $isPractical ? '09:30:00' : '10:00:00',
                $isPractical ? '12:30:00' : '13:00:00',
                $patternMeta['external_max'],
                json_encode(array_merge($patternMeta, ['assessment_component' => 'semester_end'])),
            ]);
            $semesterTimetableId = (int) $pdo->lastInsertId();
            $dayIndex++;

            foreach ($students as $student) {
                $studentId = (int) $student['id'];
                $isAbsent = (($studentId + (int) $subject['id']) % 29) === 0;

                if ($isPractical) {
                    $internalMarks = $isAbsent ? null : 24 + (($studentId + (int) $subject['id']) % 15);
                    $semesterMarks = $isAbsent ? null : 34 + (($studentId + ((int) $subject['id'] * 2)) % 23);
                } else {
                    $internalMarks = $isAbsent ? null : 10 + (($studentId + (int) $subject['id']) % 9);
                    $semesterMarks = $isAbsent ? null : 42 + (($studentId + ((int) $subject['id'] * 2)) % 27);
                }

                $markInsert->execute([1, $internalTimetableId, $studentId, $internalMarks, $isAbsent ? 1 : 0]);
                $markInsert->execute([1, $semesterTimetableId, $studentId, $semesterMarks, $isAbsent ? 1 : 0]);
                $marksCount += 2;
            }
        }

        foreach ($students as $student) {
            foreach ($attendanceDates as $date) {
                $statusSelector = ((int) $student['id'] + (int) str_replace('-', '', $date)) % 10;
                $status = $statusSelector < 7 ? 'present' : ($statusSelector < 9 ? 'absent' : 'leave');
                $attendanceInsert->execute([(int) $student['id'], $class['id'], $date, $status]);
                $attendanceCount++;
            }
        }
    }

    $transactionCount = 0;
    foreach ($billRows as $index => $bill) {
        $totalAmount = (float) $bill['total_amount'];
        $paymentAmount = $index % 3 === 0 ? $totalAmount : round($totalAmount * 0.4, 2);
        $status = $paymentAmount >= $totalAmount ? 'paid' : 'partially_paid';
        $paymentDate = date('Y-m-d', strtotime('-' . ($index % 10) . ' days'));

        $transactionInsert->execute([
            (int) $bill['student_id'],
            (int) $bill['id'],
            $paymentAmount,
            $index % 2 === 0 ? 'upi' : 'cash',
            json_encode(['ref' => 'BCA-DEMO-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT)]),
            $paymentDate,
        ]);
        $billUpdate->execute([$paymentAmount, $paymentDate, $status, (int) $bill['id']]);
        $transactionCount++;
    }

    return ['exams' => 2, 'marks' => $marksCount, 'attendance' => $attendanceCount, 'transactions' => $transactionCount];
}

function ensureClassFees(PDO $pdo): void
{
    $classes = $pdo->query('SELECT id, institute_id FROM classes ORDER BY id ASC')->fetchAll();
    if (!$classes) {
        return;
    }

    $feeTypesByInstitute = [];
    $feeTypeStmt = $pdo->prepare('SELECT id, default_amount FROM fee_types WHERE institute_id = ? ORDER BY id ASC');
    $insertFeeType = $pdo->prepare('INSERT INTO fee_types (institute_id, fee_name, description, default_amount) VALUES (?, ?, ?, ?)');
    $classFeeCountStmt = $pdo->prepare('SELECT COUNT(*) FROM class_fees WHERE class_id = ?');
    $insertClassFee = $pdo->prepare('INSERT INTO class_fees (institute_id, class_id, fee_type_id, amount) VALUES (?, ?, ?, ?)');

    foreach ($classes as $class) {
        $instituteId = (int) $class['institute_id'];

        if (!isset($feeTypesByInstitute[$instituteId])) {
            $feeTypeStmt->execute([$instituteId]);
            $feeTypesByInstitute[$instituteId] = $feeTypeStmt->fetchAll();

            if (count($feeTypesByInstitute[$instituteId]) === 0) {
                $insertFeeType->execute([$instituteId, 'Tuition Fee', 'Standard tuition fee', 12000]);
                $insertFeeType->execute([$instituteId, 'Exam Fee', 'Standard examination fee', 2000]);
                $feeTypeStmt->execute([$instituteId]);
                $feeTypesByInstitute[$instituteId] = $feeTypeStmt->fetchAll();
            }
        }

        $classFeeCountStmt->execute([$class['id']]);
        if ((int) $classFeeCountStmt->fetchColumn() > 0) {
            continue;
        }

        foreach (array_slice($feeTypesByInstitute[$instituteId], 0, 2) as $feeType) {
            $amount = (float) ($feeType['default_amount'] ?? 0);
            if ($amount <= 0) {
                $amount = 5000;
            }
            $insertClassFee->execute([$instituteId, $class['id'], $feeType['id'], $amount]);
        }
    }
}

function seedFeeBills(PDO $pdo): int
{
    $students = $pdo->query(
        'SELECT s.id, s.institute_id, s.class_id, COALESCE(cls.class_name, "Class") AS class_name, COALESCE(c.course_name, "General") AS course_name
         FROM students s
         LEFT JOIN classes cls ON s.class_id = cls.id
         LEFT JOIN courses c ON s.course_id = c.id
         WHERE s.status = "active" AND s.class_id IS NOT NULL
         ORDER BY s.id ASC'
    )->fetchAll();

    if (!$students) {
        return 0;
    }

    $existingBillStmt = $pdo->prepare('SELECT COUNT(*) FROM fee_bills WHERE student_id = ?');
    $classFeeTotalStmt = $pdo->prepare('SELECT COALESCE(SUM(amount), 0) FROM class_fees WHERE class_id = ?');
    $insertBill = $pdo->prepare(
        'INSERT INTO fee_bills (student_id, institute_id, bill_name, due_date, total_amount, paid_amount, status, last_payment_date)
         VALUES (?, ?, ?, ?, ?, 0, "unpaid", NULL)'
    );

    $created = 0;
    foreach ($students as $student) {
        $existingBillStmt->execute([$student['id']]);
        if ((int) $existingBillStmt->fetchColumn() > 0) {
            continue;
        }

        $classFeeTotalStmt->execute([$student['class_id']]);
        $totalAmount = (float) $classFeeTotalStmt->fetchColumn();
        if ($totalAmount <= 0) {
            $totalAmount = 12000;
        }

        $billName = trim($student['course_name'] . ' - ' . $student['class_name'] . ' Fees');
        $insertBill->execute([
            $student['id'],
            $student['institute_id'],
            $billName,
            date('Y-03-31', strtotime('+1 year')),
            $totalAmount,
        ]);
        $created++;
    }

    return $created;
}

function seedAdmissionInquiries(PDO $pdo, int $targetCount = 18): int
{
    $currentCount = (int) $pdo->query('SELECT COUNT(*) FROM admission_inquiries')->fetchColumn();
    if ($currentCount >= $targetCount) {
        return $currentCount;
    }

    $classes = $pdo->query(
        'SELECT c.id, c.class_name, c.section, c.course_id
         FROM classes c
         ORDER BY c.id ASC'
    )->fetchAll();

    if (!$classes) {
        return $currentCount;
    }

    $firstNames = ['Om', 'Sanika', 'Tejas', 'Vaishnavi', 'Atharva', 'Shravani', 'Pranav', 'Sakshi', 'Vedant', 'Anushka', 'Soham', 'Tanvi'];
    $lastNames = ['Patil', 'Deshmukh', 'Shinde', 'Kadam', 'More', 'Jadhav', 'Shaikh', 'Kulkarni'];
    $statuses = ['inquiry', 'follow_up', 'documents_pending', 'admitted'];
    $notes = [
        'Interested in the BCA programme and campus placement support.',
        'Parent counselling completed and scholarship details requested.',
        'Document verification in progress for the upcoming intake.',
        'Candidate shortlisted after counselling round and aptitude review.',
    ];

    $insert = $pdo->prepare(
        'INSERT INTO admission_inquiries (institute_id, full_name, contact_phone, contact_email, course_id, class_id, status, notes, inquiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    for ($index = $currentCount + 1; $currentCount < $targetCount; $index++, $currentCount++) {
        $class = $classes[($index - 1) % count($classes)];
        $firstName = $firstNames[$index % count($firstNames)];
        $lastName = $lastNames[($index + 2) % count($lastNames)];
        $fullName = $firstName . ' ' . $lastName;

        $insert->execute([
            1,
            $fullName,
            sprintf('98%08d', $index),
            strtolower(str_replace(' ', '.', $fullName)) . sprintf('%02d', $index) . '@example.edu.in',
            (int) $class['course_id'],
            (int) $class['id'],
            $statuses[$index % count($statuses)],
            $notes[$index % count($notes)] . ' Preferred class: ' . $class['class_name'] . ' ' . $class['section'] . '.',
            date('Y-m-d', strtotime('-' . (($index - 1) % 21) . ' days')),
        ]);
    }

    return $currentCount;
}

function seedSyllabusRecords(PDO $pdo): int
{
    $currentCount = (int) $pdo->query('SELECT COUNT(*) FROM syllabus')->fetchColumn();
    if ($currentCount > 0) {
        return $currentCount;
    }

    $academicYear = $pdo->query('SELECT year_name FROM academic_years WHERE is_active = 1 ORDER BY id DESC LIMIT 1')->fetchColumn();
    if (!$academicYear) {
        $academicYear = date('Y') . '-' . ((int) date('Y') + 1);
    }

    $rows = $pdo->query(
        'SELECT c.id AS class_id, c.class_name, s.id AS subject_id, s.subject_name, s.subject_code
         FROM classes c
         INNER JOIN class_subjects cs ON cs.class_id = c.id
         INNER JOIN subjects s ON s.id = cs.subject_id
         ORDER BY c.id ASC, s.subject_code ASC'
    )->fetchAll();

    if (!$rows) {
        return 0;
    }

    $insert = $pdo->prepare(
        'INSERT INTO syllabus (institute_id, class_id, subject_id, syllabus_title, syllabus_content, syllabus_file_url, academic_year)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    foreach ($rows as $row) {
        $topicName = (string) $row['subject_name'];
        $className = (string) $row['class_name'];
        $content = implode(PHP_EOL, [
            'Unit I: Foundation concepts and orientation for ' . $topicName . '.',
            'Unit II: Core theory, problem solving, and classroom assignments aligned to ' . $className . '.',
            'Unit III: Practical applications, case studies, and internal assessment activities.',
            'Unit IV: Revision, viva preparation, model question practice, and outcome review.',
        ]);

        $insert->execute([
            1,
            (int) $row['class_id'],
            (int) $row['subject_id'],
            $topicName . ' - ' . $className,
            $content,
            null,
            $academicYear,
        ]);
    }

    return count($rows);
}

function seedExpenseRecords(PDO $pdo): int
{
    $currentCount = (int) $pdo->query('SELECT COUNT(*) FROM expenses')->fetchColumn();
    if ($currentCount > 0) {
        return $currentCount;
    }

    $categories = $pdo->query('SELECT id, category_name FROM expense_categories WHERE institute_id = 1 ORDER BY id ASC')->fetchAll();
    if (!$categories) {
        return 0;
    }

    $expensePlans = [
        ['Campus internet and LMS renewal', 8500, 'Netconnect Services'],
        ['Computer lab maintenance', 12600, 'TechCare Systems'],
        ['Library and journal subscription', 6400, 'Academic Books Depot'],
        ['Seminar and guest lecture arrangements', 5200, 'Event Support Co.'],
        ['Housekeeping and sanitation supplies', 4100, 'Clean Campus Traders'],
        ['Power backup servicing for lab block', 7350, 'PowerSecure Engineers'],
    ];

    $insert = $pdo->prepare(
        'INSERT INTO expenses (institute_id, category_id, amount, expense_date, description, vendor, created_by)
         VALUES (?, ?, ?, ?, ?, ?, NULL)'
    );

    foreach ($expensePlans as $index => [$description, $amount, $vendor]) {
        $category = $categories[$index % count($categories)];
        $insert->execute([
            1,
            (int) $category['id'],
            $amount,
            date('Y-m-d', strtotime('-' . (($index % 6) + 1) . ' days')),
            $description,
            $vendor,
        ]);
    }

    return count($expensePlans);
}

function seedGeneralLedgerData(PDO $pdo): int
{
    $currentCount = (int) $pdo->query('SELECT COUNT(*) FROM general_ledger')->fetchColumn();
    if ($currentCount > 0) {
        return $currentCount;
    }

    $insert = $pdo->prepare(
        'INSERT INTO general_ledger (institute_id, transaction_date, account, description, debit, credit, transaction_type, reference_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $created = 0;

    $transactions = $pdo->query(
        'SELECT ft.id, ft.amount_paid, ft.payment_date, s.full_name, fb.bill_name
         FROM fee_transactions ft
         INNER JOIN students s ON s.id = ft.student_id
         INNER JOIN fee_bills fb ON fb.id = ft.fee_bill_id
         ORDER BY ft.id DESC
         LIMIT 18'
    )->fetchAll();

    foreach ($transactions as $index => $transaction) {
        $timestamp = $transaction['payment_date'] . ' ' . sprintf('%02d:%02d:00', 9 + ($index % 8), ($index * 7) % 60);
        $insert->execute([
            1,
            $transaction['payment_date'],
            'Student Fee Collection',
            'Fee received from ' . $transaction['full_name'] . ' for ' . $transaction['bill_name'] . '.',
            null,
            (float) $transaction['amount_paid'],
            'fee_collection',
            (int) $transaction['id'],
            $timestamp,
        ]);
        $created++;
    }

    $recentAdmissions = $pdo->query(
        'SELECT s.id, s.full_name, c.class_name
         FROM students s
         INNER JOIN classes c ON c.id = s.class_id
         ORDER BY s.id DESC
         LIMIT 12'
    )->fetchAll();

    foreach ($recentAdmissions as $index => $student) {
        $entryDate = date('Y-m-d', strtotime('-' . ($index % 8) . ' days'));
        $insert->execute([
            1,
            $entryDate,
            'Admissions Register',
            $student['full_name'] . ' registered in ' . $student['class_name'] . '.',
            null,
            null,
            'student_admission',
            (int) $student['id'],
            $entryDate . ' ' . sprintf('%02d:%02d:00', 8 + ($index % 4), 10 + $index),
        ]);
        $created++;
    }

    $expenses = $pdo->query(
        'SELECT e.id, e.amount, e.expense_date, e.description, COALESCE(ec.category_name, "Operational Expense") AS category_name
         FROM expenses e
         LEFT JOIN expense_categories ec ON ec.id = e.category_id
         WHERE e.institute_id = 1
         ORDER BY e.id DESC'
    )->fetchAll();

    foreach ($expenses as $index => $expense) {
        $timestamp = $expense['expense_date'] . ' ' . sprintf('%02d:%02d:00', 14 + ($index % 4), ($index * 9) % 60);
        $insert->execute([
            1,
            $expense['expense_date'],
            $expense['category_name'],
            $expense['description'],
            (float) $expense['amount'],
            null,
            'expense_payment',
            (int) $expense['id'],
            $timestamp,
        ]);
        $created++;
    }

    return $created;
}

function seedWebsiteShowcaseData(PDO $pdo): array
{
    foreach (['website_carousel', 'website_team', 'website_gallery', 'website_events', 'website_documents'] as $table) {
        $pdo->exec("DELETE FROM {$table} WHERE institute_id = 1");
    }

    $contentInsert = $pdo->prepare(
        'INSERT INTO website_content (institute_id, page, section, content)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE content = VALUES(content)'
    );
    $contentInsert->execute([1, 'home', 'hero', json_encode([
        'headline' => 'BCA Admissions Open for 2026-2027',
        'subheadline' => 'One institute, three BCA years, and a complete local academic demo for admissions, fees, attendance, and examinations.',
    ])]);
    $contentInsert->execute([1, 'about', 'overview', json_encode([
        'title' => 'About the Institute',
        'summary' => 'Kai. Bapurao Patil Arts, Science and Commerce College, Hingoli is configured as the single-institute BCA showcase for the local demo.',
    ])]);
    $contentInsert->execute([1, 'contact', 'details', json_encode([
        'phone' => '+91-2456-220101',
        'email' => 'bca@kbphingoli.edu.in',
        'address' => 'College Road, Hingoli, Maharashtra 431513',
    ])]);

    $carouselInsert = $pdo->prepare('INSERT INTO website_carousel (institute_id, image_url, title, subtitle, sort_order) VALUES (?, ?, ?, ?, ?)');
    $carouselRows = [
        ['https://placehold.co/1200x500/png?text=Vidya%2B+BCA+Campus', 'BCA Campus Showcase', 'Admissions, attendance, finance, and exams in one workflow', 1],
        ['https://placehold.co/1200x500/png?text=Smart+Computer+Lab', 'Modern Computer Lab', 'Semester-ready practical and viva demonstration setup', 2],
        ['https://placehold.co/1200x500/png?text=Placement+and+Skills', 'Career and Skills Focus', 'Mock placement, project, and academic reporting support', 3],
    ];
    foreach ($carouselRows as [$imageUrl, $title, $subtitle, $sortOrder]) {
        $carouselInsert->execute([1, $imageUrl, $title, $subtitle, $sortOrder]);
    }

    $teamInsert = $pdo->prepare('INSERT INTO website_team (institute_id, name, designation, image_url, sort_order) VALUES (?, ?, ?, ?, ?)');
    $teamRows = [
        ['Dr. Meena Patil', 'Principal', 'https://placehold.co/300x300/png?text=Principal', 1],
        ['Prof. Rohan Kulkarni', 'BCA Head of Department', 'https://placehold.co/300x300/png?text=HOD', 2],
        ['Prof. Sneha Deshmukh', 'Training and Placement Officer', 'https://placehold.co/300x300/png?text=TPO', 3],
        ['Prof. Aditya Jadhav', 'Exam Co-ordinator', 'https://placehold.co/300x300/png?text=Exam+Cell', 4],
    ];
    foreach ($teamRows as [$name, $designation, $imageUrl, $sortOrder]) {
        $teamInsert->execute([1, $name, $designation, $imageUrl, $sortOrder]);
    }

    $galleryInsert = $pdo->prepare('INSERT INTO website_gallery (institute_id, title, image_url) VALUES (?, ?, ?)');
    $galleryRows = [
        ['Computer Lab Orientation', 'https://placehold.co/800x500/png?text=Computer+Lab'],
        ['Freshers Welcome and Induction', 'https://placehold.co/800x500/png?text=Freshers+Welcome'],
        ['Mini Project Review', 'https://placehold.co/800x500/png?text=Mini+Project+Review'],
        ['Coding Club Activity', 'https://placehold.co/800x500/png?text=Coding+Club'],
        ['Library Resource Session', 'https://placehold.co/800x500/png?text=Library+Session'],
        ['Campus Placement Workshop', 'https://placehold.co/800x500/png?text=Placement+Workshop'],
    ];
    foreach ($galleryRows as [$title, $imageUrl]) {
        $galleryInsert->execute([1, $title, $imageUrl]);
    }

    $eventInsert = $pdo->prepare('INSERT INTO website_events (institute_id, title, description, date, image_url) VALUES (?, ?, ?, ?, ?)');
    $eventRows = [
        ['BCA Induction Programme', 'Orientation for first-year students with faculty and lab introduction.', date('Y-m-d', strtotime('+7 days')), 'https://placehold.co/800x400/png?text=Induction'],
        ['Internal Assessment Review', 'Department-level review for CIA performance and mentoring.', date('Y-m-d', strtotime('+14 days')), 'https://placehold.co/800x400/png?text=Assessment+Review'],
        ['Industry Expert Talk', 'Guest lecture on web development and career readiness.', date('Y-m-d', strtotime('+21 days')), 'https://placehold.co/800x400/png?text=Expert+Talk'],
        ['Semester Project Demo Day', 'Final-year students present software projects and viva demos.', date('Y-m-d', strtotime('+30 days')), 'https://placehold.co/800x400/png?text=Project+Demo'],
    ];
    foreach ($eventRows as [$title, $description, $date, $imageUrl]) {
        $eventInsert->execute([1, $title, $description, $date, $imageUrl]);
    }

    $documentInsert = $pdo->prepare('INSERT INTO website_documents (institute_id, title, category, file_url) VALUES (?, ?, ?, ?)');
    $documentRows = [
        ['BCA Prospectus 2026-2027', 'Prospectus', 'https://placehold.co/1000x1400/png?text=BCA+Prospectus'],
        ['Academic Calendar', 'Notice', 'https://placehold.co/1000x1400/png?text=Academic+Calendar'],
        ['Fee Structure and Scholarship Note', 'Fee', 'https://placehold.co/1000x1400/png?text=Fee+Structure'],
    ];
    foreach ($documentRows as [$title, $category, $fileUrl]) {
        $documentInsert->execute([1, $title, $category, $fileUrl]);
    }

    return [
        'carousel' => count($carouselRows),
        'team' => count($teamRows),
        'gallery' => count($galleryRows),
        'events' => count($eventRows),
        'documents' => count($documentRows),
    ];
}

try {
    $pdo = new PDO(
        "mysql:host={$host};port={$port};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $pdo->exec("DROP DATABASE IF EXISTS `{$dbName}`");
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$dbName}`");

    executeSqlFile($pdo, __DIR__ . '/schema.sql');
    executeSqlFile($pdo, __DIR__ . '/seed.sql');
    prepareSingleInstituteBcaDemo($pdo);
    $studentCount = seedMockStudents($pdo, 120);
    $inquiryCount = seedAdmissionInquiries($pdo, 18);
    $syllabusCount = seedSyllabusRecords($pdo);
    ensureClassFees($pdo);
    $feeBillCount = seedFeeBills($pdo);
    $bcaDemoStats = seedBcaExamData($pdo);
    $expenseCount = seedExpenseRecords($pdo);
    $ledgerCount = seedGeneralLedgerData($pdo);
    $websiteStats = seedWebsiteShowcaseData($pdo);

    echo "Local database '{$dbName}' is ready." . PHP_EOL;
    echo "Students seeded: {$studentCount}" . PHP_EOL;
    echo "Admission inquiries seeded: {$inquiryCount}" . PHP_EOL;
    echo "Syllabus records seeded: {$syllabusCount}" . PHP_EOL;
    echo "Fee bills created: {$feeBillCount}" . PHP_EOL;
    echo "BCA exams seeded: {$bcaDemoStats['exams']}" . PHP_EOL;
    echo "Exam marks seeded: {$bcaDemoStats['marks']}" . PHP_EOL;
    echo "Attendance entries seeded: {$bcaDemoStats['attendance']}" . PHP_EOL;
    echo "Sample fee transactions seeded: {$bcaDemoStats['transactions']}" . PHP_EOL;
    echo "Expenses seeded: {$expenseCount}" . PHP_EOL;
    echo "General ledger entries seeded: {$ledgerCount}" . PHP_EOL;
    echo "Website showcase seeded: carousel={$websiteStats['carousel']}, team={$websiteStats['team']}, gallery={$websiteStats['gallery']}, events={$websiteStats['events']}, documents={$websiteStats['documents']}" . PHP_EOL;
    echo "Host: {$host}:{$port}" . PHP_EOL;
    echo "User: {$user}" . PHP_EOL;
} catch (Throwable $e) {
    fwrite(STDERR, "Database setup failed: " . $e->getMessage() . PHP_EOL);
    exit(1);
}
