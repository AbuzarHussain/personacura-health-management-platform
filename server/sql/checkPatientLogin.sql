-- Check if patient abigail.mitchell19@example.com exists and get password
SELECT PatientID, Email, Password, FirstName, LastName
FROM Patient
WHERE Email = 'abigail.mitchell19@example.com';

-- Check all patients to see available test accounts
SELECT PatientID, Email, Password, FirstName, LastName
FROM Patient
ORDER BY PatientID
LIMIT 10;
