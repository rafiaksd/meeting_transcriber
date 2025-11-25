import os
import threading
import time
import uuid
from queue import Queue

import whisper
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
RESULTS_FOLDER = "results"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

task_queue = Queue()

# GLOBAL STATE STORE
# This prevents the "guessing" logic. We track every ID explicitly.
# Values: "queued", "processing", "done", "error"
task_lifecycle = {} 

current_task = {"status": "idle", "file": None, "id": None}

print("Loading Whisper model...")
model = whisper.load_model("tiny") 
print("Whisper model loaded.")

def worker():
    while True:
        # Wait for next task
        task = task_queue.get()
        
        file_path = task["file_path"]
        task_id = task["id"]

        # UPDATE STATE: Processing
        task_lifecycle[task_id] = "processing"
        current_task["status"] = "processing"
        current_task["file"] = os.path.basename(file_path)
        current_task["id"] = task_id

        # Run whisper
        try:
            result = model.transcribe(file_path, fp16=False)
            transcript = result["text"]
        except Exception as e:
            transcript = f"Error: {str(e)}"
            task_lifecycle[task_id] = "error" # Track error state

        # Save transcript
        with open(f"{RESULTS_FOLDER}/{task_id}.txt", "w", encoding="utf-8") as f:
            f.write(transcript)

        # UPDATE STATE: Done
        # We do NOT set current_task to idle yet. 
        # We assume processing is done for this ID, but let the loop handle the next state.
        task_lifecycle[task_id] = "done"
        
        # Reset Global Status only if queue is empty to prevent UI flicker
        if task_queue.empty():
            current_task["status"] = "idle"
            current_task["file"] = None
            current_task["id"] = None
        
        task_queue.task_done()

# Start background worker thread
threading.Thread(target=worker, daemon=True).start()

@app.route("/upload", methods=["POST"])
def upload():
    if "audio" not in request.files:
        return jsonify({"error": "No file"}), 400

    audio = request.files["audio"]
    task_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_FOLDER, task_id + "_" + audio.filename)
    audio.save(file_path)

    # Set initial state
    task_lifecycle[task_id] = "queued"
    
    task_queue.put({"id": task_id, "file_path": file_path})

    return jsonify({"task_id": task_id})


@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "status": current_task["status"],
        "processing_file": current_task["file"],
        "processing_id": current_task["id"],
        "queue_length": task_queue.qsize()
    })


@app.route("/result/<task_id>", methods=["GET"])
def result(task_id):
    file_path = os.path.join(RESULTS_FOLDER, task_id + ".txt")
    if not os.path.exists(file_path):
        return jsonify({"status": "pending"})
    
    with open(file_path, "r", encoding="utf-8") as f:
        return jsonify({
            "status": "done",
            "transcript": f.read()
        })

@app.route("/history", methods=["GET"])
def history():
    tasks = []
    for filename in os.listdir(UPLOAD_FOLDER):
        if "_" not in filename: continue

        try:
            task_id, original_name = filename.split("_", 1)
        except ValueError: continue

        file_path = os.path.join(UPLOAD_FOLDER, filename)
        result_path = os.path.join(RESULTS_FOLDER, task_id + ".txt")
        
        # 1. Check strict file existence first (Source of Truth for restarts)
        if os.path.exists(result_path):
            status = "done"
            # If server restarted, ensure lifecycle knows it's done
            task_lifecycle[task_id] = "done"
        else:
            # 2. Check our memory lifecycle for "queued" vs "processing"
            # If the server restarted, this might be empty, so default to 'queued'
            status = task_lifecycle.get(task_id, "queued")

        transcript = None
        if status == "done":
            try:
                with open(result_path, "r", encoding="utf-8") as f:
                    transcript = f.read()
            except:
                transcript = ""

        timestamp = os.path.getctime(file_path)
        formatted_time = time.strftime('%Y-%m-%d %H:%M', time.localtime(timestamp))

        tasks.append({
            "id": task_id,
            "filename": original_name,
            "status": status,
            "transcript": transcript,
            "timestamp": formatted_time,
            "raw_time": timestamp
        })

    tasks.sort(key=lambda x: x["raw_time"], reverse=True)
    return jsonify(tasks)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)