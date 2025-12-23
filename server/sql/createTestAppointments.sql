-- Create test appointments for patient 151 (bhoomik2@illinois.edu)

-- First, check if patient 151 exists
SELECT PatientID, Email, FirstName, LastName FROM Patient WHERE PatientID = 151;

-- Check available doctors
SELECT DoctorID, FirstName, LastName, Specialization FROM Doctors LIMIT 5;

-- Insert a past appointment (for testing orange color)
INSERT INTO Appointments (PatientID, DoctorID, Date, Time, Reason, Status)
VALUES (151, 1, '2024-11-01', '10:00:00', 'Annual checkup', 'Completed');

-- Insert a future appointment (for testing green color)
INSERT INTO Appointments (PatientID, DoctorID, Date, Time, Reason, Status)
VALUES (151, 2, '2025-01-15', '14:00:00', 'Follow-up consultation', 'Scheduled');

-- Insert another future appointment
INSERT INTO Appointments (PatientID, DoctorID, Date, Time, Reason, Status)
VALUES (151, 1, '2025-02-20', '09:30:00', 'Routine examination', 'Scheduled');

-- Verify appointments were created
SELECT
    A.AppointmentID,
    A.Date,
    A.Time,
    A.Status,
    A.Reason,
    D.FirstName AS DoctorFirstName,
    D.LastName AS DoctorLastName
FROM Appointments A
LEFT JOIN Doctors D ON A.DoctorID = D.DoctorID
WHERE A.PatientID = 151
ORDER BY A.Date ASC;
