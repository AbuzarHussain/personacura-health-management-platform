const mysql = require("mysql2/promise")

let dbPool

const initDB = async () => {
    try {
        const databaseHost = process.env.DB_HOST
        const databasePort = process.env.DB_PORT || 3306
        const databaseUser = process.env.DB_USER
        const databasePassword = process.env.DB_PASS
        const databaseName = process.env.DB_NAME
        const databaseSocketPath = process.env.DB_SOCKET_PATH // For Cloud SQL Unix socket
        
        if(!databaseUser || !databasePassword || !databaseName){
            throw new Error("Some of the database credentials are missing")
        }

        // Cloud SQL connection config
        const config = {
            user: databaseUser,
            password: databasePassword,
            database: databaseName,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        }

        // Use Unix socket if available (Cloud Run), otherwise use TCP
        if (databaseSocketPath) {
            config.socketPath = databaseSocketPath
            console.log("Connecting to Cloud SQL via Unix socket")
        } else if (databaseHost) {
            config.host = databaseHost
            config.port = databasePort
            console.log(`Connecting to Cloud SQL via TCP: ${databaseHost}:${databasePort}`)
        } else {
            throw new Error("Either DB_HOST or DB_SOCKET_PATH must be provided")
        }

        dbPool = await mysql.createPool(config)
        await dbPool.query("SELECT 1")
        console.log("Database is connected successfully")
    } catch (error) {
        throw new Error("An error occurred while connecting to the database: "+ error)
    }
}

const getDB = () => {
    if(dbPool){
        return dbPool
    }
    throw new Error("Cannot get database instance because it was not initialized")
}

module.exports = {initDB, getDB}
