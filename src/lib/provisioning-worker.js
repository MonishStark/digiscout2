import { pool } from "./db";
import { processJob } from "./provisioning-engine";
const POLL_INTERVAL_MS = 5000;
let isWorkerRunning = false;
export async function startProvisioningWorker() {
    if (isWorkerRunning)
        return;
    isWorkerRunning = true;
    console.log("[Worker] Provisioning worker started.");
    setInterval(async () => {
        try {
            await pollQueue();
        }
        catch (error) {
            console.error("[Worker] Error in poll loop:", error);
        }
    }, POLL_INTERVAL_MS);
}
async function pollQueue() {
    // Optimistic concurrency: try to lock one pending job
    // We use a 10 minute timeout for locked jobs in case the Node process crashed
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(`
			SELECT id FROM provisioning_jobs 
			WHERE status NOT IN ('completed', 'failed', 'lead') 
			  AND (locked_at IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE))
			ORDER BY created_at ASC 
			LIMIT 1
			FOR UPDATE SKIP LOCKED
		`);
        if (!rows || rows.length === 0) {
            await connection.commit();
            return; // No jobs
        }
        const jobId = rows[0].id;
        // Lock the job
        await connection.query(`UPDATE provisioning_jobs SET locked_at = NOW() WHERE id = ?`, [jobId]);
        await connection.commit();
        console.log(`[Worker] Picked up job ${jobId}`);
        // Process the job outside the transaction
        await processJob(jobId);
    }
    catch (error) {
        await connection.rollback();
        console.error("[Worker] Transaction error:", error);
    }
    finally {
        connection.release();
    }
}
