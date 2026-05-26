import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.production') });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    
    const [rows] = await connection.query(
        'SELECT id, subdomain_url, ssl_status, last_ssl_check FROM isolated_deployments ORDER BY id DESC LIMIT 5'
    );
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
}

main().catch(console.error);
