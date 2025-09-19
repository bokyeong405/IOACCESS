#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import json
import sys
import random

# [HC-02] Placeholder functions for actuator control
# In a real scenario, these would use libraries like RPi.GPIO or pigpio
def control_servo(action):
    """Controls the servo motor to open or close the door."""
    print(f"[HARDWARE] Servo action: {action}", file=sys.stderr)

def control_led_buzzer(feedback_type):
    """Activates LED and/or buzzer to provide feedback."""
    print(f"[HARDWARE] Feedback: {feedback_type}", file=sys.stderr)

# [HC-03] Function to send data to the Node.js backend
def send_event_to_nodejs(event_data):
    """Sends a JSON event to the parent Node.js process via stdout."""
    # The Node.js process will listen to the stdout of this script
    print(json.dumps(event_data))
    sys.stdout.flush() # Ensure the data is sent immediately

# [HC-01] Placeholder functions for sensor input processing
def handle_rfid_input():
    """Simulates scanning an RFID card and returns event data."""
    # Simulate a random RFID scan event
    uids = ['1234567890', '0987654321', '1122334455']
    scanned_uid = random.choice(uids)
    is_known = random.choice([True, False])
    
    event = {
        'method': 'RFID',
        'scanned_uid': scanned_uid
    }
    send_event_to_nodejs(event)

def handle_keypad_input():
    """Simulates a keypad entry and returns event data."""
    # Simulate a random keypad event
    entered_code = "".join([str(random.randint(0, 9)) for _ in range(4)])
    event = {
        'method': 'KEYPAD',
        'scanned_uid': entered_code # Using scanned_uid to hold the entered code
    }
    send_event_to_nodejs(event)

def main_loop():
    """Main loop to continuously check for hardware events."""
    print("[HARDWARE] Starting hardware control script...", file=sys.stderr)
    # In a real application, you might have threads for RFID and Keypad
    # For this simulation, we'll just alternate between them.
    while True:
        try:
            if random.random() > 0.5:
                handle_rfid_input()
            else:
                handle_keypad_input()
            
            # Simulate a delay between events
            time.sleep(5)

        except KeyboardInterrupt:
            print("\n[HARDWARE] Shutting down hardware script.", file=sys.stderr)
            sys.exit(0)
        except Exception as e:
            print(f"[HARDWARE] An error occurred: {e}", file=sys.stderr)
            time.sleep(1)

if __name__ == "__main__":
    # The script starts its main loop when executed.
    # It expects to be run as a child process of the Node.js server.
    main_loop()
