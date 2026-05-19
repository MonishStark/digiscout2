import { createServer } from "http";
import { initializeDatabase, pool } from "./lib/db";
import { app } from "../server";
async function runTest() {
    console.log("🚀 Starting Business Intelligence AI Chat Integration Test...");
    // 1. Initializing DB
    await initializeDatabase();
    console.log("✅ Database initialized successfully!");
    // 2. Start test server
    const testPort = 30009;
    const serverInstance = createServer(app);
    await new Promise((resolve) => {
        serverInstance.listen(testPort, () => {
            console.log(`✅ Test server is up on http://localhost:${testPort}`);
            resolve();
        });
    });
    const testLeadId = "test-lead-intel-999";
    const sampleContext = {
        id: testLeadId,
        name: "Artisan Wood Fired Pizza",
        address: "100 Broadway, New York, NY 10005",
        phone: "(212) 555-0199",
        rating: 4.8,
        reviews: [
            { author: "John D.", rating: 5, text: "Best sourdough pizza crust in lower Manhattan!" },
            { author: "Sarah M.", rating: 4, text: "Terrific food but wait times can be up to 45 minutes on weekends." }
        ]
    };
    try {
        // 3. Clear any past test messages
        await pool.query("DELETE FROM lead_ai_messages WHERE lead_id = ?", [testLeadId]);
        console.log("🧹 Cleared old test messages.");
        // 4. Send POST chat message and verify chunked streaming
        console.log("📨 Sending chat query to Gemini: 'Who are our main competitors locally?'");
        const postResponse = await fetch(`http://localhost:${testPort}/api/business-ai-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                leadId: testLeadId,
                businessContext: sampleContext,
                messages: [
                    { role: "user", content: "Who are our main competitors locally, and what are their weaknesses?" }
                ]
            })
        });
        if (!postResponse.ok) {
            throw new Error(`Failed POST request: ${postResponse.status} ${postResponse.statusText}`);
        }
        console.log("📥 Stream response received! Reading stream...");
        const reader = postResponse.body?.getReader();
        if (!reader) {
            throw new Error("Response body is not readable!");
        }
        let fullResponseText = "";
        const decoder = new TextDecoder("utf-8");
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const chunkStr = decoder.decode(value, { stream: true });
            fullResponseText += chunkStr;
            process.stdout.write(`[Chunk: ${chunkStr.length}B] `);
        }
        console.log("\n✅ Stream completed successfully!");
        console.log("\n📖 Complete Generated Response Summary:\n", fullResponseText.substring(0, 300) + "...\n");
        // 5. Verify database persistence
        const [rows] = await pool.query("SELECT * FROM lead_ai_messages WHERE lead_id = ? ORDER BY created_at ASC", [testLeadId]);
        console.log(`📦 Database Verification: Found ${rows.length} messages in logs.`);
        if (rows.length !== 2) {
            throw new Error(`Expected exactly 2 persisted messages in DB, found ${rows.length}`);
        }
        console.log("✅ Row 1 (User):", rows[0].content);
        console.log("✅ Row 2 (Model - preview):", rows[1].content.substring(0, 100) + "...");
        // 6. Test GET chat history endpoint
        console.log("📨 Querying historical continuity (GET)...");
        const getResponse = await fetch(`http://localhost:${testPort}/api/business-ai-chat/${testLeadId}`);
        if (!getResponse.ok) {
            throw new Error(`Failed GET request: ${getResponse.status}`);
        }
        const getData = await getResponse.json();
        console.log(`✅ GET History returned ${getData.messages.length} messages.`);
        if (getData.messages.length !== 2) {
            throw new Error("Continuity mismatch in history payload!");
        }
        console.log("\n🎉 ALL CONVERSATIONAL AI INTELLIGENCE CHECKS PASSED SUCCESSFULLY!");
    }
    catch (err) {
        console.error("❌ Test failed with error:", err);
        process.exit(1);
    }
    finally {
        serverInstance.close(() => {
            console.log("🔌 Test server closed successfully.");
            process.exit(0);
        });
    }
}
runTest();
