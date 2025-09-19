-- Add some sample users
INSERT INTO users (name, card_uid) VALUES ('Alice', 'B0:22:C2:32');
INSERT INTO users (name, card_uid) VALUES ('Bob', 'A1:B2:C3:D4');
INSERT INTO users (name, card_uid) VALUES ('Charlie', 'E5:F6:A7:B8');

-- Add some sample access events for today
-- Generate random events for the last 24 hours
-- This is a bit of a hack for SQL, but will generate varied data.

-- Successful entries for Alice (user_id 1)
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (1, 'IN', 'RFID', 'SUCCESS', datetime('now', '-2 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (1, 'OUT', 'RFID', 'SUCCESS', datetime('now', '-1 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (1, 'IN', 'RFID', 'SUCCESS', datetime('now', '-30 minutes'));

-- Successful entries for Bob (user_id 2)
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (2, 'IN', 'KEYPAD', 'SUCCESS', datetime('now', '-5 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (2, 'OUT', 'KEYPAD', 'SUCCESS', datetime('now', '-4 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (2, 'IN', 'RFID', 'SUCCESS', datetime('now', '-3 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (2, 'OUT', 'RFID', 'SUCCESS', datetime('now', '-2 hours'));

-- Some failed attempts
INSERT INTO access_events (user_id, event_type, method, status, details, scanned_uid, timestamp) VALUES (NULL, 'IN', 'RFID', 'FAILURE', 'Unknown card', 'DE:AD:BE:EF', datetime('now', '-6 hours'));
INSERT INTO access_events (user_id, event_type, method, status, details, timestamp) VALUES (3, 'IN', 'KEYPAD', 'FAILURE', 'Wrong PIN', datetime('now', '-4 hours'));
INSERT INTO access_events (user_id, event_type, method, status, details, scanned_uid, timestamp) VALUES (NULL, 'IN', 'RFID', 'FAILURE', 'Unknown card', '12:34:56:78', datetime('now', '-15 minutes'));

-- More traffic for hourly chart
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (1, 'IN', 'RFID', 'SUCCESS', datetime('now', '-8 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (2, 'IN', 'RFID', 'SUCCESS', datetime('now', '-8 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (3, 'IN', 'KEYPAD', 'SUCCESS', datetime('now', '-8 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (1, 'IN', 'RFID', 'SUCCESS', datetime('now', '-9 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (2, 'IN', 'RFID', 'SUCCESS', datetime('now', '-9 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (1, 'IN', 'RFID', 'SUCCESS', datetime('now', '-10 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (3, 'IN', 'KEYPAD', 'SUCCESS', datetime('now', '-11 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (2, 'IN', 'RFID', 'SUCCESS', datetime('now', '-12 hours'));
INSERT INTO access_events (user_id, event_type, method, status, timestamp) VALUES (1, 'IN', 'RFID', 'SUCCESS', datetime('now', '-13 hours'));
