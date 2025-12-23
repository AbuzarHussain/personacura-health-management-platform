const { getDB } = require("../utils/initiateDBConnection")

const createFeedback = async (req, res) => {
    try {
        const { Rating, Review, PatientID, DoctorID } = req.body || {}

        if (!PatientID || !DoctorID || !Rating) {
            return res.status(400).json({ message: "PatientID, DoctorID and Rating are required" })
        }

        const feedbackId = `FB-${Date.now()}`
        const feedbackDate = new Date()
        const db = getDB()

        const insertSql = `
            INSERT INTO Feedback (FeedbackID, Rating, Review, Date, PatientID, DoctorID)
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
        return res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = createFeedback

