import os
import sqlite3
import json

DB_PATH = os.path.join(os.path.dirname(__file__), 'db', 'employees.db')


def init_db():
    if not os.path.exists(os.path.dirname(DB_PATH)):
        os.makedirs(os.path.dirname(DB_PATH))

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Create employees table with new columns
    c.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            department TEXT,
            years_with_company INTEGER,
            employee_data TEXT,
            project_assigned TEXT  -- New column to track project ID
        )
    ''')

    conn.commit()
    conn.close()



def save_employee_to_db(employee_data):
    """
    Save an employee record.
    employee_data should be a dictionary with:
        - name
        - department
        - years_with_company
        - general_interests
        - skills
        - personalities
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    employee_json = json.dumps({
        "general_interests": employee_data["general_interests"],
        "skills": employee_data["skills"],
        "personalities": employee_data["personalities"]
    })
    c.execute('''
        INSERT INTO employees (name, department, years_with_company, employee_data, project_assigned)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        employee_data["name"],
        employee_data["department"],
        employee_data["years_with_company"],
        employee_json,
        employee_data.get("project_assigned")  # optional, default is None
    ))
    conn.commit()
    conn.close()


def get_all_employees():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id, name, department, years_with_company, employee_data, project_assigned FROM employees')
    rows = c.fetchall()
    conn.close()

    employees = []
    for row in rows:
        emp_data = json.loads(row[4])
        employees.append({
            "id": row[0],
            "name": row[1],
            "department": row[2],
            "years_with_company": row[3],
            "project_assigned": row[5],
            **json.loads(row[4])
        })

    return employees


def assign_employee_to_project(employee_name, project_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        UPDATE employees
        SET project_assigned = ?
        WHERE name = ?
    ''', (project_id, employee_name))
    conn.commit()
    conn.close()

# Add this new function to your employees_database.py file

def db_get_assigned_employees(project_id):
    """
    Get all employees assigned to a specific project
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        SELECT id, name, department, years_with_company, employee_data, project_assigned 
        FROM employees
        WHERE project_assigned = ?
    ''', (project_id,))
    rows = c.fetchall()
    conn.close()
    
    employees = []
    for row in rows:
        employee_data = json.loads(row[4]) if row[4] else {}
        employees.append({
            "id": row[0],
            "name": row[1],
            "department": row[2],
            "years_with_company": row[3],
            "project_assigned": row[5],
            **employee_data
        })
    
    return employees

