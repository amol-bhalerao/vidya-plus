


-- Seed data for Vidya Plus

-- Insert Late Baburao Patil Arts & Science College, Hingoli
INSERT IGNORE INTO institutes (id, name, address, udise_code, logo_url, receipt_header, receipt_footer, contact_info, social_links)
VALUES 
(1, 'Vidya Institute', '123 Demo Street', 'UDISE123', 'logo.png', 'Welcome to Vidya', 'Thank you for your payment', '{"phone":"+1-555-0100","email":"info@demoinstitute.edu"}', '{"facebook":"fb.com/vidya","twitter":"@vidya"}'),
(2, 'Late Baburao Patil Arts & Science College, Hingoli', 'College Road, Hingoli, Maharashtra 431513', 'UDISE456789', 'hpatil_logo.png', 'Late Baburao Patil Arts & Science College', 'Thank you for your payment', '{"phone":"+91-2457-222001","email":"info@lpbasc.ac.in","website":"www.lpbasc.ac.in"}', '{"facebook":"fb.com/lpbasc","twitter":"@lpbasc","instagram":"@lpbasc_official"}');


-- Insert demo courses with explicit IDs for FK use
INSERT IGNORE INTO courses (id, institute_id, course_name, course_code) VALUES
(1, 1, 'Science', 'SCI'),
(2, 1, 'Commerce', 'COM'),
(3, 1, 'Arts', 'ART'),
-- Courses for Late Baburao Patil College
(4, 2, 'Bachelor of Arts', 'BA'),
(5, 2, 'Bachelor of Science', 'BSc'),
(6, 2, 'Bachelor of Commerce', 'BCom');


-- Insert demo classes using real course IDs
INSERT IGNORE INTO classes (id, institute_id, course_id, class_name, section) VALUES
(1, 1, 1, '12th Grade', 'A'),
(2, 1, 2, '11th Grade', 'B'),
-- Classes for Late Baburao Patil College
(3, 2, 4, 'First Year BA', 'A'),
(4, 2, 4, 'Second Year BA', 'A'),
(5, 2, 4, 'Third Year BA', 'A'),
(6, 2, 5, 'First Year BSc', 'A'),
(7, 2, 5, 'Second Year BSc', 'A'),
(8, 2, 5, 'Third Year BSc', 'A'),
(9, 2, 6, 'First Year BCom', 'A'),
(10, 2, 6, 'Second Year BCom', 'A'),
(11, 2, 6, 'Third Year BCom', 'A');


-- Insert demo subjects with explicit IDs
INSERT IGNORE INTO subjects (id, institute_id, subject_name, subject_code) VALUES
(1, 1, 'Mathematics', 'MATH'),
(2, 1, 'Physics', 'PHY'),
(3, 1, 'English', 'ENG'),
-- Subjects for Late Baburao Patil College
(4, 2, 'English Literature', 'ENG_LIT'),
(5, 2, 'History', 'HIST'),
(6, 2, 'Economics', 'ECON'),
(7, 2, 'Computer Science', 'CS'),
(8, 2, 'Chemistry', 'CHEM'),
(9, 2, 'Accounting', 'ACCT'),
(10, 2, 'Business Studies', 'BS');


