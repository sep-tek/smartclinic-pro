const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: isProduction
    ? {
        // Neon's connection endpoint is fronted by a load balancer whose
        // certificate does not always match the pooler host, so the default
        // rejectUnauthorized:true handshake can fail against Neon.
        // Set DB_SSL_STRICT=1 on the host to enforce full verification
        // when Neon provides a matching CA for your endpoint.
        rejectUnauthorized:
          process.env.DB_SSL_STRICT === "1" ? true : false,
      }
    : false,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database.");
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

module.exports = pool;