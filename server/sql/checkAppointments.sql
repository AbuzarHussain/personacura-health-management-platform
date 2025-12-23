-- Check appointments for patient 151
SELECT * FROM Appointments WHERE PatientID = 151;

-- Check all patients with appointments
SELECT DISTINCT PatientID FROM Appointments ORDER BY PatientID;

-- Check patient 151 details
SELECT PatientID, Email, FirstName, LastName FROM Patient WHERE PatientID = 151;
