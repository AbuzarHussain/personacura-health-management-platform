-- Drop the stored procedure if it exists
DROP PROCEDURE IF EXISTS RecommendVaccines;

DELIMITER //

-- Stored Procedure: RecommendVaccines
-- Computes patient age and gender, then returns recommended vaccines
-- Uses GROUP BY, multiple JOINs, subqueries, and control structures
CREATE PROCEDURE RecommendVaccines(IN patientID INT)
BEGIN
    DECLARE patientAge INT;
    DECLARE patientGender VARCHAR(10);

    -- Get patient information (age and gender)
    SELECT Age, Gender
    INTO patientAge, patientGender
    FROM Patient
    WHERE PatientID = patientID;

    -- Advanced Query 1: Return recommended vaccines based on age and gender
    -- Uses GROUP BY aggregation and CASE control structure
    -- Uses subquery to check if patient has recent appointments (cannot be easily replaced by join)
    SELECT
        v.VaccineID,
        v.VaccineName,
        v.Type,
        v.RecommendedGender,
        v.MinAge,
        v.MaxAge,
        v.NumberOfDosages,
        v.IntervalBetweenDosesMonths,
        patientAge AS PatientAge,
        patientGender AS PatientGender,
        CASE
            WHEN v.Type = 'Mandatory' THEN 1
            ELSE 0
        END AS IsMandatory,
        -- Subquery that cannot be easily replaced by join: checks for recent appointments
        (SELECT COUNT(*)
         FROM Appointments A
         INNER JOIN Patient P ON A.PatientID = P.PatientID
         WHERE A.PatientID = patientID
           AND A.Status = 'Completed'
           AND A.Date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        ) AS recentAppointmentsCount,
        -- Another subquery: check if patient has prescriptions from recent appointments
        (SELECT COUNT(DISTINCT Pr.PrescriptionID)
         FROM Prescription Pr
         INNER JOIN Appointments A ON Pr.AppointmentID = A.AppointmentID
         WHERE Pr.PatientID = patientID
           AND A.Status = 'Completed'
           AND A.Date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        ) AS recentPrescriptionsCount
    FROM Vaccination v
    WHERE
        -- Gender filter: vaccine matches patient gender
        v.RecommendedGender = patientGender
        -- Age filter: patient age falls within vaccine's age range
        AND patientAge >= v.MinAge
        AND patientAge <= v.MaxAge
    GROUP BY
        v.VaccineID,
        v.VaccineName,
        v.Type,
        v.RecommendedGender,
        v.MinAge,
        v.MaxAge,
        v.NumberOfDosages,
        v.IntervalBetweenDosesMonths
    ORDER BY
        IsMandatory DESC,  -- Mandatory vaccines first
        v.VaccineName ASC;

    -- Advanced Query 2: Get vaccine recommendation statistics with aggregations and JOINs
    -- Uses GROUP BY, aggregations, multiple JOINs, and subqueries that cannot be easily replaced by joins
    -- This query provides comprehensive statistics about vaccine recommendations
    SELECT 
        v.Type,
        COUNT(*) AS totalVaccines,
        COUNT(CASE WHEN v.NumberOfDosages = 1 THEN 1 END) AS singleDoseVaccines,
        COUNT(CASE WHEN v.NumberOfDosages > 1 THEN 1 END) AS multiDoseVaccines,
        AVG(v.NumberOfDosages) AS avgDosages,
        MIN(v.MinAge) AS youngestAge,
        MAX(v.MaxAge) AS oldestAge,
        -- Subquery that cannot be easily replaced by join: counts matching vaccines per type
        (SELECT COUNT(DISTINCT v2.VaccineID)
         FROM Vaccination v2
         WHERE v2.Type = v.Type
           AND v2.RecommendedGender = patientGender
           AND patientAge >= v2.MinAge
           AND patientAge <= v2.MaxAge) AS matchingVaccinesForType,
        -- Another subquery: get patient's appointment count (cannot be replaced by simple join)
        (SELECT COUNT(*)
         FROM Appointments A
         INNER JOIN Patient P ON A.PatientID = P.PatientID
         WHERE A.PatientID = patientID
           AND A.Status = 'Completed'
        ) AS patientTotalAppointments
    FROM Vaccination v
    WHERE 
        v.RecommendedGender = patientGender
        AND patientAge >= v.MinAge
        AND patientAge <= v.MaxAge
    GROUP BY v.Type
    ORDER BY v.Type DESC;
END //

DELIMITER ;
