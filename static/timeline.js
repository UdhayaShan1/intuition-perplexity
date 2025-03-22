const currentProject = localStorage.getItem("currentProject") || "project1";
let taskAssignments = {}; // Store task assignments: {taskId: employeeName}

document.addEventListener("DOMContentLoaded", () => {
    const spinner = document.getElementById("loading-spinner");
    spinner.style.display = "block"; // Show loading spinner

    const urlParams = new URLSearchParams(window.location.search);
    projectId = urlParams.get('id') || localStorage.getItem("currentProjectId");

    console.log("using chatbot for project: ", projectId);

    fetch(`/ai_generate_timeline?project_name=${projectId}`)
        .then(res => res.json())
        .then(data => {
            spinner.style.display = "none"; // Hide spinner
            renderAITimeline(data);
            checkAllTasksAssigned(); // Check initially in case we already have assignments
        })
        .catch(err => {
            spinner.style.display = "none"; // Hide on error too
            document.getElementById("timeline-container").innerText = "Error loading AI-generated timeline.";
            console.error(err);
        });
});


function renderAITimeline(data) {
    const container = document.getElementById("timeline-container");
    container.innerHTML = "";

    const considered = data.consideredEmployees;
    console.log("Looking for:", data.timeline[0]?.recommendations?.[0]?.name || "N/A");
    console.log("Available employees:", considered);

    // ✅ Fix: Ensure we are setting the global variable correctly
    window.allEmployees = considered || [];

    const title = document.createElement('h2');
    title.innerText = `📌 Project: ${data.generalTask}`;
    container.appendChild(title);

    data.timeline.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'timeline-card';
        card.dataset.taskId = index; // Add task ID as data attribute

        const infoHTML = `
            <h3>👤 Member ${item.member} - ${item.role}</h3>
            <p><strong>📝 Summary:</strong> ${item.summary}</p>
            <p><strong>🧠 Task:</strong> ${item.task_description}</p>
            <p><strong>📘 Training Time:</strong> ${item.training_time_days} day(s)</p>
            <p><strong>💻 Implementation Time:</strong> ${item.implementation_time_days} day(s)</p>
            <p><strong>🧮 Total Duration:</strong> ${item.total_duration_days} day(s)</p>
            <p><strong>📅 Start Date:</strong> ${item.start_date}</p>
            <p><strong>📅 End Date:</strong> ${item.end_date}</p>
        `;

        card.innerHTML = infoHTML;

        // Recommendations section below
        if (item.recommendations && item.recommendations.length > 0) {
            const recommendBox = document.createElement('div');
            recommendBox.className = 'recommend-box';
            recommendBox.innerHTML = `
                <h4>🌟 Top 3 Recommended Employees</h4>
                <ul>
                    ${item.recommendations.map(rec => `
                        <li>
                            <strong><a onclick="showEmployeeDetails('${rec.name}', ${index})" class="employee-link">${rec.name}</a></strong>: ${rec.reason}
                        </li>
                    `).join("")
                    }
                </ul>
            `;
            card.appendChild(recommendBox);
        }

        container.appendChild(card);
    });

    if (data.caution) {
        const cautionBox = document.createElement('div');
        cautionBox.className = 'caution-box';
        cautionBox.innerHTML = `
            <h2>⚠️ Caution / Recommendations</h2>
            <p>${data.caution}</p>
        `;
        container.appendChild(cautionBox);
    }
    
    // Add submit plan button container (hidden initially)
    const submitContainer = document.createElement('div');
    submitContainer.id = 'submit-plan-container';
    submitContainer.className = 'submit-plan-container';
    submitContainer.style.display = 'none';
    submitContainer.innerHTML = `
        <button id="submit-plan-button" class="btn submit-btn">Submit Final Plan</button>
    `;
    container.appendChild(submitContainer);
    
    document.getElementById('submit-plan-button').addEventListener('click', submitPlan);
}

