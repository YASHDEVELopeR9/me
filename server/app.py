"""
Minecraft-Themed 3D Portfolio - Flask Sentinel API
Author: Yash Vishwakarma (yashvishwakarma968@gmail.com)
Provides validated, rate-limited dispatch endpoints for Book & Quill contact and Quest Contract hiring.
"""

import os
import re
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from collections import defaultdict
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="../", static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Rate limiter storage: ip -> list of timestamps
RATE_LIMIT = 5  # requests
RATE_WINDOW = 600  # 10 minutes in seconds
ip_request_history = defaultdict(list)

TARGET_EMAIL = os.environ.get("TARGET_EMAIL", "yashvishwakarma968@gmail.com")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")


def sanitize_text(text: str, max_len: int = 1500) -> str:
    if not text:
        return ""
    # Strip basic dangerous tags and control chars
    clean = re.sub(r"[<>]", "", str(text)).strip()
    return clean[:max_len]


def is_rate_limited(client_ip: str) -> bool:
    now = time.time()
    history = ip_request_history[client_ip]
    # Filter out timestamps older than window
    valid_history = [t for t in history if now - t < RATE_WINDOW]
    ip_request_history[client_ip] = valid_history

    if len(valid_history) >= RATE_LIMIT:
        return True

    valid_history.append(now)
    return False


def send_smtp_dispatch(subject: str, html_body: str, plain_body: str) -> dict:
    if not SMTP_USER or not SMTP_PASS:
        try:
            print(f"[SIMULATED SMTP DISPATCH] To: {TARGET_EMAIL}")
            print(f"Subject: {subject.encode('ascii', 'backslashreplace').decode('ascii')}")
            print(f"Body Preview: {plain_body[:200].encode('ascii', 'backslashreplace').decode('ascii')}...")
        except Exception:
            pass
        return {
            "sent": True,
            "simulated": True,
            "message": "Dispatch recorded! (SMTP server running in sandbox/simulation mode)",
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[SURVIVAL REALM] {subject}"
        msg["From"] = f"Survival Guide Sentinel <{SMTP_USER}>"
        msg["To"] = TARGET_EMAIL

        part1 = MIMEText(plain_body, "plain", "utf-8")
        part2 = MIMEText(html_body, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, TARGET_EMAIL, msg.as_string())

        return {"sent": True, "simulated": False, "message": "Raven dispatched to Yash!"}
    except Exception as exc:
        print(f"[SMTP ERROR] {exc}")
        return {"sent": False, "error": str(exc)}


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "realm": "Cherry Grove V1.0.0",
        "crafter": "Yash Vishwakarma",
        "target": TARGET_EMAIL,
        "smtp_configured": bool(SMTP_USER and SMTP_PASS)
    })


@app.route("/api/contact", methods=["POST"])
def handle_contact():
    client_ip = request.remote_addr or "127.0.0.1"
    if is_rate_limited(client_ip):
        return jsonify({
            "success": False,
            "error": "Rate limit reached. Too many ravens dispatched! Please wait 10 minutes."
        }), 429

    data = request.get_json(silent=True) or {}
    name = sanitize_text(data.get("name", ""), 100)
    contact = sanitize_text(data.get("contact", ""), 120)
    req_type = sanitize_text(data.get("type", "General Quest"), 80)
    message = sanitize_text(data.get("message", ""), 2000)

    # Validations
    if not name or len(name) < 2:
        return jsonify({"success": False, "error": "Adventurer name must be at least 2 characters."}), 400
    if not contact or len(contact) < 5:
        return jsonify({"success": False, "error": "Valid contact dispatch coordinates required (email or phone)."}), 400
    if not message or len(message) < 10:
        return jsonify({"success": False, "error": "Quest brief must be at least 10 characters."}), 400

    subject = f"Book & Quill Message from {name} [{req_type}]"
    plain_body = f"""=== BOOK & QUILL DISPATCH ===
Name: {name}
Coordinates: {contact}
Requisition: {req_type}
Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}

Message:
{message}
"""

    html_body = f"""
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #2c1d27; color: #fbf7f5; padding: 24px; border-radius: 8px; border: 4px solid #d97096;">
        <h2 style="color: #ff9ebb; margin-top: 0;">🌸 Book & Quill Dispatch: Yash Vishwakarma</h2>
        <p><strong>Adventurer:</strong> {name}</p>
        <p><strong>Coordinates:</strong> <a href="mailto:{contact}" style="color: #64dfdf;">{contact}</a></p>
        <p><strong>Requisition Type:</strong> <span style="background: #4a2840; padding: 4px 8px; border-radius: 4px;">{req_type}</span></p>
        <hr style="border: 0; border-top: 1px solid #794263; margin: 16px 0;">
        <h3 style="color: #ffd166;">Quest Brief:</h3>
        <p style="white-space: pre-wrap; background: #1a1017; padding: 16px; border-radius: 4px; border-left: 4px solid #ff9ebb;">{message}</p>
    </div>
    """

    res = send_smtp_dispatch(subject, html_body, plain_body)
    return jsonify({
        "success": True,
        "message": "Your parchment has been signed and delivered to Yash Vishwakarma!",
        "dispatch": res
    })


