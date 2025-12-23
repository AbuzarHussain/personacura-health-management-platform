const { getDB } = require("../utils/initiateDBConnection")

const getMessage = async (req, res) => {
    try {
        const db = getDB()
        const [rows] = await db.query("select * from Doctors limit 5");
        res.json({ message: rows })
    } catch (error) {
        console.error("An error occurred while executing the query:", error);
        res.status(500).json({ message: "DB query failed" });
    }
}

module.exports = getMessage