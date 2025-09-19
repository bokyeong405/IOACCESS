-- SQLite3 Schema for Smart Access Control System

-- Drop tables if they exist to ensure a clean setup
DROP TABLE IF EXISTS access_events;
DROP TABLE IF EXISTS users;

-- users: Stores information about authorized users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    card_uid TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- access_events: Logs all access attempts (successful or failed)
CREATE TABLE access_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_type TEXT NOT NULL CHECK(event_type IN ('IN', 'OUT')),
    method TEXT NOT NULL CHECK(method IN ('RFID', 'KEYPAD')),
    status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'FAILURE')),
    scanned_uid TEXT, -- The raw UID scanned, especially useful for failed attempts
    details TEXT, -- Extra details, e.g., "Unknown Card", "Invalid Keypad Entry"
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Sample data for testing
INSERT INTO users (name, card_uid) VALUES ('Admin User', '1234567890');
