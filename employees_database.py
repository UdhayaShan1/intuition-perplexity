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
            employee_data TEXT
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
        INSERT INTO employees (name, department, years_with_company, employee_data)
        VALUES (?, ?, ?, ?)
    ''', (
        employee_data["name"],
        employee_data["department"],
        employee_data["years_with_company"],
        employee_json
    ))
    conn.commit()
    conn.close()


def get_all_employees():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id, name, department, years_with_company, employee_data FROM employees')
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
            **emp_data
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
        }
    ]

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM employees')
    conn.commit()
    conn.close()

    for emp in mock_employees:
        save_employee_to_db(emp)
