import sqlite3

def clear_table():
    conn = sqlite3.connect('survey_responses.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM responses')
    conn.commit()
    conn.close()
    print("Database cleared.")

if __name__ == '__main__':
    clear_table()