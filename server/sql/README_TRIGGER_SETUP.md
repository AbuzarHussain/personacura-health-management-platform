# Appointment Audit Log Trigger Setup

## Overview
This trigger automatically logs when appointments are marked as "Completed" by doctors. It creates an audit trail in the `AppointmentAuditLog` table.

## Setup Instructions

### Step 1: Run the SQL Script
Execute the SQL script to create the audit table and trigger:

```bash
mysql -u [your_username] -p [your_database_name] < server/sql/createAppointmentAuditTrigger.sql
```

Or manually run the SQL commands in your MySQL client:
1. Open `server/sql/createAppointmentAuditTrigger.sql`
2. Copy and paste the contents into your MySQL client
3. Execute the script

### Step 2: Verify the Trigger
Check that the trigger was created successfully:

```sql
SHOW TRIGGERS LIKE 'log_appointment_completion';
```

### Step 3: Test the Trigger
1. Mark an appointment as "Completed" through the doctor dashboard
2. Check the audit log:
   ```sql
   SELECT * FROM AppointmentAuditLog ORDER BY ChangedAt DESC LIMIT 5;
   ```
3. Or view it through the frontend at: `/doctor/audit-logs`

## How It Works

1. **Trigger**: `log_appointment_completion`
   - Fires: `AFTER UPDATE` on `Appointments` table
   - Condition: Only logs when status changes to 'Completed'
   - Action: Inserts a record into `AppointmentAuditLog` table

2. **Automatic Execution**: 
   - When a doctor clicks "Mark as Completed" button
   - The `updateAppointmentStatus` handler updates the appointment
   - The trigger automatically fires and creates the audit log
   - No additional code needed!

3. **Frontend Access**:
   - Navigate to "Audit Logs" in the doctor sidebar
   - View all completion logs with patient details and timestamps

## Database Schema

### AppointmentAuditLog Table
- `LogID`: Primary key (auto-increment)
- `AppointmentID`: Foreign key to Appointments
- `DoctorID`: Foreign key to Doctors
- `PatientID`: Foreign key to Patient
- `OldStatus`: Previous status (e.g., "Scheduled")
- `NewStatus`: New status (always "Completed" for this trigger)
- `ChangedAt`: Timestamp when the change occurred
- `Notes`: Additional information about the appointment

## Benefits

✅ **Automatic**: No code changes needed - trigger fires automatically  
✅ **Audit Trail**: Complete history of when appointments were completed  
✅ **Accessible**: View logs through the frontend interface  
✅ **Demonstrates Triggers**: Shows database-level automation  


