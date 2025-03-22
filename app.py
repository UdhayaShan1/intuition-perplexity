from flask import Flask, render_template, request, jsonify
import webbrowser
from threading import Timer
from database import init_db, save_project_to_db, load_project_from_db, get_all_projects, save_timeline_to_db
from employees_database import (
    populate_employees_with_mock_data, 
    db_get_assigned_employees,
    assign_employee_to_project,  # Add this import
    get_all_employees
)
import employees_database
import os
import json
import openai

app = Flask(__name__)

DB_DIR = os.path.join(os.path.dirname(__file__), 'db')
os.makedirs(DB_DIR, exist_ok=True)
openai.api_key = ""

with open("api_key/api.txt", "r") as key_file:
    openai.api_key = key_file.read().strip()

# Remove this redundant import since we already imported get_all_employees above
# from employees_database import get_all_employees

from employees_database import get_all_employees

@app.route('/ai_generate_timeline')
def ai_generate_timeline():
    try:
        project_name = request.args.get("project_name")
        if not project_name:
            return jsonify({"error": "Missing project name"}), 400

        project = load_project_from_db(project_name)
        employees = get_all_employees()

        print("Project is:", project)
        print("Employees found:", len(employees))

        prompt = f"""
        You are a project planning AI assistant.

        Given:
        - A project with members and task data
        - A list of employees with name, department, years_with_company, general_interests, skills, and personalities

        Your job is to:
        1. Generate a structured project timeline
        2. For each project member, recommend the best top 3 employees from the list who fit the task
        3. Include a short explanation why each employee fits based on their fields, skills, and traits

        Here is the project:
        {json.dumps(project, indent=2)}

        Here is the employee pool:
        {json.dumps(employees, indent=2)}

        ✅ Return only valid JSON in this format:
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
              "end_date": "...",
              "recommendations": [
                {{
                  "name": "...",
                  "reason": "..."
                }}
              ]
            }}
          ],
          "caution": "..."
        }}
        """

        # Check if API key is set
        if not openai.api_key or openai.api_key.strip() == "":
            print("ERROR: OpenAI API key is not set or is empty")
            return jsonify({"error": "OpenAI API key is not configured"}), 500

        try:
            # Add timeout to prevent hanging requests
            print("Making OpenAI API call...")
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                timeout=60  # 60 second timeout
            )
            
            content = response['choices'][0]['message']['content']
            print("OpenAI API call successful")
            
        except Exception as api_error:
            print(f"OpenAI API Error: {str(api_error)}")
            return jsonify({
                "error": "Error with OpenAI API",
                "details": str(api_error)
            }), 500

        try:
            print("Parsing response content...")
            timeline_json = json.loads(content)
            print("JSON parsing successful")
        except json.JSONDecodeError as json_error:
            print(f"JSON parsing error: {str(json_error)}")
            print(f"Raw content received: {content}")
            return jsonify({
                "error": "Could not parse OpenAI response as JSON", 
                "raw_content": content,
                "details": str(json_error)
            }), 500

        print(f"Saving timeline for project {project_name} to database")
        save_timeline_to_db(project_name, timeline_json)
        print(f"Timeline for project {project_name} saved successfully")
        
        timeline_json["consideredEmployees"] = employees
        return jsonify(timeline_json)
        
    except Exception as e:
        import traceback
        print(f"Error in AI timeline generation: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error", 
            "details": str(e)
        }), 500

@app.route('/get_timeline')
def get_timeline():
    try:
        project_name = request.args.get("project_name")
        if not project_name:
            return jsonify({"error": "Missing project name"}), 400
            
        from database import load_timeline_from_db
        timeline_data = load_timeline_from_db(project_name)
        
        if timeline_data is None:
            return jsonify({"error": "Timeline not found"}), 404
            
        # Add employee data to the response just like in ai_generate_timeline
        employees = get_all_employees()
        timeline_data["consideredEmployees"] = employees
        
        return jsonify(timeline_data)
        
    except Exception as e:
        import traceback
        print(f"Error retrieving timeline: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error", 
            "details": str(e)
        }), 500

