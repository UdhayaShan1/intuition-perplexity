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

# Database initialization code to add during app startup
def init_projects():
    example_projects = [
        {
            "project_name": "ml_classification",
            "project_data": {
                "ProjectName": "Machine Learning Classification System",
                "ProjectDescription": "Machine learning system to predict customer churn rates using historical data and behavior patterns",
                "ProjectDuration": "3 months",
                "members": [
                    {
                        "MemberRole": "ML Engineer",
                        "TrainingTime": "2 weeks",
                        "TrainingDescription": "Research and select appropriate algorithms for churn prediction",
                        "ImplementationTime": "4 weeks",
                        "ImplementationDescription": "Implement model training pipeline and validation framework",
                        "Other Remarks": "Expertise in scikit-learn and TensorFlow required"
                    },
                    {
                        "MemberRole": "Data Scientist",
                        "TrainingTime": "1 week",
                        "TrainingDescription": "EDA and feature engineering training",
                        "ImplementationTime": "3 weeks",
                        "ImplementationDescription": "Data preprocessing and feature engineering implementation",
                        "Other Remarks": "Focus on interpretable features for business users"
                    },
                    {
                        "MemberRole": "DevOps Engineer",
                        "TrainingTime": "1 week",
                        "TrainingDescription": "ML deployment infrastructure setup",
                        "ImplementationTime": "2 weeks",
                        "ImplementationDescription": "Containerization and CI/CD pipeline for model deployment",
                        "Other Remarks": "Ensure scalability for production environment"
                    }
                ]
            }
        },
        {
            "project_name": "web_dashboard",
            "project_data": {
                "ProjectName": "Analytics Dashboard Redesign",
                "ProjectDescription": "Modernize executive dashboard with real-time data visualization and improved UX",
                "ProjectDuration": "2 months",
                "members": [
                    {
                        "MemberRole": "UI/UX Designer",
                        "TrainingTime": "1 week",
                        "TrainingDescription": "Review design systems and dashboard best practices",
                        "ImplementationTime": "3 weeks",
                        "ImplementationDescription": "Create wireframes and high-fidelity mockups",
                        "Other Remarks": "Focus on accessibility and responsive design"
                    },
                    {
                        "MemberRole": "Frontend Developer",
                        "TrainingTime": "1 week",
                        "TrainingDescription": "Learn React and D3.js visualization library",
                        "ImplementationTime": "4 weeks",
                        "ImplementationDescription": "Implement responsive dashboard components",
                        "Other Remarks": "Optimize for performance with large datasets"
                    },
                    {
                        "MemberRole": "Backend Developer",
                        "TrainingTime": "1 week",
                        "TrainingDescription": "Data aggregation patterns and caching strategies",
                        "ImplementationTime": "3 weeks",
                        "ImplementationDescription": "Build REST API for dashboard data",
                        "Other Remarks": "Implement efficient caching layer"
                    }
                ]
            }
        },
        {
            "project_name": "mobile_app",
            "project_data": {
                "ProjectName": "Mobile Payment Application",
                "ProjectDescription": "Cross-platform mobile app for secure digital payments and transaction history",
                "ProjectDuration": "4 months",
                "members": [
                    {
                        "MemberRole": "Mobile Developer",
                        "TrainingTime": "2 weeks",
                        "TrainingDescription": "Learn Flutter framework and secure coding practices",
                        "ImplementationTime": "8 weeks",
                        "ImplementationDescription": "Develop core application features and UI",
                        "Other Remarks": "Focus on offline functionality and performance"
                    },
                    {
                        "MemberRole": "Security Engineer",
                        "TrainingTime": "1 week",
                        "TrainingDescription": "Mobile security and encryption standards review",
                        "ImplementationTime": "3 weeks",
                        "ImplementationDescription": "Implement encryption and secure authentication",
                        "Other Remarks": "Ensure compliance with financial security standards"
                    },
                    {
                        "MemberRole": "QA Engineer",
                        "TrainingTime": "1 week",
                        "TrainingDescription": "Mobile testing frameworks and automation",
                        "ImplementationTime": "6 weeks",
                        "ImplementationDescription": "Create and execute test cases across platforms",
                        "Other Remarks": "Include extensive security testing scenarios"
                    },
                    {
                        "MemberRole": "Backend Developer",
                        "TrainingTime": "2 weeks",
                        "TrainingDescription": "Payment gateway integration methods",
                        "ImplementationTime": "5 weeks",
                        "ImplementationDescription": "Develop payment processing API and transaction system",
                        "Other Remarks": "Implement robust error handling for financial transactions"
                    }
                ]
            }
        },
        {
            "project_name": "cloud_migration",
            "project_data": {
                "ProjectName": "Legacy System Cloud Migration",
                "ProjectDescription": "Migrate on-premises ERP system to cloud infrastructure with minimal downtime",
                "ProjectDuration": "6 months",
                "members": [
                    {
                        "MemberRole": "Cloud Architect",
                        "TrainingTime": "2 weeks",
                        "TrainingDescription": "Review current infrastructure and plan cloud architecture",
                        "ImplementationTime": "8 weeks",
                        "ImplementationDescription": "Design and deploy cloud infrastructure components",
                        "Other Remarks": "Ensure compliance with security and governance requirements"
                    },
                    {
                        "MemberRole": "Database Engineer",
                        "TrainingTime": "3 weeks",
                        "TrainingDescription": "Cloud database migration strategies and tools",
                        "ImplementationTime": "10 weeks",
                        "ImplementationDescription": "Migrate databases with minimal downtime",
                        "Other Remarks": "Create comprehensive rollback strategy"
                    },
                    {
                        "MemberRole": "DevOps Engineer",
                        "TrainingTime": "2 weeks",
                        "TrainingDescription": "CI/CD pipeline setup for cloud environment",
                        "ImplementationTime": "6 weeks",
                        "ImplementationDescription": "Implement infrastructure as code and deployment automation",
                        "Other Remarks": "Focus on monitoring and alerting systems"
                    },
                    {
                        "MemberRole": "System Tester",
                        "TrainingTime": "1 week",
                        "TrainingDescription": "Performance testing methodology for cloud systems",
                        "ImplementationTime": "8 weeks",
                        "ImplementationDescription": "Conduct load testing and performance benchmarking",
                        "Other Remarks": "Document performance improvements and regressions"
                    }
                ]
            }
        },
        {
            "project_name": "nlp_sentiment",
            "project_data": {
                "ProjectName": "Customer Feedback Analysis",
                "ProjectDescription": "NLP system to analyze sentiment and key topics from customer feedback across channels",
                "ProjectDuration": "3 months",
                "members": [
                    {
                        "MemberRole": "NLP Engineer",
                        "TrainingTime": "2 weeks",
                        "TrainingDescription": "Review latest sentiment analysis techniques and models",
                        "ImplementationTime": "6 weeks",
                        "ImplementationDescription": "Implement text preprocessing and model training pipeline",
                        "Other Remarks": "Consider multilingual support requirements"
                    },
                    {
                        "MemberRole": "Data Engineer",
                        "TrainingTime": "1 week",
                        "TrainingDescription": "Data integration patterns for multiple text sources",
                        "ImplementationTime": "3 weeks",
                        "ImplementationDescription": "Build ETL pipeline for feedback aggregation",
                        "Other Remarks": "Handle varied text formats and sources consistently"
                    },
                    {
                        "MemberRole": "Visualization Developer",
                        "TrainingTime": "1 week",
                        "TrainingDescription": "Text visualization techniques and libraries",
                        "ImplementationTime": "4 weeks",
                        "ImplementationDescription": "Create interactive dashboards for sentiment trends",
                        "Other Remarks": "Focus on actionable insights for business teams"
                    }
                ]
            }
        }
    ]
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    for project in example_projects:
        # Convert project data to JSON string
        project_data_json = json.dumps(project["project_data"])
        
        # Insert project
        c.execute('''
            INSERT OR REPLACE INTO projects (project_name, project_data)
            VALUES (?, ?)
        ''', (project["project_name"], project_data_json))
    
    conn.commit()
    conn.close()
    
    print(f"Initialized database with {len(example_projects)} example projects")