@app.route("/api/hire", methods=["POST"])
def handle_hire():
    client_ip = request.remote_addr or "127.0.0.1"
    if is_rate_limited(client_ip):
        return jsonify({
            "success": False,
            "error": "Bounty board cooldown active. Please wait 10 minutes before posting another contract."
        }), 429

    data = request.get_json(silent=True) or {}
    name = sanitize_text(data.get("name", ""), 100)
    contact = sanitize_text(data.get("contact", ""), 120)
    role = sanitize_text(data.get("role", "Web Developer"), 80)
    budget = sanitize_text(data.get("budget", "Flexible"), 80)
    brief = sanitize_text(data.get("brief", ""), 2500)

    if not name or len(name) < 2:
        return jsonify({"success": False, "error": "Adventurer/Guild name is required."}), 400
    if not contact or len(contact) < 5:
        return jsonify({"success": False, "error": "Dispatch contact coordinates required."}), 400
    if not brief or len(brief) < 10:
        return jsonify({"success": False, "error": "Project or contract description must be at least 10 characters."}), 400

    subject = f"⚔️ Quest Contract Offered by {name} - Role: {role} ({budget})"
    plain_body = f"""=== QUEST CONTRACT OFFER ===
Employer: {name}
Coordinates: {contact}
Role Needed: {role}
Budget / Bounty: {budget}
Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}

Contract Brief:
{brief}
"""

    html_body = f"""
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #16241b; color: #fbf7f5; padding: 24px; border-radius: 8px; border: 4px solid #52b788;">
        <h2 style="color: #74c69d; margin-top: 0;">⚔️ New Quest Contract: Yash Vishwakarma</h2>
        <p><strong>Guild/Employer:</strong> {name}</p>
        <p><strong>Coordinates:</strong> <a href="mailto:{contact}" style="color: #95d5b2;">{contact}</a></p>
        <p><strong>Role Requested:</strong> <span style="background: #2d6a4f; padding: 4px 8px; border-radius: 4px; font-weight: bold;">{role}</span></p>
        <p><strong>Bounty/Budget:</strong> <span style="color: #ffd166; font-weight: bold;">{budget}</span></p>
        <hr style="border: 0; border-top: 1px solid #40916c; margin: 16px 0;">
        <h3 style="color: #d8f3dc;">Contract Objectives:</h3>
        <p style="white-space: pre-wrap; background: #081c15; padding: 16px; border-radius: 4px; border-left: 4px solid #52b788;">{brief}</p>
    </div>
    """

    res = send_smtp_dispatch(subject, html_body, plain_body)
    return jsonify({
        "success": True,
        "message": "Contract sealed! Yash has received your quest proposal and will reply shortly.",
        "dispatch": res
    })


# Fallback to serve frontend when run directly
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[REALM ONLINE] Survival Guide Sentinel API online on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
