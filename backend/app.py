import os
import threading
import time
import uuid
from queue import Queue

# llm
import whisper
import ollama

# flask
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
RESULTS_FOLDER = "results"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

task_queue = Queue()
task_lifecycle = {} 
current_task = {"status": "idle", "file": None, "id": None}

model = whisper.load_model("tiny") 
print("Whisper model loaded.")

def generate_summary(text):
    try:
        # You can change this to "llama3", "mistral", or "gemma:2b"
        model_name = "gemma3:270m" 
        
        response = ollama.chat(
            model=model_name,
            messages=[
                {
                    "role": "user", 
                    "content": f"Summarize the following meeting transcript into concise bullet points. Capture key decisions and action items:\n\n{text}"
                }
            ]
        )
        return response["message"]["content"]
    except Exception as e:
        print(f"Ollama Error: {e}")
        return "Summary unavailable. Ensure Ollama is running and the model is pulled."


def worker():
    while True:
        task = task_queue.get()
        file_path = task["file_path"]
        task_id = task["id"]

        # 1. Update State
        task_lifecycle[task_id] = "processing"
        current_task["status"] = "processing"
        current_task["file"] = os.path.basename(file_path)
        current_task["id"] = task_id

        # 2. Run Whisper (Transcribe)
        try:
            result = model.transcribe(file_path, fp16=False)
            transcript = result["text"]
        except Exception as e:
            transcript = f"Error: {str(e)}"
            task_lifecycle[task_id] = "error"

        # Save Transcript
        with open(f"{RESULTS_FOLDER}/{task_id}.txt", "w", encoding="utf-8") as f:
            f.write(transcript)

        # 3. Run Ollama (Summarize)
        # Only summarize if transcription was successful and has content
        summary = ""
        if transcript and "Error:" not in transcript:
            summary = generate_summary(transcript)
            
            # Save Summary
            with open(f"{RESULTS_FOLDER}/{task_id}_summary.txt", "w", encoding="utf-8") as f:
                f.write(summary)

        # 4. Finish
        task_lifecycle[task_id] = "done"
        
        if task_queue.empty():
            current_task["status"] = "idle"
            current_task["file"] = None
            current_task["id"] = None
        
        task_queue.task_done()

threading.Thread(target=worker, daemon=True).start()

# --- Routes ---

@app.route("/upload", methods=["POST"])
def upload():
    if "audio" not in request.files:
        return jsonify({"error": "No file"}), 400

    audio = request.files["audio"]
    task_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_FOLDER, task_id + "_" + audio.filename)
    audio.save(file_path)

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
    # Check for transcript
    transcript_path = os.path.join(RESULTS_FOLDER, task_id + ".txt")
    if not os.path.exists(transcript_path):
        return jsonify({"status": "pending"})
    
    transcript_text = ""
    with open(transcript_path, "r", encoding="utf-8") as f:
        transcript_text = f.read()

    # Check for summary
    summary_path = os.path.join(RESULTS_FOLDER, task_id + "_summary.txt")
    summary_text = ""
    if os.path.exists(summary_path):
        with open(summary_path, "r", encoding="utf-8") as f:
            summary_text = f.read()

    return jsonify({
        "status": "done",
        "transcript": transcript_text,
        "summary": summary_text
    })

@app.route("/audio/<task_id>", methods=["GET"])
def get_audio(task_id):
    # Find file in UPLOAD_FOLDER that starts with task_id
    for filename in os.listdir(UPLOAD_FOLDER):
        if filename.startswith(task_id + "_"):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            return send_file(file_path, as_attachment=False)

    return jsonify({"error": "Audio not found"}), 404

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
        summary_path = os.path.join(RESULTS_FOLDER, task_id + "_summary.txt")
        
        # Determine Status
        if os.path.exists(result_path):
            status = "done"
            task_lifecycle[task_id] = "done"
        else:
            status = task_lifecycle.get(task_id, "queued")

        transcript = None
        summary = None

        if status == "done":
            try:
                with open(result_path, "r", encoding="utf-8") as f:
                    transcript = f.read()
                if os.path.exists(summary_path):
                     with open(summary_path, "r", encoding="utf-8") as f:
                        summary = f.read()
            except:
                transcript = ""

        timestamp = os.path.getctime(file_path)
        formatted_time = time.strftime('%Y-%m-%d %H:%M %p', time.localtime(timestamp))

        tasks.append({
            "id": task_id,
            "filename": original_name,
            "status": status,
            "transcript": transcript,
            "summary": summary,
            "timestamp": formatted_time,
            "raw_time": timestamp,
            "audio_url": f"http://{request.host}/audio/{task_id}",
        })

    tasks.sort(key=lambda x: x["raw_time"], reverse=True)
    return jsonify(tasks)

app.run(host="0.0.0.0", port=5000)
#app.run(debug=True)