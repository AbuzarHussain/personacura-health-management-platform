-- Add UNIQUE and CHECK constraints to enhance data integrity
-- This script adds attribute-level constraints and UNIQUE constraints

-- UNIQUE constraints
-- Ensure email addresses are unique for patients
ALTER TABLE Patient 
ADD CONSTRAINT uk_patient_email UNIQUE (Email);

-- Ensure usernames are unique for patients
ALTER TABLE Patient 
ADD CONSTRAINT uk_patient_username UNIQUE (UserName);

-- Ensure email addresses are unique for doctors
ALTER TABLE Doctors 
ADD CONSTRAINT uk_doctor_email UNIQUE (Email);

-- Attribute-level CHECK constraints

-- Ensure appointment status is one of the valid values
ALTER TABLE Appointments 
ADD CONSTRAINT chk_status CHECK (Status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show'));

-- Ensure email format is valid (contains @ and at least one dot after @)
ALTER TABLE Patient 
ADD CONSTRAINT chk_email_format CHECK (Email LIKE '%@%.%');


