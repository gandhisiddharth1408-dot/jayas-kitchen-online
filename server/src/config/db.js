import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: `postgresql://${encodeURIComponent(
    process.env.DB_USER
  )}:${encodeURIComponent(
    process.env.DB_PASSWORD
  )}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,

  ssl: {
    rejectUnauthorized: false,
  },
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error)
})

export default pool