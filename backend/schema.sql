-- Vidya Plus MySQL-compatible schema
-- Uses INT AUTO_INCREMENT primary keys for compatibility with the PHP backend

CREATE DATABASE IF NOT EXISTS vidya_plus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE vidya_plus;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) DEFAULT NULL,
    role VARCHAR(50) DEFAULT 'user',
    institute_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS institutes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT DEFAULT NULL,
    udise_code VARCHAR(100) DEFAULT NULL,
    logo_url TEXT DEFAULT NULL,
    receipt_header TEXT DEFAULT NULL,
    receipt_footer TEXT DEFAULT NULL,
    contact_info JSON DEFAULT NULL,
    social_links JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS module_settings (
    institute_id INT NOT NULL PRIMARY KEY,
    settings JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT module_settings_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    year_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT academic_years_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(100) DEFAULT NULL,
    CONSTRAINT courses_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    course_id INT NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    section VARCHAR(50) DEFAULT NULL,
    CONSTRAINT classes_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT classes_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    class_id INT DEFAULT NULL,
    course_id INT DEFAULT NULL,
    gr_no VARCHAR(100) DEFAULT NULL,
    admission_no VARCHAR(100) NOT NULL,
    abc_number VARCHAR(100) DEFAULT NULL,
    full_name VARCHAR(255) NOT NULL,
    mother_name VARCHAR(255) DEFAULT NULL,
    date_of_birth DATE NOT NULL,
    birth_place VARCHAR(255) DEFAULT NULL,
    gender VARCHAR(20) NOT NULL,
    aadhaar_no VARCHAR(50) DEFAULT NULL,
    caste VARCHAR(100) DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    religion VARCHAR(100) DEFAULT NULL,
    mother_tongue VARCHAR(100) DEFAULT NULL,
    previous_school_details JSON DEFAULT NULL,
    admission_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY students_institute_admission_no_unique (institute_id, admission_no),
    UNIQUE KEY students_institute_gr_no_unique (institute_id, gr_no),
    UNIQUE KEY students_institute_abc_number_unique (institute_id, abc_number),
    UNIQUE KEY students_institute_aadhaar_no_unique (institute_id, aadhaar_no),
    CONSTRAINT students_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT students_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    CONSTRAINT students_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(100) DEFAULT NULL,
    CONSTRAINT subjects_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS syllabus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    syllabus_title VARCHAR(255) NOT NULL,
    syllabus_content TEXT DEFAULT NULL,
    syllabus_file_url TEXT DEFAULT NULL,
    academic_year VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT syllabus_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT syllabus_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT syllabus_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT exams_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS seating_arrangement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    exam_id INT NOT NULL,
    class_id INT NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    seat_layout JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT seating_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT seating_exam_fk FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT seating_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS class_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    CONSTRAINT class_subjects_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT class_subjects_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    institute_id INT NOT NULL,
    role_id INT DEFAULT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    designation VARCHAR(255) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employees_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT employees_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT employees_role_fk FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admission_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) DEFAULT NULL,
    contact_email VARCHAR(255) DEFAULT NULL,
    course_id INT DEFAULT NULL,
    class_id INT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'inquiry',
    notes TEXT DEFAULT NULL,
    inquiry_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admission_inquiries_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT admission_inquiries_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT admission_inquiries_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    institute_id INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    marked_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attendance_student_fk FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT attendance_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT attendance_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT attendance_marked_by_fk FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    is_admission_group BOOLEAN DEFAULT FALSE,
    CONSTRAINT fee_groups_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    fee_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    default_amount DECIMAL(10,2) DEFAULT NULL,
    CONSTRAINT fee_types_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS class_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    class_id INT NOT NULL,
    fee_type_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    CONSTRAINT class_fees_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT class_fees_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT class_fees_fee_type_fk FOREIGN KEY (fee_type_id) REFERENCES fee_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS class_fee_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    fee_group_id INT NOT NULL,
    CONSTRAINT class_fee_groups_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT class_fee_groups_group_fk FOREIGN KEY (fee_group_id) REFERENCES fee_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_group_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_group_id INT NOT NULL,
    fee_type_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    CONSTRAINT fee_group_items_group_fk FOREIGN KEY (fee_group_id) REFERENCES fee_groups(id) ON DELETE CASCADE,
    CONSTRAINT fee_group_items_type_fk FOREIGN KEY (fee_type_id) REFERENCES fee_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    institute_id INT NOT NULL,
    bill_name VARCHAR(255) NOT NULL,
    due_date DATE DEFAULT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) AS (total_amount - paid_amount) VIRTUAL,
    status VARCHAR(50) DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_payment_date DATE DEFAULT NULL,
    misc_fee_details JSON DEFAULT NULL,
    CONSTRAINT fee_bills_student_fk FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fee_bills_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    institute_id INT NOT NULL,
    fee_bill_id INT NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    payment_mode VARCHAR(100) NOT NULL,
    transaction_details JSON DEFAULT NULL,
    payment_date DATE NOT NULL,
    collected_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fee_transactions_student_fk FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fee_transactions_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT fee_transactions_bill_fk FOREIGN KEY (fee_bill_id) REFERENCES fee_bills(id) ON DELETE CASCADE,
    CONSTRAINT fee_transactions_collected_by_fk FOREIGN KEY (collected_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    CONSTRAINT expense_categories_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    category_id INT DEFAULT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT DEFAULT NULL,
    vendor VARCHAR(255) DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expenses_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT expenses_category_fk FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL,
    CONSTRAINT expenses_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS general_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    transaction_date DATE NOT NULL,
    account VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    debit DECIMAL(12,2) DEFAULT NULL,
    credit DECIMAL(12,2) DEFAULT NULL,
    transaction_type VARCHAR(100) DEFAULT NULL,
    reference_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT general_ledger_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS generated_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    student_id INT NOT NULL,
    document_type VARCHAR(255) NOT NULL,
    sequence_number VARCHAR(255) NOT NULL,
    generated_by INT DEFAULT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    document_data JSON DEFAULT NULL,
    CONSTRAINT generated_documents_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT generated_documents_student_fk FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT generated_documents_generated_by_fk FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS grade_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    grade_name VARCHAR(100) NOT NULL,
    min_percentage DECIMAL(5,2) NOT NULL,
    max_percentage DECIMAL(5,2) NOT NULL,
    description TEXT DEFAULT NULL,
    CONSTRAINT grade_settings_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS online_exam_question_bank (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    subject_id INT DEFAULT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    options JSON DEFAULT NULL,
    marks INT NOT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT online_exam_question_bank_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT online_exam_question_bank_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT online_exam_question_bank_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS online_exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    scheduled_start_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    total_marks INT NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming',
    CONSTRAINT online_exams_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT online_exams_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT online_exams_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS online_exam_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question_id INT NOT NULL,
    CONSTRAINT online_exam_questions_exam_fk FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE,
    CONSTRAINT online_exam_questions_question_fk FOREIGN KEY (question_id) REFERENCES online_exam_question_bank(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_online_exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    exam_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'not_started',
    started_at TIMESTAMP NULL DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    score DECIMAL(8,2) DEFAULT NULL,
    CONSTRAINT student_online_exams_student_fk FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT student_online_exams_exam_fk FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_exam_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_exam_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT DEFAULT NULL,
    selected_option_index INT DEFAULT NULL,
    is_correct BOOLEAN DEFAULT NULL,
    marks_awarded DECIMAL(8,2) DEFAULT NULL,
    CONSTRAINT student_exam_answers_student_exam_fk FOREIGN KEY (student_exam_id) REFERENCES student_online_exams(id) ON DELETE CASCADE,
    CONSTRAINT student_exam_answers_question_fk FOREIGN KEY (question_id) REFERENCES online_exam_question_bank(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    exam_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT DEFAULT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_marks INT NOT NULL,
    subjects JSON DEFAULT NULL,
    CONSTRAINT exam_timetable_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT exam_timetable_exam_fk FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT exam_timetable_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT exam_timetable_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    timetable_id INT NOT NULL,
    student_id INT NOT NULL,
    marks_obtained DECIMAL(8,2) DEFAULT NULL,
    is_absent BOOLEAN DEFAULT FALSE,
    UNIQUE KEY exam_marks_timetable_student_unique (timetable_id, student_id),
    CONSTRAINT exam_marks_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    CONSTRAINT exam_marks_timetable_fk FOREIGN KEY (timetable_id) REFERENCES exam_timetable(id) ON DELETE CASCADE,
    CONSTRAINT exam_marks_student_fk FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Website related tables
CREATE TABLE IF NOT EXISTS website_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    page VARCHAR(100) NOT NULL,
    section VARCHAR(100) NOT NULL,
    content JSON DEFAULT NULL,
    UNIQUE KEY institute_page_section (institute_id, page, section),
    CONSTRAINT website_content_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS website_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT website_documents_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS website_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    date DATE NOT NULL,
    image_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT website_events_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS website_gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    image_url TEXT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT website_gallery_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS website_team (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT website_team_institute_fk FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS website_carousel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    image_url TEXT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    subtitle VARCHAR(255) DEFAULT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT website_carousel_institute_fk2 FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
