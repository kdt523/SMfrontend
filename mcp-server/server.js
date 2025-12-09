const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 6000;

app.use(cors());
app.use(express.json());

// Existing authenticated routes (placeholder)
app.get('/api/protected', (req, res) => {
    // This would normally check for sessions/tokens
    res.json({ message: 'This is a protected route' });
});

// Corrected /stream endpoint for MCP
app.get('/stream', (req, res) => {
    // 1. Set SSE Headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        // 'Access-Control-Allow-Origin': '*' // Handled by cors middleware, but good to know
    });

    // 2. Send immediate test message
    // Format: "data: <payload>\n\n"
    const testMessage = {
        type: 'connection',
        status: 'connected',
        message: 'MCP Stream Connected'
    };
    res.write(`data: ${JSON.stringify(testMessage)}\n\n`);

    // 3. Keep connection open (do NOT call res.end())
    
    // Optional: Send a heartbeat to prevent timeouts
    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 30000);

    // 4. Cleanup when client disconnects
    req.on('close', () => {
        clearInterval(heartbeat);
        console.log('Client disconnected from stream');
        res.end();
    });
});

app.listen(PORT, () => {
    console.log(`MCP Server running on http://127.0.0.1:${PORT}`);
});
