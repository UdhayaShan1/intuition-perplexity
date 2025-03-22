import openai
from flask import Flask, render_template, request, jsonify
import os
import json

app = Flask(__name__)

# existing setup
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

    filepath = os.path.join(DB_DIR, f"{project_name}.json")
    if not os.path.exists(filepath):
        return jsonify({"error": "Project not found"}), 404

    with open(filepath, 'r') as f:
        project = json.load(f)
    print(project)
 
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
    print(content)

    try:
        timeline_json = json.loads(content)
    except json.JSONDecodeError:
        return jsonify({"error": "OpenAI response was not valid JSON", "raw": content}), 500
    
    print("Response")
    print(content)
    # ✅ Save to file
    timeline_path = os.path.join(DB_DIR, f"timeline_{project_name}.json")
    with open(timeline_path, 'w') as f:
        json.dump(timeline_json, f, indent=2)
    return jsonify(timeline_json)


@app.route('/')
def home():
    return render_template('home.html')


@app.route('/project')
def project():
    return render_template('project.html')


@app.route('/timeline')
def timeline():
    return render_template('timeline.html')


@app.route('/load_project')
def load_project():
    project_name = request.args.get("project_name")
    filepath = os.path.join(DB_DIR, f"{project_name}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            data = json.load(f)
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
    project_name = request.args.get("project_name")
    if not project_name:
        return jsonify({"status": "error", "message": "Missing project name"}), 400

    data = request.get_json()
    filepath = os.path.join(DB_DIR, f"{project_name}.json")
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    return jsonify({"status": "success"})


if __name__ == '__main__':
    app.run(debug=True)
