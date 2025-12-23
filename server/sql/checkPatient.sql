-- Check patient bhoomik2's details
SELECT PatientID, Email, DateOfBirth, Gender, TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE()) AS Age
FROM Patient
WHERE Email = 'bhoomik2@illinois.edu';

-- Test the stored procedure with this patient's ID
-- First we need to get the PatientID, then we can test
CALL RecommendVaccines(2);

-- Show sample of Vaccination table to see age ranges
SELECT VaccineID, VaccineName, Type, RecommendedGender, MinAge, MaxAge
FROM Vaccination
ORDER BY Type DESC, MinAge ASC
LIMIT 20;
