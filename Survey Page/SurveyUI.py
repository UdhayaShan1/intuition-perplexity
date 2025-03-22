from flask import Flask, render_template, request
import sqlite3

app = Flask(__name__)

def insert_response(data):
    conn = sqlite3.connect('survey_responses.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO responses (name, interest_project, knowledge, interest_learning, why_choose, personal_qualities, commit_duration)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', data)
    conn.commit()
    conn.close()

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        # Process form data here
        name = request.form.get('name')
        interest_project = request.form.get('interest_project')
        knowledge = request.form.get('knowledge')
        interest_learning = request.form.get('interest_learning')
        why_choose = request.form.get('why_choose')
        personal_qualities = request.form.get('personal_qualities')
        commit_duration = request.form.get('commit_duration')

        # Insert the data into the database
        data = (name, interest_project, knowledge, interest_learning, why_choose, personal_qualities, commit_duration)
        insert_response(data)

        return f"<p style='font-size: 24px;'>Thank you for your feedback, {name}!<p style='font-size: 24px;'>We will get back to you shortly."
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
