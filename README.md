# Personacura

Personacura is a cloud-deployed, full-stack healthcare management platform that enables
patients and doctors to manage appointments, digital prescriptions, vaccination records,
and medical history in a unified system.

The platform integrates intelligent features such as symptom-based disease prediction,
personalized vaccination recommendations, and an interactive health timeline
visualization to support proactive healthcare management.

## Key Features

### Patient Features
- Book, reschedule, and cancel medical appointments
- View prescriptions, vaccination records, and medical history
- Symptom checker with disease prediction and doctor/department recommendations
- Personalized vaccination suggestions based on age and gender
- Interactive health timeline visualization

### Doctor Features
- Manage patient appointments through a dashboard
- Create and update prescriptions
- Access drug and chemical side-effect reference data
- View patient medical history and vaccination status

## Local Setup

### Prerequisites
- Node.js (v18+)
- MySQL (v8+)
- npm (v9+)

### Create a `.env` file in the project root directory with the following variables:

```env
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=your_db_port
```

### Client Setup
```
cd client
npm install
npm run build
```

### Server Setup
From the root project directory: 
```
npm install
npm run start
```
