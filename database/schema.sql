-- Baaz Grammar School ERP - Supabase Database Schema
-- SQL definitions for all tables used in the system

-- Students Table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    class_id UUID NOT NULL REFERENCES classes(id),
    admission_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Classes Table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name VARCHAR(50) NOT NULL,
    grade_level INT NOT NULL,
    total_seats INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    attendance_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('present', 'absent', 'leave', 'half-day')),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, attendance_date)
);

-- Fees Table
CREATE TABLE fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    fee_month VARCHAR(20) NOT NULL,
    fee_year INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'partial', 'waived')),
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    fee_id UUID REFERENCES fees(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Academic Records Table
CREATE TABLE academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    exam_type VARCHAR(50),
    marks DECIMAL(5, 2),
    total_marks INT DEFAULT 100,
    grade VARCHAR(2),
    percentage DECIMAL(5, 2),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subjects Table
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    class_id UUID REFERENCES classes(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Staff Table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    date_of_joining DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Staff Attendance Table
CREATE TABLE staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id),
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(staff_id, attendance_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_fees_student ON fees(student_id);
CREATE INDEX idx_fees_status ON fees(status);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_academic_student ON academic_records(student_id);
CREATE INDEX idx_staff_status ON staff(status);

-- Sample queries for common operations
-- Get all students in a class
-- SELECT * FROM students WHERE class_id = 'class-uuid' AND status = 'active';

-- Get attendance percentage for a student
-- SELECT student_id, 
--        COUNT(*) FILTER (WHERE status = 'present') * 100.0 / COUNT(*) as percentage
-- FROM attendance
-- WHERE student_id = 'student-uuid'
-- GROUP BY student_id;

-- Get outstanding fees
-- SELECT s.id, s.roll_number, s.first_name, SUM(f.amount) as total_due
-- FROM students s
-- JOIN fees f ON s.id = f.student_id
-- WHERE f.status IN ('pending', 'partial')
-- GROUP BY s.id;
