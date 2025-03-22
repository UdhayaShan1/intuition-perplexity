import os
import json
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'db', 'projects.db')

def init_db():
    if not os.path.exists(os.path.dirname(DB_PATH)):
        os.makedirs(os.path.dirname(DB_PATH))
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_name TEXT UNIQUE,
            project_data TEXT
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS timelines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_name TEXT UNIQUE,
            timeline_data TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_project_to_db(project_name, project_data):
    print(f"Saving project {project_name} to database")
    print(f"Data to save: {project_data}")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Convert project data to JSON string
    project_data_json = json.dumps(project_data)
    
    # Use INSERT OR REPLACE to handle both new projects and updates
    c.execute('''
        INSERT OR REPLACE INTO projects (project_name, project_data)
        VALUES (?, ?)
    ''', (project_name, project_data_json))
    
    conn.commit()
    conn.close()
    
    print(f"Project {project_name} saved successfully")
    
    # Verify the save by retrieving it
    saved_data = load_project_from_db(project_name)
    if saved_data:
        print(f"Verification successful, retrieved data has {len(saved_data.get('members', []))} members")
    else:
        print("Warning: Could not verify save operation")

def save_timeline_to_db(project_name, timeline_data):
    print(f"Saving timeline for project {project_name} to database")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    timeline_data_json = json.dumps(timeline_data)
    c.execute('''
        INSERT OR REPLACE INTO timelines (project_name, timeline_data)
        VALUES (?, ?)
    ''', (project_name, timeline_data_json))
    conn.commit()
    conn.close()
    print(f"Timeline for project {project_name} saved successfully")

def load_timeline_from_db(project_name):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT timeline_data FROM timelines WHERE project_name = ?', (project_name,))
    row = c.fetchone()
    conn.close()
    if row:
        return json.loads(row[0])
    return None

def load_project_from_db(project_name):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT project_data FROM projects WHERE project_name = ?', (project_name,))
    row = c.fetchone()
    conn.close()
    if row:
        return json.loads(row[0])
    return None

def get_all_projects():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT project_name, project_data FROM projects')
    rows = c.fetchall()
    conn.close()
    
    projects = []
    for row in rows:
        project_id = row[0]
        project_data = json.loads(row[1])
        projects.append({
            "id": project_id,
            "name": project_data.get("ProjectName") or "Unnamed Project",
            "description": project_data.get("ProjectDescription") or "",
            "duration": project_data.get("ProjectDuration") or ""
        })
    
    return projects