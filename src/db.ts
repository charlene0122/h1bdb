import mysql from "mysql2/promise";

interface QueryResult {
  rows: any[] | any;
  fields: mysql.FieldPacket[];
}

export const query = async (
  queryText: string,
  params?: any[]
): Promise<QueryResult> => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as unknown as number,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  const [rows, fields] = await pool.query(queryText, params);
  pool.end();
  return { rows, fields };
};