-- Insert demo students with explicit IDs
INSERT IGNORE INTO students (id, institute_id, class_id, course_id, admission_no, full_name, mother_name, date_of_birth, birth_place, gender, aadhaar_no, caste, category, religion, mother_tongue, previous_school_details, admission_date, status)
VALUES
(1, 1, 1, 1, 'A001', 'Rohan Mehta', 'Sunita Mehta', '2007-05-12', 'Mumbai', 'Male', '123456789012', 'General', 'Open', 'Hindu', 'Hindi', '{"school":"ABC Public School"}', '2023-06-01', 'active'),
(2, 1, 2, 2, 'A002', 'Priya Singh', 'Anita Singh', '2008-09-23', 'Delhi', 'Female', '987654321098', 'OBC', 'Reserved', 'Hindu', 'Hindi', '{"school":"XYZ Convent"}', '2023-06-01', 'active'),
-- 50 Mock Students for Late Baburao Patil College
(3, 2, 3, 4, 'BA001', 'Aditya Joshi', 'Sneha Joshi', '2003-01-15', 'Hingoli', 'Male', '456789012345', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(4, 2, 3, 4, 'BA002', 'Sakshi Pawar', 'Maya Pawar', '2003-02-20', 'Hingoli', 'Female', '567890123456', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(5, 2, 3, 4, 'BA003', 'Rahul Kale', 'Surekha Kale', '2003-03-10', 'Hingoli', 'Male', '678901234567', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(6, 2, 3, 4, 'BA004', 'Pooja Deshmukh', 'Kavita Deshmukh', '2003-04-05', 'Hingoli', 'Female', '789012345678', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(7, 2, 3, 4, 'BA005', 'Vikas More', 'Sharda More', '2003-05-12', 'Hingoli', 'Male', '890123456789', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(8, 2, 4, 4, 'BA006', 'Nisha Patil', 'Laxmi Patil', '2002-06-18', 'Hingoli', 'Female', '901234567890', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(9, 2, 4, 4, 'BA007', 'Amol Shinde', 'Pushpa Shinde', '2002-07-22', 'Hingoli', 'Male', '012345678901', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(10, 2, 4, 4, 'BA008', 'Kiran Yadav', 'Mamta Yadav', '2002-08-30', 'Hingoli', 'Female', '123450987654', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(11, 2, 4, 4, 'BA009', 'Sanjay Jadhav', 'Usha Jadhav', '2002-09-15', 'Hingoli', 'Male', '567890123789', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(12, 2, 4, 4, 'BA010', 'Anjali Kamble', 'Geeta Kamble', '2002-10-25', 'Hingoli', 'Female', '901234567456', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(13, 2, 5, 4, 'BA011', 'Suresh Bhoir', 'Indu Bhoir', '2001-11-11', 'Hingoli', 'Male', '234567890123', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(14, 2, 5, 4, 'BA012', 'Reshma Gawde', 'Rekha Gawde', '2001-12-05', 'Hingoli', 'Female', '678901234234', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(15, 2, 5, 4, 'BA013', 'Mahesh Chavan', 'Lata Chavan', '2001-01-20', 'Hingoli', 'Male', '012345678345', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(16, 2, 5, 4, 'BA014', 'Priti Salunkhe', 'Kamal Salunkhe', '2001-02-14', 'Hingoli', 'Female', '456789012567', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(17, 2, 5, 4, 'BA015', 'Rajesh Gore', 'Shobha Gore', '2001-03-08', 'Hingoli', 'Male', '890123456678', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(18, 2, 6, 5, 'BSc001', 'Kunal Desai', 'Seema Desai', '2003-04-16', 'Hingoli', 'Male', '234567890890', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(19, 2, 6, 5, 'BSc002', 'Neha Iyer', 'Meera Iyer', '2003-05-22', 'Hingoli', 'Female', '678901234901', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(20, 2, 6, 5, 'BSc003', 'Ajay Kulkarni', 'Sharada Kulkarni', '2003-06-07', 'Hingoli', 'Male', '012345678012', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(21, 2, 6, 5, 'BSc004', 'Swati Joshi', 'Vandana Joshi', '2003-07-13', 'Hingoli', 'Female', '456789012123', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(22, 2, 6, 5, 'BSc005', 'Vivek Nair', 'Sujata Nair', '2003-08-19', 'Hingoli', 'Male', '890123456234', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(23, 2, 7, 5, 'BSc006', 'Rashmi Patel', 'Kiran Patel', '2002-09-25', 'Hingoli', 'Female', '234567890345', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(24, 2, 7, 5, 'BSc007', 'Nitin Shah', 'Usha Shah', '2002-10-31', 'Hingoli', 'Male', '678901234456', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(25, 2, 7, 5, 'BSc008', 'Shilpa Reddy', 'Anita Reddy', '2002-11-15', 'Hingoli', 'Female', '012345678567', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(26, 2, 7, 5, 'BSc009', 'Manoj Kumar', 'Sunita Kumar', '2002-12-20', 'Hingoli', 'Male', '456789012678', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(27, 2, 7, 5, 'BSc010', 'Kavita Sharma', 'Vimala Sharma', '2002-01-05', 'Hingoli', 'Female', '890123456789', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(28, 2, 8, 5, 'BSc011', 'Santosh Pillai', 'Sudha Pillai', '2001-02-10', 'Hingoli', 'Male', '234567890901', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(29, 2, 8, 5, 'BSc012', 'Archana Mishra', 'Madhuri Mishra', '2001-03-16', 'Hingoli', 'Female', '678901234012', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(30, 2, 8, 5, 'BSc013', 'Deepak Roy', 'Mamta Roy', '2001-04-22', 'Hingoli', 'Male', '012345678123', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(31, 2, 8, 5, 'BSc014', 'Poonam Das', 'Krishna Das', '2001-05-28', 'Hingoli', 'Female', '456789012234', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(32, 2, 8, 5, 'BSc015', 'Harish Chandra', 'Laxmi Chandra', '2001-06-12', 'Hingoli', 'Male', '890123456345', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(33, 2, 9, 6, 'BCom001', 'Vinod Agarwal', 'Pushpa Agarwal', '2003-07-18', 'Hingoli', 'Male', '234567890456', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(34, 2, 9, 6, 'BCom002', 'Maya Jain', 'Chaya Jain', '2003-08-24', 'Hingoli', 'Female', '678901234567', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(35, 2, 9, 6, 'BCom003', 'Suresh Mehta', 'Kiran Mehta', '2003-09-30', 'Hingoli', 'Male', '012345678678', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(36, 2, 9, 6, 'BCom004', 'Geeta Parekh', 'Leela Parekh', '2003-10-06', 'Hingoli', 'Female', '456789012789', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(37, 2, 9, 6, 'BCom005', 'Ramesh Thakkar', 'Naina Thakkar', '2003-11-12', 'Hingoli', 'Male', '890123456890', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(38, 2, 10, 6, 'BCom006', 'Sneha Shah', 'Anita Shah', '2002-12-18', 'Hingoli', 'Female', '234567890001', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(39, 2, 10, 6, 'BCom007', 'Anil Vora', 'Madhuri Vora', '2002-01-24', 'Hingoli', 'Male', '678901234112', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(40, 2, 10, 6, 'BCom008', 'Kavita Desai', 'Jyoti Desai', '2002-02-28', 'Hingoli', 'Female', '012345678223', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(41, 2, 10, 6, 'BCom009', 'Sunil Gandhi', 'Kusum Gandhi', '2002-03-14', 'Hingoli', 'Male', '456789012334', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(42, 2, 10, 6, 'BCom010', 'Priti Patel', 'Rekha Patel', '2002-04-20', 'Hingoli', 'Female', '890123456445', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(43, 2, 11, 6, 'BCom011', 'Rajiv Malhotra', 'Sharda Malhotra', '2001-05-26', 'Hingoli', 'Male', '234567890556', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(44, 2, 11, 6, 'BCom012', 'Anjali Gupta', 'Sudha Gupta', '2001-06-10', 'Hingoli', 'Female', '678901234667', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(45, 2, 11, 6, 'BCom013', 'Vikram Singh', 'Kiran Singh', '2001-07-16', 'Hingoli', 'Male', '012345678778', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(46, 2, 11, 6, 'BCom014', 'Shweta Choudhary', 'Manju Choudhary', '2001-08-22', 'Hingoli', 'Female', '456789012889', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(47, 2, 11, 6, 'BCom015', 'Maheshwari Kumar', 'Lata Kumar', '2001-09-28', 'Hingoli', 'Male', '890123456990', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(48, 2, 3, 4, 'BA016', 'Ankush Dange', 'Ratna Dange', '2003-10-05', 'Hingoli', 'Male', '345678901234', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active'),
(49, 2, 6, 5, 'BSc016', 'Aarti Shukla', 'Saroj Shukla', '2003-11-11', 'Hingoli', 'Female', '789012345678', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Shivaji High School, Hingoli"}', '2023-07-01', 'active'),
(50, 2, 9, 6, 'BCom016', 'Atul Bhandari', 'Suman Bhandari', '2003-12-17', 'Hingoli', 'Male', '123456789012', 'OBC', 'Reserved', 'Hindu', 'Marathi', '{"school":"Modern High School, Hingoli"}', '2023-07-01', 'active'),
(51, 2, 4, 4, 'BA017', 'Sakshi Rane', 'Madhuri Rane', '2002-01-23', 'Hingoli', 'Female', '567890123456', 'General', 'Open', 'Hindu', 'Marathi', '{"school":"Government Higher Secondary School, Hingoli"}', '2023-07-01', 'active'),
(52, 2, 7, 5, 'BSc017', 'Dinesh More', 'Shobha More', '2002-02-28', 'Hingoli', 'Male', '901234567890', 'SC', 'Reserved', 'Hindu', 'Marathi', '{"school":"New English Medium School, Hingoli"}', '2023-07-01', 'active');

-- Add demo academic years
INSERT IGNORE INTO academic_years (id, institute_id, year_name, start_date, end_date, is_active)
VALUES 
(1, 1, '2025-2026', '2025-04-01', '2026-03-31', TRUE),
(2, 2, '2025-2026', '2025-06-01', '2026-04-30', TRUE);

-- Add demo module settings
INSERT IGNORE INTO module_settings (institute_id, settings)
VALUES 
(1, '{"attendance":true,"exams":true,"finance":true}'),
(2, '{"attendance":true,"exams":true,"finance":true}');

-- Add demo class_subjects
INSERT IGNORE INTO class_subjects (id, class_id, subject_id)
VALUES 
(1, 1, 1), (2, 1, 2), (3, 2, 3),
-- Class subjects for Late Baburao Patil College
(4, 3, 4), (5, 3, 5), (6, 4, 6),
(7, 5, 4), (8, 6, 7), (9, 6, 8),
(10, 7, 7), (11, 8, 8), (12, 9, 9),
(13, 9, 10), (14, 10, 9), (15, 11, 10);

-- Add demo fee_types
INSERT IGNORE INTO fee_types (id, institute_id, fee_name, description, default_amount)
VALUES 
(1, 1, 'Tuition', 'Tuition Fee', 10000),
(2, 1, 'Exam', 'Exam Fee', 2000),
-- Fee types for Late Baburao Patil College
(3, 2, 'Tuition Fee', 'Annual tuition charges', 15000),
(4, 2, 'Examination Fee', 'Semester exam charges', 3000),
(5, 2, 'Library Fee', 'Library access charges', 1000),
(6, 2, 'Laboratory Fee', 'Lab usage charges', 2000);

-- Add demo class_fees
INSERT IGNORE INTO class_fees (id, institute_id, class_id, fee_type_id, amount)
VALUES 
(1, 1, 1, 1, 10000),
(2, 1, 2, 2, 2000),
-- Class fees for Late Baburao Patil College
(3, 2, 3, 3, 15000),
(4, 2, 3, 4, 3000),
(5, 2, 4, 3, 15000),
(6, 2, 4, 4, 3000),
(7, 2, 5, 3, 15000),
(8, 2, 5, 4, 3000),
(9, 2, 6, 3, 18000),
(10, 2, 6, 4, 3000),
(11, 2, 6, 5, 1000),
(12, 2, 6, 6, 2000);

-- Add demo fee groups
INSERT IGNORE INTO fee_groups (id, institute_id, group_name, description)
VALUES 
(1, 1, 'Annual Fees', 'Yearly school fees'),
(2, 1, 'Exam Fees', 'Fees for exams'),
-- Fee groups for Late Baburao Patil College
(3, 2, 'Annual Tuition Fees', 'Yearly academic charges'),
(4, 2, 'Exam & Library Fees', 'Semester examination and library charges');

-- Add demo class_fee_groups
INSERT IGNORE INTO class_fee_groups (id, class_id, fee_group_id)
VALUES 
(1, 1, 1), (2, 2, 2),
-- Class fee groups for Late Baburao Patil College
(3, 3, 3), (4, 3, 4),
(5, 4, 3), (6, 4, 4),
(7, 5, 3), (8, 5, 4),
(9, 6, 3), (10, 6, 4);

-- Add demo fee_group_items
INSERT IGNORE INTO fee_group_items (id, fee_group_id, fee_type_id, amount)
VALUES 
(1, 1, 1, 10000), (2, 2, 2, 2000),
-- Fee group items for Late Baburao Patil College
(3, 3, 3, 15000), (4, 4, 4, 3000),
(5, 4, 5, 1000), (6, 3, 6, 2000);

-- Add demo expenses
INSERT IGNORE INTO expense_categories (id, institute_id, category_name, description)
VALUES 
(1, 1, 'Stationery', 'Stationery items'),
(2, 1, 'Maintenance', 'Building maintenance'),
-- Expense categories for Late Baburao Patil College
(3, 2, 'Infrastructure', 'Building and facilities maintenance'),
(4, 2, 'Academic Supplies', 'Books and teaching materials');

INSERT IGNORE INTO expenses (id, institute_id, category_id, amount, expense_date, description, vendor, created_by)
VALUES 
(1, 1, 1, 500, '2025-07-01', 'Notebooks', 'ABC Stationers', 1),
(2, 1, 2, 2000, '2025-08-01', 'Repairs', 'XYZ Maintainers', 1),
-- Expenses for Late Baburao Patil College
(3, 2, 3, 15000, '2025-06-15', 'Classroom renovation', 'Hingoli Construction', 2),
(4, 2, 4, 8000, '2025-07-10', 'Library books', 'Academic Publishers', 2);

-- Add demo general ledger
INSERT IGNORE INTO general_ledger (id, institute_id, transaction_date, account, description, debit, credit, transaction_type, reference_id)
VALUES 
(1, 1, '2025-07-01', 'Cash', 'Opening balance', 10000, NULL, 'opening', NULL),
(2, 1, '2025-08-01', 'Bank', 'Deposit', NULL, 5000, 'deposit', NULL),
-- General ledger entries for Late Baburao Patil College
(3, 2, '2025-06-01', 'Bank', 'Opening balance', 500000, NULL, 'opening', NULL),
(4, 2, '2025-06-15', 'Infrastructure Expense', 'Classroom renovation', 15000, NULL, 'expense', 3);

-- Add demo generated documents
INSERT IGNORE INTO generated_documents (id, institute_id, student_id, document_type, sequence_number, generated_by, document_data)
VALUES 
(1, 1, 1, 'Bonafide', 'BON-001', 1, '{"issued":"2025-09-01"}'),
-- Generated documents for Late Baburao Patil College
(2, 2, 3, 'Bonafide', 'BON-HP-001', 2, '{"issued":"2025-09-01"}'),
(3, 2, 4, 'Marksheet', 'MARKS-HP-001', 2, '{"issued":"2025-08-15","semester":"First"}');

-- Add demo grade settings
INSERT IGNORE INTO grade_settings (id, institute_id, grade_name, min_percentage, max_percentage, description)
VALUES 
(1, 1, 'A', 90, 100, 'Excellent'),
(2, 1, 'B', 75, 89, 'Good'),
-- Grade settings for Late Baburao Patil College
(3, 2, 'O', 85, 100, 'Outstanding'),
(4, 2, 'A+', 75, 84, 'Excellent'),
(5, 2, 'A', 65, 74, 'Very Good'),
(6, 2, 'B+', 55, 64, 'Good');

-- Add demo online exam question bank
INSERT IGNORE INTO online_exam_question_bank (id, institute_id, subject_id, question_text, question_type, options, marks, created_by)
VALUES 
(1, 1, 1, 'What is 2+2?', 'mcq', '["2","3","4","5"]', 2, 1),
-- Online exam question bank for Late Baburao Patil College
(2, 2, 7, 'What is HTML?', 'mcq', '["Programming Language","Markup Language","Scripting Language","None of these"]', 3, 2),
(3, 2, 9, 'What is double entry accounting?', 'short_answer', NULL, 5, 2);

-- Add demo online exams
INSERT IGNORE INTO online_exams (id, institute_id, class_id, subject_id, title, description, scheduled_start_time, duration_minutes, total_marks, status)
VALUES 
(1, 1, 1, 1, 'Maths Test', 'Basic math test', '2025-09-10 10:00:00', 60, 20, 'upcoming'),
-- Online exams for Late Baburao Patil College
(2, 2, 6, 7, 'Computer Science Quiz', 'Basic computer science concepts', '2025-09-15 11:00:00', 45, 30, 'upcoming'),
(3, 2, 9, 9, 'Accounting Fundamentals', 'Basic accounting principles', '2025-09-20 14:00:00', 60, 50, 'upcoming');

-- Add demo online exam questions
INSERT IGNORE INTO online_exam_questions (id, exam_id, question_id)
VALUES 
(1, 1, 1),
-- Online exam questions for Late Baburao Patil College
(2, 2, 2),
(3, 3, 3);

-- Add demo student online exams
INSERT IGNORE INTO student_online_exams (id, student_id, exam_id, status, started_at, completed_at, score)
VALUES 
(1, 1, 1, 'completed', '2025-09-10 10:00:00', '2025-09-10 11:00:00', 18),
-- Student online exams for Late Baburao Patil College
(2, 18, 2, 'not_started', NULL, NULL, NULL),
(3, 33, 3, 'not_started', NULL, NULL, NULL);

-- Add demo student exam answers
INSERT IGNORE INTO student_exam_answers (id, student_exam_id, question_id, answer_text, selected_option_index, is_correct, marks_awarded)
VALUES 
(1, 1, 1, '4', 2, TRUE, 2);

-- Add demo attendance
INSERT IGNORE INTO attendance (id, student_id, class_id, institute_id, date, status)
VALUES 
(1, 1, 1, 1, '2025-09-01', 'present'),
(2, 2, 2, 1, '2025-09-01', 'absent'),
-- Attendance for Late Baburao Patil College students
(3, 3, 3, 2, '2025-09-01', 'present'),
(4, 4, 3, 2, '2025-09-01', 'present'),
(5, 5, 3, 2, '2025-09-01', 'absent'),
(6, 18, 6, 2, '2025-09-01', 'present'),
(7, 33, 9, 2, '2025-09-01', 'present');

-- Add demo fee bills and transactions
INSERT IGNORE INTO fee_bills (id, student_id, institute_id, bill_name, total_amount, paid_amount, status)
VALUES 
(1, 1, 1, 'Annual Fees 2025', 12000, 12000, 'paid'),
(2, 2, 1, 'Annual Fees 2025', 12000, 6000, 'unpaid'),
-- Fee bills for Late Baburao Patil College students
(3, 3, 2, 'First Year BA Fees 2025-26', 22000, 22000, 'paid'),
(4, 4, 2, 'First Year BA Fees 2025-26', 22000, 11000, 'partially_paid'),
(5, 18, 2, 'First Year BSc Fees 2025-26', 24000, 24000, 'paid'),
(6, 33, 2, 'First Year BCom Fees 2025-26', 21000, 21000, 'paid');

INSERT IGNORE INTO fee_transactions (id, student_id, institute_id, fee_bill_id, amount_paid, payment_mode, payment_date)
VALUES 
(1, 1, 1, 1, 12000, 'Cash', '2025-06-10'),
(2, 2, 1, 2, 6000, 'UPI', '2025-06-15'),
-- Fee transactions for Late Baburao Patil College students
(3, 3, 2, 3, 22000, 'Bank Transfer', '2025-07-05'),
(4, 4, 2, 4, 11000, 'UPI', '2025-07-10'),
(5, 18, 2, 5, 24000, 'Bank Transfer', '2025-07-05'),
(6, 33, 2, 6, 21000, 'UPI', '2025-07-08');

-- Seed data for website_content
INSERT IGNORE INTO website_content (id, institute_id, page, section, content)
VALUES 
(1, 1, 'home', 'main', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Welcome to Demo Institute"}]}]}'),
-- Website content for Late Baburao Patil College
(2, 2, 'home', 'main', '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Late Baburao Patil Arts & Science College, Hingoli"}]},{"type":"paragraph","content":[{"type":"text","text":"Founded in 1965, Late Baburao Patil Arts & Science College is a premier educational institution in Hingoli district. We are committed to providing quality higher education in Arts, Science, and Commerce streams."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"About Us"}]},{"type":"paragraph","content":[{"type":"text","text":"Late Baburao Patil Arts & Science College, Hingoli was established with the aim of providing higher education opportunities to the rural youth of the region. Over the years, the college has grown into a center of academic excellence, offering undergraduate courses in Arts, Science, and Commerce."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Our Vision"}]},{"type":"paragraph","content":[{"type":"text","text":"To create a transformative educational environment that fosters intellectual curiosity, critical thinking, and social responsibility, preparing students to become ethical leaders and contributors to society."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Our Mission"}]},{"type":"paragraph","content":[{"type":"text","text":"To provide accessible, high-quality education that empowers students to reach their full potential, promotes research and innovation, and contributes to the socio-economic development of the region."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Courses Offered"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Bachelor of Arts (BA)"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Bachelor of Science (BSc)"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Bachelor of Commerce (BCom)"}]}]}]}]}'),
(3, 2, 'about', 'main', '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"About Our College"}]},{"type":"paragraph","content":[{"type":"text","text":"Late Baburao Patil Arts & Science College has a rich history spanning over five decades of educational excellence. Founded in 1965, the college has been instrumental in shaping the academic landscape of Hingoli district."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"History"}]},{"type":"paragraph","content":[{"type":"text","text":"The college was established in 1965 by the visionary educationist Late Baburao Patil with the support of local philanthropists. Starting with just a few hundred students and a handful of faculty members, the college has grown exponentially over the years."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Infrastructure"}]},{"type":"paragraph","content":[{"type":"text","text":"The college campus spans over 10 acres and includes well-equipped classrooms, laboratories, a library with over 50,000 books, computer centers, sports facilities, and hostels for boys and girls."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Faculty"}]},{"type":"paragraph","content":[{"type":"text","text":"Our college boasts a team of highly qualified and experienced faculty members who are dedicated to providing quality education and mentoring students to achieve their academic and personal goals."}]}]}'),
(4, 2, 'admissions', 'main', '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Admissions"}]},{"type":"paragraph","content":[{"type":"text","text":"Admissions to Late Baburao Patil Arts & Science College are open for the academic year 2025-26. We offer undergraduate courses in Arts, Science, and Commerce streams."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Eligibility Criteria"}]},{"type":"paragraph","content":[{"type":"text","text":"For admission to any undergraduate course, candidates must have passed the 12th standard examination from a recognized board with the required percentage as per the university norms."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Admission Process"}]},{"type":"paragraph","content":[{"type":"text","text":"1. Online application through the college website\n2. Document verification\n3. Merit list publication\n4. Payment of fees\n5. Commencement of classes"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Important Dates"}]},{"type":"paragraph","content":[{"type":"text","text":"- Start of online application: June 1, 2025\n- Last date for submission: June 30, 2025\n- Merit list publication: July 10, 2025\n- Commencement of classes: July 15, 2025"}]}]}'),
(5, 2, 'contact', 'main', '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Contact Us"}]},{"type":"paragraph","content":[{"type":"text","text":"Late Baburao Patil Arts & Science College\nCollege Road, Hingoli\nMaharashtra 431513\nPhone: +91-2457-222001\nEmail: info@lpbasc.ac.in\nWebsite: www.lpbasc.ac.in"}]}]}');

-- Seed data for website_team
INSERT IGNORE INTO website_team (id, institute_id, name, designation, image_url, sort_order)
VALUES 
(1, 1, 'Dr. Aarya Sharma', 'Principal', NULL, 1),
(2, 1, 'Mr. Raj Verma', 'Administrator', NULL, 2),
-- Website team for Late Baburao Patil College
(3, 2, 'Dr. Vijaykumar Patil', 'Principal', 'principal.jpg', 1),
(4, 2, 'Dr. Sunita Deshmukh', 'Vice Principal', 'vice_principal.jpg', 2),
(5, 2, 'Dr. Anil Jadhav', 'Head, Department of Arts', 'hod_arts.jpg', 3),
(6, 2, 'Dr. Pramod Shinde', 'Head, Department of Science', 'hod_science.jpg', 4),
(7, 2, 'Dr. Vandana Joshi', 'Head, Department of Commerce', 'hod_commerce.jpg', 5);

-- Seed data for website_gallery
INSERT IGNORE INTO website_gallery (id, institute_id, title, image_url)
VALUES 
(1, 1, 'Campus Life', NULL),
(2, 1, 'Graduation Day', NULL),
-- Website gallery for Late Baburao Patil College
(3, 2, 'College Building', 'college_building.jpg'),
(4, 2, 'Library', 'library.jpg'),
(5, 2, 'Science Laboratory', 'science_lab.jpg'),
(6, 2, 'Computer Laboratory', 'computer_lab.jpg'),
(7, 2, 'Classroom', 'classroom.jpg'),
(8, 2, 'Sports Ground', 'sports_ground.jpg'),
(9, 2, 'Annual Function', 'annual_function.jpg'),
(10, 2, 'Cultural Festival', 'cultural_festival.jpg'),
(11, 2, 'NSS Camp', 'nss_camp.jpg'),
(12, 2, 'Alumni Meet', 'alumni_meet.jpg');

-- Seed data for website_documents
INSERT IGNORE INTO website_documents (id, institute_id, title, category, file_url)
VALUES 
(1, 1, 'IQAC Report 2024', 'Reports', NULL),
(2, 1, 'Student Handbook', 'Guides', NULL),
-- Website documents for Late Baburao Patil College
(3, 2, 'Prospectus 2025-26', 'Admissions', 'prospectus_2025_26.pdf'),
(4, 2, 'Fee Structure 2025-26', 'Admissions', 'fee_structure_2025_26.pdf'),
(5, 2, 'Academic Calendar 2025-26', 'Academics', 'academic_calendar_2025_26.pdf'),
(6, 2, 'Student Handbook 2025-26', 'Students', 'student_handbook_2025_26.pdf'),
(7, 2, 'IQAC Report 2024-25', 'Reports', 'iqac_report_2024_25.pdf');

-- Seed data for website_events
INSERT IGNORE INTO website_events (id, institute_id, title, description, date, image_url)
VALUES 
(1, 1, 'Annual Day', 'Annual celebration', '2025-12-05', NULL),
(2, 1, 'Science Fair', 'Student exhibits', '2025-03-10', NULL),
-- Website events for Late Baburao Patil College
(3, 2, 'Freshers Day 2025', 'Welcome event for new students', '2025-07-20', 'freshers_day.jpg'),
(4, 2, 'Annual Cultural Festival', 'Inter-college cultural competition', '2025-10-15', 'cultural_festival.jpg'),
(5, 2, 'Sports Meet 2025', 'Annual sports competition', '2025-01-20', 'sports_meet.jpg'),
(6, 2, 'Science Exhibition', 'Student science projects and exhibits', '2025-02-10', 'science_exhibition.jpg');

-- Seed data for website_carousel
INSERT IGNORE INTO website_carousel (id, institute_id, title, image_url, sort_order)
VALUES 
(1, 1, 'Welcome Banner', NULL, 1),
-- Website carousel for Late Baburao Patil College
(2, 2, 'Welcome to Late Baburao Patil Arts & Science College', 'carousel1.jpg', 1),
(3, 2, 'Admissions Open 2025-26', 'carousel2.jpg', 2),
(4, 2, 'Academic Excellence Since 1965', 'carousel3.jpg', 3);

-- Seed data for roles and employees
INSERT IGNORE INTO roles (id, name) VALUES (1, 'Admin'), (2, 'Teacher'), (3, 'Accountant');

INSERT IGNORE INTO employees (id, institute_id, full_name, email, designation, role_id)
VALUES 
(1, 1, 'Ms. Kavita Rao', 'kavita@demoinstitute.edu', 'Teacher', 2),
(2, 1, 'Mr. Suresh Kumar', 'suresh@demoinstitute.edu', 'Accountant', 3),
-- Employees for Late Baburao Patil College
(3, 2, 'Dr. Vijaykumar Patil', 'principal@lpbasc.ac.in', 'Principal', 1),
(4, 2, 'Dr. Sunita Deshmukh', 'viceprincipal@lpbasc.ac.in', 'Vice Principal', 1),
(5, 2, 'Mr. Rajesh Shinde', 'accounts@lpbasc.ac.in', 'Accountant', 3),
(6, 2, 'Ms. Pooja Chavan', 'library@lpbasc.ac.in', 'Librarian', 2);
