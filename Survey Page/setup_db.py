import sqlite3

# Connect to the SQLite database (or create it if it doesn't exist)
conn = sqlite3.connect('survey_responses.db')

# Create a cursor object
cursor = conn.cursor()

# Create a table to store survey responses
cursor.execute('''
CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    interest_project TEXT NOT NULL,
    knowledge TEXT NOT NULL,
    interest_learning TEXT NOT NULL,
    why_choose TEXT NOT NULL,
    personal_qualities TEXT NOT NULL,
    commit_duration TEXT NOT NULL
)
''')

# Commit the changes and close the connection
conn.commit()
conn.close()