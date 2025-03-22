from flask import Flask, render_template, request, jsonify
import os
import json

app = Flask(__name__)

DB_DIR = os.path.join(os.path.dirname(__file__), 'db')
os.makedirs(DB_DIR, exist_ok=True)

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
    return jsonify({"members": [], "generalTask": ""})  # new project


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