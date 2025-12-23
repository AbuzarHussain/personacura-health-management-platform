-- Test vaccine recommendations for bhoomik2@illinois.edu

-- Step 1: Get patient info
SELECT
    PatientID,
    Email,
    DateOfBirth,
    Gender,
    TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE()) AS Age
FROM Patient
WHERE Email = 'bhoomik2@illinois.edu';

-- Step 2: Run the stored procedure with the patient ID
-- (Replace the number below with the PatientID from Step 1)
CALL RecommendVaccines(2);

-- Step 3: Check if there are any vaccines matching the patient's age and gender
-- This shows what vaccines COULD match if we know the patient's age and gender
SELECT
    v.VaccineID,
    v.VaccineName,
    v.Type,
    v.RecommendedGender,
    v.MinAge,
    v.MaxAge
FROM Vaccination v
WHERE v.RecommendedGender = 'Male'  -- Change this based on patient's gender
  AND 20 >= v.MinAge                 -- Change this based on patient's age
  AND 20 <= v.MaxAge                 -- Change this based on patient's age
ORDER BY v.Type DESC, v.VaccineName ASC;
