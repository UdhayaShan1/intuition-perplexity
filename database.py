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
    conn.commit()
    conn.close()

def save_project_to_db(project_name, project_data):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        INSERT OR REPLACE INTO projects (project_name, project_data)
        VALUES (?, ?)
    ''', (project_name, json.dumps(project_data)))
    conn.commit()
    conn.close()

def load_project_from_db(project_name):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT project_data FROM projects WHERE project_name = ?', (project_name,))
    row = c.fetchone()
    conn.close()
    if row:
        return json.loads(row[0])
    return None