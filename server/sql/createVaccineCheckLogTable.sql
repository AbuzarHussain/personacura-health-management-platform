-- Create VaccineCheckLog table to store vaccine check results
CREATE TABLE IF NOT EXISTS VaccineCheckLog (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    PatientID INT NULL,
    Age INT NOT NULL,
    Gender VARCHAR(10) NOT NULL,
    ReceivedVaccines JSON,
    MandatoryVaccines JSON,
    OptionalVaccines JSON,
    CheckedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PatientID) REFERENCES Patient(PatientID) ON DELETE SET NULL
);


