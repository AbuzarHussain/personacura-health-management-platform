-- Test vaccine recommendations for bhoomik2@illinois.edu

-- Step 1: Find the patient
SELECT PatientID, Email, FirstName, LastName, DateOfBirth, Gender,
       TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE()) AS Age
FROM Patient
WHERE Email = 'bhoomik2@illinois.edu';

-- Step 2: Test with PatientID = 2 (assuming that's bhoomik2's ID)
CALL RecommendVaccines(2);

-- Step 3: Check sample vaccines to see what's in the Vaccination table
SELECT VaccineID, VaccineName, Type, RecommendedGender, MinAge, MaxAge
FROM Vaccination
ORDER BY Type DESC, MinAge ASC
LIMIT 10;
