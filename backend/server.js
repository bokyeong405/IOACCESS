
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { spawn } = require('child_process');
const { exec } = require('child_process');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database', 'main.db');
const DB_SETUP_SCRIPT_PATH = path.join(__dirname, 'database', 'sql', 'setup.sql');

// --- [BE-01] Database Management ---
// Initialize and connect to the SQLite database
let db;

function initializeDatabase() {
    const dbExists = fs.existsSync(DB_PATH);
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('[DB] Error connecting to database:', err.message);
            return;
        }
        console.log('[DB] Successfully connected to SQLite database.');
    });

    if (!dbExists) {
        console.log('[DB] Database not found. Creating and initializing...');
        const command = `sqlite3 "${DB_PATH}" < "${DB_SETUP_SCRIPT_PATH}"`;
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(`[DB] Error initializing database: ${stderr}`);
                return;
            }
            console.log(`[DB] Database initialized successfully.`);
        });
    }
}

// --- [HC-03] IPC with Python Hardware Script ---
function startHardwareScript() {
    const pythonScriptPath = path.join(__dirname, '..', 'hardware', 'main.py');
    const pythonProcess = spawn('python3', [pythonScriptPath]);

    console.log('[IPC] Starting hardware control script...');

    pythonProcess.stdout.on('data', (data) => {
        try {
            const event = JSON.parse(data.toString());
            console.log('[IPC] Received event from hardware:', event);
            
            // Process the event and then broadcast it
            processHardwareEvent(event);
        } catch (e) {
            console.error('[IPC] Error parsing data from hardware script:', e);
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Hardware Script] ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`[IPC] Hardware script exited with code ${code}. Restarting...`);
        setTimeout(startHardwareScript, 1000); // Restart after 1 second
    });
}

// --- Business Logic & Event Processing ---
// [BE-02] This is a placeholder for the logic to process events
async function processHardwareEvent(event) {
    // 1. Determine if the card/code is valid
    // 2. Determine event type (IN/OUT)
    // 3. Log the event to the database
    // 4. Broadcast the processed event to the frontend
    
    const processedEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        status: Math.random() > 0.3 ? 'SUCCESS' : 'FAILURE', // Simulate success/failure
        userName: 'Simulated User',
        eventType: 'IN' // Simulate IN event
    };

    // [BE-04] Broadcast the processed event to all connected clients
    io.emit('access_event', processedEvent);
    console.log('[Socket.io] Broadcasted event to clients:', processedEvent);
}


// --- [BE-03] REST API Server ---
app.get('/api/users', (req, res) => {
    db.all("SELECT id, name, card_uid, created_at FROM users", [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post('/api/users', (req, res) => {
    const { name, card_uid } = req.body;
    const sql = "INSERT INTO users (name, card_uid) VALUES (?, ?)";
    db.run(sql, [name, card_uid], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "id": this.lastID });
    });
});

app.get('/api/events', (req, res) => {
    db.all("SELECT * FROM access_events ORDER BY timestamp DESC LIMIT 50", [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

// [BE-02]
app.get('/api/status/occupants', (req, res) => {
    // Placeholder logic
    res.json({ "message": "success", "data": ["Admin User"] });
});

app.get('/api/stats/hourly-traffic', (req, res) => {
    // Placeholder logic
    const data = Array.from({length: 24}, (_, i) => ({ hour: i, count: Math.floor(Math.random() * 20) }));
    res.json({ "message": "success", "data": data });
});

app.post('/api/manual-entry', (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ "error": "User ID is required" });
    }

    const findUserSql = "SELECT * FROM users WHERE id = ?";
    db.get(findUserSql, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }
        if (!user) {
            return res.status(404).json({ "error": "User not found" });
        }

        const insertEventSql = `
            INSERT INTO access_events (user_id, event_type, method, status)
            VALUES (?, 'IN', 'MANUAL', 'SUCCESS')
        `;
        db.run(insertEventSql, [userId], function(err) {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }
            res.status(201).json({ "message": "Manual entry successful", "eventId": this.lastID });
        });
    });
});


// --- [BE-04] Real-time WebSocket Server ---
io.on('connection', (socket) => {
    console.log('[Socket.io] A user connected');

    socket.on('disconnect', () => {
        console.log('[Socket.io] User disconnected');
    });

    // [BE-05] Listen for remote control commands from the client
    socket.on('remote_control', (command) => {
        console.log(`[Socket.io] Received remote command: ${command.action}`);
        // Here, you would send the command to the Python script
        // e.g., pythonProcess.stdin.write(JSON.stringify(command) + '\n');
    });
});


// --- Server Initialization ---
server.listen(PORT, () => {
    console.log(`[Server] Backend server running on http://localhost:${PORT}`);
    initializeDatabase();
    startHardwareScript();
});

// Serve a simple frontend for testing
app.use(express.static(path.join(__dirname, '..', 'frontend')));
