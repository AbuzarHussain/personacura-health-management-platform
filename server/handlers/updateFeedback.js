const { getDB } = require("../utils/initiateDBConnection")

const updateFeedback = async (req, res) => {
    try {
        const { Rating, Review, PatientID, DoctorID } = req.body || {}

        if (!PatientID || !DoctorID || !Rating) {
            return res.status(400).json({ message: "PatientID, DoctorID, and Rating are required" })
        }

        const db = getDB()

        const randomNum = Math.floor(100000 + Math.random() * 900000)
        const feedbackId = `FB${randomNum}`

        const feedbackDate = new Date().toISOString().slice(0, 10)

        const insertSql = `
            INSERT INTO Feedback 
            (FeedbackID, Rating, Review, Date, PatientID, DoctorID)
            VALUES (?, ?, ?, ?, ?, ?)
        `
        
        await db.query(insertSql, [
            feedbackId,
            Rating,
            Review || null, 
            feedbackDate,
            PatientID,
            DoctorID
        ])

        console.log("Success: Feedback inserted into DB with ID:", feedbackId)

        return res.status(201).json({
            message: "Feedback submitted successfully",
            feedback: {
                FeedbackID: feedbackId,
                Rating,
                Review,
                Date: feedbackDate,
                PatientID,
                DoctorID
            }
        })

    } catch (error) {
        console.error("Error creating feedback:", error)
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(500).json({ message: "ID collision, please try again." })
        }
        return res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = updateFeedback