def populate_employees_with_mock_data():
    mock_employees = [
        {
            "name": "Alice Tan",
            "department": "AI Research",
            "years_with_company": 3,
            "general_interests": ["Artificial Intelligence", "Data Science"],
            "skills": ["Python", "TensorFlow", "SQL"],
            "personalities": ["Innovative", "Analytical", "Team Player", "Detail-Oriented", "Proactive"]
        },
        {
            "name": "Brian Koh",
            "department": "Frontend",
            "years_with_company": 2,
            "general_interests": ["Web Development", "UX/UI Design"],
            "skills": ["HTML", "CSS", "JavaScript", "React"],
            "personalities": ["Creative", "Collaborative", "Adaptable", "Meticulous", "Organized"]
        },
        {
            "name": "Charlotte Lee",
            "department": "Cybersecurity",
            "years_with_company": 4,
            "general_interests": ["Cybersecurity", "Network Administration"],
            "skills": ["Python", "Linux", "Firewalls"],
            "personalities": ["Vigilant", "Problem Solver", "Resourceful", "Responsible", "Innovative"]
        },
        {
            "name": "Daniel Ng",
            "department": "Cloud Infra",
            "years_with_company": 5,
            "general_interests": ["Cloud Computing", "DevOps"],
            "skills": ["AWS", "Docker", "Kubernetes"],
            "personalities": ["Efficient", "Flexible", "Communicative", "Analytical", "Strategic"]
        },
        {
            "name": "Elaine Wong",
            "department": "Mobile Development",
            "years_with_company": 1,
            "general_interests": ["Mobile App Development", "IoT"],
            "skills": ["Java", "Swift", "Kotlin"],
            "personalities": ["Innovative", "Quick Learner", "Collaborative", "Detail-Oriented", "Adaptable"]
        },
        {
            "name": "Farhan Malik",
            "department": "Backend",
            "years_with_company": 6,
            "general_interests": ["Systems Design", "APIs"],
            "skills": ["Java", "Spring Boot", "SQL"],
            "personalities": ["Logical", "Reliable", "Detail-Oriented", "Team Player", "Resilient"]
        },
        {
            "name": "Gina Yeo",
            "department": "Data Engineering",
            "years_with_company": 3,
            "general_interests": ["Big Data", "ETL Pipelines"],
            "skills": ["Python", "Spark", "Airflow"],
            "personalities": ["Organized", "Thoughtful", "Curious", "Precise", "Systematic"]
        },
        {
            "name": "Henry Tay",
            "department": "AI Research",
            "years_with_company": 2,
            "general_interests": ["NLP", "LLMs"],
            "skills": ["PyTorch", "Transformers", "OpenAI API"],
            "personalities": ["Innovative", "Visionary", "Quick Learner", "Passionate", "Analytical"]
        },
        {
            "name": "Isabelle Chan",
            "department": "QA/Testing",
            "years_with_company": 5,
            "general_interests": ["Automation", "CI/CD"],
            "skills": ["Selenium", "Jest", "Postman"],
            "personalities": ["Detail-Oriented", "Skeptical", "Thorough", "Efficient", "Dependable"]
        },
        {
            "name": "James Ong",
            "department": "DevOps",
            "years_with_company": 4,
            "general_interests": ["Deployment", "Monitoring"],
            "skills": ["Terraform", "Kubernetes", "Prometheus"],
            "personalities": ["Systematic", "Strategic", "Calm", "Analytical", "Helpful"]
        },
        {
            "name": "Kelly Lim",
            "department": "UI/UX",
            "years_with_company": 2,
            "general_interests": ["Design Systems", "User Behavior"],
            "skills": ["Figma", "Adobe XD", "CSS"],
            "personalities": ["Creative", "Empathetic", "Detail-Oriented", "Collaborative", "Adaptable"]
        },
        {
            "name": "Liam Tan",
            "department": "Product",
            "years_with_company": 3,
            "general_interests": ["Agile", "User Feedback"],
            "skills": ["JIRA", "Scrum", "Product Roadmaps"],
            "personalities": ["Visionary", "Communicative", "Organized", "Driven", "Empowering"]
        },
        {
            "name": "Mei Zhen",
            "department": "Security",
            "years_with_company": 5,
            "general_interests": ["Ethical Hacking", "Pen Testing"],
            "skills": ["Wireshark", "Nmap", "Metasploit"],
            "personalities": ["Curious", "Detail-Oriented", "Resilient", "Protective", "Alert"]
        },
        {
            "name": "Nathan Teo",
            "department": "ML Ops",
            "years_with_company": 2,
            "general_interests": ["ML Deployment", "Pipeline Automation"],
            "skills": ["MLflow", "Docker", "FastAPI"],
            "personalities": ["Hands-on", "Adaptive", "Pragmatic", "Team Player", "Innovative"]
        },
        {
            "name": "Olivia Sim",
            "department": "Analytics",
            "years_with_company": 4,
            "general_interests": ["Business Intelligence", "Storytelling"],
            "skills": ["Power BI", "SQL", "Excel"],
            "personalities": ["Communicative", "Inquisitive", "Logical", "Detail-Oriented", "Supportive"]
        }
    ]

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM employees')
    conn.commit()
    conn.close()

    for emp in mock_employees:
        save_employee_to_db(emp)
