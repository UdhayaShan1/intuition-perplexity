from flask import Flask, render_template, request, jsonify
import webbrowser
from threading import Timer
from database import init_db, save_project_to_db, load_project_from_db, get_all_projects

app = Flask(__name__)

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