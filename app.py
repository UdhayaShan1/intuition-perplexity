from flask import Flask, render_template, request, jsonify
import webbrowser
from threading import Timer
from database import init_db, save_project_to_db, load_project_from_db, get_all_projects, save_timeline_to_db
import os
import json
import openai

app = Flask(__name__)

DB_DIR = os.path.join(os.path.dirname(__file__), 'db')
os.makedirs(DB_DIR, exist_ok=True)
openai.api_key = ""

with open("api_key/api.txt", "r") as key_file:
    openai.api_key = key_file.read().strip()

@app.route('/ai_generate_timeline')
def ai_generate_timeline():
    project_name = request.args.get("project_name")
    if not project_name:
        return jsonify({"error": "Missing project name"}), 400
    
    project_name = request.args.get("project_name")
    project = load_project_from_db(project_name)
    
    print("project is ", project)
 
    prompt = f"""
    You are a project planner assistant. ONLY return a JSON response. Do not include any explanation or additional text.

    Here's the project data:
    {json.dumps(project, indent=2)}

    Generate a structured timeline that includes:

    - A short **summary of each member's contribution** (`summary`)
    - A **clear task description** (`task_description`) — fill in if missing
    - Estimated `training_time_days` and `implementation_time_days`
    - Calculated `total_duration_days` (sum of training + implementation)
    - A realistic `start_date` and `end_date` based on project duration and number of members (assume today is the project start date)

    Return only valid JSON in this format:
    {{
    "project": "{project_name}",
    "generalTask": "...",
    "timeline": [
        {{
        "member": 1,
        "role": "...",
        "summary": "...",
        "task_description": "...",
        "training_time_days": ...,
        "implementation_time_days": ...,
        "total_duration_days": ...,
        "start_date": "...",
        "end_date": "..."
        }}
    ]
    }}
    """


    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    content = response['choices'][0]['message']['content']
    print("content is ", content)

    try:
        timeline_json = json.loads(content)
    except json.JSONDecodeError:
        return jsonify({"error": "OpenAI response was not valid JSON", "raw": content}), 500
    
    print("Response")
    print(content)
    # ✅ Save to file
    save_timeline_to_db(project_name, timeline_json)
    return jsonify(timeline_json)



@app.route('/')
def home():
    projects = get_all_projects()
    return render_template('home.html', projects=projects)

@app.route('/project')
def project():
    project_id = request.args.get('id')
    # If no ID is provided, we'll create a new project (handled by project.js)
    return render_template('project.html')

@app.route('/timeline')
def timeline():
    return render_template('timeline.html')

@app.route('/load_project')
def load_project():
    project_name = request.args.get("project_name")
    data = load_project_from_db(project_name)
    if data:
        print("Retrieved")
        return jsonify(data)
    return jsonify({
        "ProjectName": "",
        "ProjectDescription": "",
        "ProjectDuration": "",
        "members": []
    })  # new project

@app.route('/save_project', methods=['POST'])
def save_project():
    print("\n--- SAVE PROJECT FUNCTION CALLED ---")
    project_name = request.args.get("project_name")
    print(f"Project name/ID: {project_name}")
    
    if not project_name:
        print("ERROR: Missing project name/ID")
        return jsonify({"status": "error", "message": "Missing project name"}), 400

    try:
        data = request.get_json()
        if data is None:
            print("ERROR: Invalid JSON data received")
            return jsonify({"status": "error", "message": "Invalid JSON data"}), 400
        
        print(f"Received data: Project Name={data.get('ProjectName')}, Members={len(data.get('members', []))}")
        
        save_project_to_db(project_name, data)
        print(f"Project {project_name} saved to database successfully")
        
        return jsonify({"status": "success"})
    except Exception as e:
        import traceback
        print(f"ERROR during save: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"status": "error", "message": str(e)}), 500

def open_browser():
    webbrowser.open_new('http://127.0.0.1:5000/')

if __name__ == '__main__':
    init_db()
    Timer(1, open_browser).start()
    app.run(debug=True)