from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import threading
import json
import time
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = 'results'
ALLOWED_EXTENSIONS = {'mp4'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

# Initialize processing jobs storage
processing_jobs = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the API is running"""
    return jsonify({"status": "healthy", "message": "Flask API is running"}), 200

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Endpoint to handle video file uploads"""
    if 'video' not in request.files:
        return jsonify({"error": "No video file part"}), 400
        
    file = request.files['video']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    if file and allowed_file(file.filename):
        # Generate unique filename
        unique_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        base_filename = os.path.splitext(filename)[0]
        saved_filename = f"{unique_id}_{base_filename}.mp4"
        filepath = os.path.join(UPLOAD_FOLDER, saved_filename)
        
        # Save the file
        file.save(filepath)
        
        # Create job entry
        job_id = unique_id
        processing_jobs[job_id] = {
            "status": "received",
            "progress": 0,
            "current_step": "File received",
            "filepath": filepath,
            "filename": base_filename,
            "result_path": os.path.join(RESULTS_FOLDER, f"{unique_id}_results.json")
        }
        
        # Start mock processing in background (in a real app, this would call actual video processing)
        threading.Thread(target=simulate_processing, args=(job_id,)).start()
        
        return jsonify({
            "message": "Video uploaded successfully",
            "job_id": job_id
        }), 200
    
    return jsonify({"error": "Invalid file format"}), 400

@app.route('/api/status/<job_id>', methods=['GET'])
def get_status(job_id):
    """Endpoint to check the status of a processing job"""
    if job_id not in processing_jobs:
        return jsonify({"error": "Job not found"}), 404
        
    job = processing_jobs[job_id]
    
    # If job is completed, include result path
    if job["status"] == "completed":
        return jsonify({
            "status": job["status"],
            "progress": 100,
            "current_step": "Completed",
            "result_path": f"/api/results/{job_id}"
        })
    
    return jsonify({
        "status": job["status"],
        "progress": job["progress"],
        "current_step": job["current_step"]
    })

@app.route('/api/results/<job_id>', methods=['GET'])
def get_results(job_id):
    """Endpoint to retrieve processing results"""
    if job_id not in processing_jobs:
        return jsonify({"error": "Job not found"}), 404
        
    job = processing_jobs[job_id]
    
    if job["status"] != "completed":
        return jsonify({"error": "Processing not completed yet"}), 400
        
    try:
        with open(job["result_path"], 'r') as f:
            results = json.load(f)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": f"Error retrieving results: {str(e)}"}), 500

def simulate_processing(job_id):
    """Simulate video processing steps for testing the frontend"""
    job = processing_jobs[job_id]
    filepath = job["filepath"]
    
    # Simulate transcription step
    job["status"] = "processing"
    job["current_step"] = "Extracting audio"
    job["progress"] = 10
    time.sleep(2)  # Simulate processing time
    
    # Simulate transcription step
    job["current_step"] = "Transcribing audio"
    job["progress"] = 30
    time.sleep(3)  # Simulate processing time
    
    # Simulate sentiment analysis step
    job["current_step"] = "Analyzing sentiment"
    job["progress"] = 60
    time.sleep(2)  # Simulate processing time
    
    # Create mock results
    mock_results = {
        "filename": job["filename"],
        "duration": 120,  # Mock 2-minute video
        "segments": [
            {
                "start": 0,
                "end": 5,
                "timestamp": "0:00",
                "text": "I really don't understand why you're doing this.",
                "speaker": "Character A",
                "sentiment": -0.65,
                "emotion": "confusion"
            },
            {
                "start": 12,
                "end": 16,
                "timestamp": "0:12",
                "text": "Trust me, it's going to be worth it in the end.",
                "speaker": "Character B",
                "sentiment": 0.45,
                "emotion": "confidence"
            },
            {
                "start": 18,
                "end": 24,
                "timestamp": "0:18",
                "text": "That's what you always say, but look where we are now.",
                "speaker": "Character A",
                "sentiment": -0.78,
                "emotion": "frustration"
            },
            {
                "start": 25,
                "end": 30,
                "timestamp": "0:25",
                "text": "This time is different. I promise.",
                "speaker": "Character B",
                "sentiment": 0.32,
                "emotion": "hope"
            },
            {
                "start": 32,
                "end": 36,
                "timestamp": "0:32",
                "text": "You know what? I believe you.",
                "speaker": "Character A",
                "sentiment": 0.58,
                "emotion": "trust"
            },
            {
                "start": 40,
                "end": 45,
                "timestamp": "0:40",
                "text": "Thank you. That means everything to me.",
                "speaker": "Character B",
                "sentiment": 0.85,
                "emotion": "gratitude"
            },
            {
                "start": 47,
                "end": 50,
                "timestamp": "0:47",
                "text": "Don't make me regret it.",
                "speaker": "Character A",
                "sentiment": -0.25,
                "emotion": "caution"
            },
            {
                "start": 55,
                "end": 58,
                "timestamp": "0:55",
                "text": "I won't. I swear.",
                "speaker": "Character B",
                "sentiment": 0.62,
                "emotion": "determination"
            },
            {
                "start": 62,
                "end": 67,
                "timestamp": "1:02",
                "text": "We need to move quickly, they're coming!",
                "speaker": "Character A",
                "sentiment": -0.54,
                "emotion": "fear"
            },
            {
                "start": 70,
                "end": 74,
                "timestamp": "1:10",
                "text": "Stay calm. We've been through worse.",
                "speaker": "Character B",
                "sentiment": 0.15,
                "emotion": "reassurance"
            }
        ]
    }
    
    # Save mock results
    job["current_step"] = "Saving results"
    job["progress"] = 90
    time.sleep(1)  # Simulate processing time
    
    with open(job["result_path"], 'w') as f:
        json.dump(mock_results, f, indent=2)
    
    # Mark job as completed
    job["status"] = "completed"
    job["progress"] = 100
    job["current_step"] = "Analysis completed"

if __name__ == '__main__':
    app.run(debug=True)