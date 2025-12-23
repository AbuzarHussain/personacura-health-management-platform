-- Create AppointmentAuditLog table to track appointment status changes
-- This table will store audit logs when appointments are marked as completed

CREATE TABLE IF NOT EXISTS AppointmentAuditLog (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    AppointmentID INT NOT NULL,
    DoctorID INT NOT NULL,
    PatientID INT NOT NULL,
    OldStatus VARCHAR(20),
    NewStatus VARCHAR(20) NOT NULL,
    ChangedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Notes VARCHAR(255),
    FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID) ON DELETE CASCADE,
    FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID) ON DELETE CASCADE,
    FOREIGN KEY (PatientID) REFERENCES Patient(PatientID) ON DELETE CASCADE
);

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS log_appointment_completion;

DELIMITER //

-- Trigger: log_appointment_completion
-- Fires AFTER UPDATE on Appointments table
-- Automatically logs when an appointment status changes to 'Completed'
CREATE TRIGGER log_appointment_completion
AFTER UPDATE ON Appointments
FOR EACH ROW
BEGIN
    -- Only log when status changes to 'Completed'
    IF NEW.Status = 'Completed' AND (OLD.Status IS NULL OR OLD.Status != 'Completed') THEN
        INSERT INTO AppointmentAuditLog (
            AppointmentID,
            DoctorID,
            PatientID,
            OldStatus,
            NewStatus,
            ChangedAt,
            Notes
        ) VALUES (
            NEW.AppointmentID,
            NEW.DoctorID,
            NEW.PatientID,
            OLD.Status,
            NEW.Status,
            NOW(),
            CONCAT('Appointment completed on ', NEW.Date, ' at ', NEW.Time, '. Reason: ', COALESCE(NEW.Reason, 'N/A'))
        );
    END IF;
END //

DELIMITER ;