@app.route('/check_timeline_exists')
def check_timeline_exists():
    try:
        project_name = request.args.get("project_name")
        if not project_name:
            return jsonify({"error": "Missing project name"}), 400
            
        # Check if a timeline exists for this project in your database
        from database import load_timeline_from_db
        timeline_data = load_timeline_from_db(project_name)
        
        return jsonify({
            "exists": timeline_data is not None
        })
        
    except Exception as e:
        import traceback
        print(f"Error checking timeline existence: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error", 
            "details": str(e),
            "exists": False
        }), 500

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


# Add this route to your app.py

@app.route('/get_assigned_employees')
def get_assigned_employees():
    try:
        project_id = request.args.get('project_id')
        
        if not project_id:
            return jsonify({"status": "error", "message": "No project ID provided"}), 400
        
        # Call the function from employees_database
        employees = db_get_assigned_employees(project_id)
        
        return jsonify({
            "status": "success",
            "employees": employees
        })
        
    except Exception as e:
        print(f"Error in get_assigned_employees: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/submit_plan', methods=['POST'])
def submit_plan():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400
            
        project_id = data.get('projectId')
        assignments = data.get('assignments')
        
        if not project_id or not assignments:
            return jsonify({"status": "error", "message": "Missing required data"}), 400
            
        # Process each assignment
        for assignment in assignments:
            employee_name = assignment.get('employeeName')
            
            # Call your database function to assign employee to project
            assign_employee_to_project(employee_name, project_id)
            
        return jsonify({
            "status": "success",
            "message": "Plan submitted successfully",
            "projectId": project_id,
            "assignmentsCount": len(assignments)
        })
        
    except Exception as e:
        print(f"Error in submit_plan: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Add these routes to your app.py file

@app.route('/employee_registration')
def employee_registration():
    return render_template('employee_registration.html')

@app.route('/register_employee', methods=['POST'])
def register_employee():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400
            
        required_fields = ['name', 'department', 'years_with_company', 'general_interests', 'skills', 'personalities']
        for field in required_fields:
            if field not in data:
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
        
        # Additional validation
        if len(data['personalities']) < 3:
            return jsonify({"status": "error", "message": "Please select at least 3 personality traits"}), 400
            
        # Save employee to database
        employees_database.save_employee_to_db(data)
        
        return jsonify({
            "status": "success",
            "message": "Employee registered successfully"
        })
        
    except Exception as e:
        print(f"Error in register_employee: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/generate_email', methods=['POST'])
def generate_email():
    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({"error": "Missing prompt"}), 400

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=250,
        n=1,
        stop=None,
        temperature=0.7,
    )

    email_content = response.choices[0].message['content'].strip()
    return jsonify({"email": email_content})

# Add this new route to handle employee project views
@app.route('/employee_project_view')
def employee_project_view():
    project_id = request.args.get('id')
    if not project_id:
        return redirect(url_for('home'))
    
    # Check if timeline exists
    from database import load_timeline_from_db
    timeline_data = load_timeline_from_db(project_id)
    
    if timeline_data:
        # Timeline exists, redirect to view it
        return redirect(url_for('timeline', id=project_id, mode='view'))
    
    # No timeline exists, show the "not available" page
    return render_template('employee_project_view.html', project_id=project_id)

@app.route('/save_timeline', methods=['POST'])
def save_timeline():
    try:
        project_name = request.args.get("project_name")
        if not project_name:
            return jsonify({"status": "error", "message": "Missing project name"}), 400
            
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Missing timeline data"}), 400
        
        # Save the timeline data to the database
        save_timeline_to_db(project_name, data)
        
        return jsonify({
            "status": "success",
            "message": "Timeline updated successfully"
        })
        
    except Exception as e:
        import traceback
        print(f"Error saving timeline: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

def open_browser():
    webbrowser.open_new('http://127.0.0.1:5000/')

if __name__ == '__main__':
    init_db()
    employees_database.init_db()
    populate_employees_with_mock_data()
    Timer(1, open_browser).start()
    app.run(debug=True)