function showEmployeeDetails(name, taskId) {
    console.log("Looking for:", name);
    console.log("Available employees:", window.allEmployees?.map(e => e.name));

    const emp = window.allEmployees?.find(e => 
        e.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (!emp) {
        alert("Employee details not found.");
        return;
    }

    const data = emp.employee_data || emp; 
    
    // Get current task
    const currentTask = document.querySelector(`.timeline-card[data-task-id="${taskId}"]`);
    const taskInfo = currentTask ? currentTask.querySelector('h3').textContent : 'Current Task';
    
    // Check if this task already has an assignment
    const currentlyAssigned = taskAssignments[taskId];
    let assignButtonHtml = '';
    
    if (currentlyAssigned && currentlyAssigned !== name) {
        // Someone else is already assigned to this task
        assignButtonHtml = `
            <button class="btn assign-btn" disabled>❌ Task Already Assigned to ${currentlyAssigned}</button>
        `;
    } else if (currentlyAssigned === name) {
        // This person is already assigned
        assignButtonHtml = `
            <button class="btn assign-btn assigned" disabled>✓ Already Assigned</button>
        `;
    } else {
        // Task is available for assignment
        assignButtonHtml = `
            <button class="btn assign-btn" onclick="assignEmployee('${name}', '${taskInfo.replace(/'/g, "\\'")}', ${taskId})">✅ Assign</button>
        `;
    }

    const html = `
        <h3>${emp.name}</h3>
        <p><strong>Department:</strong> ${emp.department || 'N/A'}</p>
        <p><strong>Years with Company:</strong> ${emp.years_with_company || 'N/A'}</p>
        <p><strong>General Interests:</strong> ${(data.general_interests || []).join(', ')}</p>
        <p><strong>Skills:</strong> ${(data.skills || []).join(', ')}</p>
        <p><strong>Personalities:</strong> ${(data.personalities || []).join(', ')}</p>
        <div class="button-group">
            <button class="btn contact-btn">📩 Contact</button>
            ${assignButtonHtml}
        </div>
        <div id="assignment-message" class="assignment-message" style="display: none; margin-top: 15px;"></div>
    `;

    document.getElementById("employee-modal-body").innerHTML = html;
    document.getElementById("employee-modal").style.display = "flex";
}

function assignEmployee(name, taskInfo, taskId) {
    // Get employee data
    const emp = window.allEmployees?.find(e => 
        e.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    
    if (!emp) return;
    
    // Update the UI to show assignment
    const msgDiv = document.getElementById("assignment-message");
    msgDiv.innerHTML = `<div class="success-message">
        <p>✅ <strong>${emp.name}</strong> has been assigned to <strong>${taskInfo}</strong>!</p>
    </div>`;
    msgDiv.style.display = "block";
    
    // Change the assign button to indicate assignment
    const assignBtn = document.querySelector(".assign-btn");
    assignBtn.textContent = "✓ Assigned";
    assignBtn.classList.add("assigned");
    assignBtn.disabled = true;
    
    // Also update the timeline card to show this person is assigned
    const currentTask = document.querySelector(`.timeline-card[data-task-id="${taskId}"]`);
    
    if (currentTask) {
        // Remove any previous assignment for this task
        const existingAssignmentSection = currentTask.querySelector('.assignments-section');
        if (existingAssignmentSection) {
            existingAssignmentSection.remove();
        }
        
        // Create a new assignments section
        const assignmentSection = document.createElement('div');
        assignmentSection.className = 'assignments-section';
        assignmentSection.innerHTML = '<h4>✅ Assigned Employee</h4>';
        
        // Create a list to hold assignments
        const assignmentList = document.createElement('ul');
        assignmentList.className = 'assignment-list';
        assignmentSection.appendChild(assignmentList);
        
        // Add the section after recommendations (or at the end of the card if no recommendations)
        const recommendBox = currentTask.querySelector('.recommend-box');
        if (recommendBox) {
            currentTask.insertBefore(assignmentSection, recommendBox.nextSibling);
        } else {
            currentTask.appendChild(assignmentSection);
        }
        
        // Add this employee to the assignments list
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${emp.name}</strong> - Assigned ${new Date().toLocaleDateString()}`;
        assignmentList.appendChild(listItem);
        
        // Store the assignment in our task assignments object
        taskAssignments[taskId] = name;
    }
    
    // Check if all tasks are now assigned
    checkAllTasksAssigned();
}

function checkAllTasksAssigned() {
    const allCards = document.querySelectorAll('.timeline-card');
    let allAssigned = true;
    
    // Check each task card to see if it has an assignment
    allCards.forEach((card, index) => {
        if (!taskAssignments[index]) {
            allAssigned = false;
        }
    });
    
    // Show/hide submit button based on whether all tasks are assigned
    const submitContainer = document.getElementById('submit-plan-container');
    if (submitContainer) {
        submitContainer.style.display = allAssigned ? 'block' : 'none';
    }
}


function submitPlan() {
    const submitBtn = document.getElementById('submit-plan-button');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // Prepare the data to send
    const assignmentData = [];
    
    // For each task assignment, create a data entry
    for (const taskId in taskAssignments) {
        assignmentData.push({
            employeeName: taskAssignments[taskId],
            projectId: projectId,
            taskId: taskId
        });
    }
    
    // Send the assignments to the server
    fetch('/submit_plan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            projectId: projectId,
            assignments: assignmentData
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        
        // Show success message
        alert('Plan submitted successfully! Returning to project page.');
        
        // Redirect back to the project page
        window.location.href = `/project?id=${projectId}`;
    })
    .catch(error => {
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Final Plan';
        alert('Failed to submit plan. Please try again.');
    });
}

function closeModal() {
    document.getElementById("employee-modal").style.display = "none";
}