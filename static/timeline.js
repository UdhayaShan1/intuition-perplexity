let projectId = ""; // Store the current project ID
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
            console.log("Data received:", data);
            renderGanttChart(data);
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

        // Create editable fields with initial values from the data
        const infoHTML = `
            <h3>👤 Member ${item.member} - ${item.role}</h3>
            <div class="editable-fields">
                <div class="field-group">
                    <label><strong>📝 Summary:</strong></label>
                    <input type="text" class="editable-field" data-field="summary" value="${item.summary || ''}" />
                </div>
                <div class="field-group">
                    <label><strong>🧠 Task:</strong></label>
                    <textarea class="editable-field" data-field="task_description">${item.task_description || ''}</textarea>
                </div>
                <div class="field-group">
                    <label><strong>📘 Training Time:</strong></label>
                    <div class="input-with-unit">
                        <input type="number" min="0" class="editable-field" data-field="training_time_days" value="${item.training_time_days || 0}" />
                        <span>day(s)</span>
                    </div>
                </div>
                <div class="field-group">
                    <label><strong>💻 Implementation Time:</strong></label>
                    <div class="input-with-unit">
                        <input type="number" min="0" class="editable-field" data-field="implementation_time_days" value="${item.implementation_time_days || 0}" />
                        <span>day(s)</span>
                    </div>
                </div>
                <div class="field-group">
                    <label><strong>📅 Start Date:</strong></label>
                    <input type="date" class="editable-field" data-field="start_date" value="${item.start_date || ''}" />
                </div>
                <div class="field-group">
                    <label><strong>📅 End Date:</strong></label>
                    <input type="date" class="editable-field" data-field="end_date" value="${item.end_date || ''}" disabled />
                    <small class="help-text">End date is calculated automatically</small>
                </div>
            </div>
            <button class="btn update-chart-btn">Update Gantt Chart</button>
        `;

        card.innerHTML = infoHTML;
        
        // Add event listeners for real-time total calculation
        const updateTotalDuration = (taskCard) => {
            const trainingDays = parseInt(taskCard.querySelector('[data-field="training_time_days"]').value) || 0;
            const implDays = parseInt(taskCard.querySelector('[data-field="implementation_time_days"]').value) || 0;
            const totalDays = trainingDays + implDays;
            
            // Update end date based on start date and total duration
            const startDateInput = taskCard.querySelector('[data-field="start_date"]');
            const endDateInput = taskCard.querySelector('[data-field="end_date"]');
            
            if (startDateInput.value) {
                const startDate = new Date(startDateInput.value);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + totalDays);
                
                // Format as YYYY-MM-DD for the input
                const endDateStr = endDate.toISOString().split('T')[0];
                endDateInput.value = endDateStr;
                
                // Update the data item
                const taskId = parseInt(taskCard.dataset.taskId);
                if (!isNaN(taskId) && data.timeline[taskId]) {
                    data.timeline[taskId].end_date = endDateStr;
                    data.timeline[taskId].total_duration_days = totalDays;
                }
            }
        };
        
        // Add input event listeners to update the data model
        card.querySelectorAll('.editable-field').forEach(input => {
            input.addEventListener('change', function() {
                const taskId = parseInt(card.dataset.taskId);
                const fieldName = this.dataset.field;
                
                if (!isNaN(taskId) && data.timeline[taskId]) {
                    // Update the data model with the new value
                    data.timeline[taskId][fieldName] = this.value;
                    
                    // If we changed training or implementation days, or start date, recalculate end date
                    if (['training_time_days', 'implementation_time_days', 'start_date'].includes(fieldName)) {
                        updateTotalDuration(card);
                    }
                }
            });
        });
        
        // Add update button event listener
        card.querySelector('.update-chart-btn').addEventListener('click', function() {
            // Re-render the chart with updated data
            renderGanttChart(data);
        });

        container.appendChild(card);
    });

    // Add some CSS for the editable fields
    const style = document.createElement('style');
    style.textContent = `
        .editable-fields {
            margin-top: 10px;
        }
        .field-group {
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
        }
        .field-group label {
            min-width: 180px;
            margin-right: 10px;
            padding-top: 5px;
        }
        .editable-field {
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
            flex: 1;
            font-size: 14px;
        }
        textarea.editable-field {
            min-height: 60px;
            resize: vertical;
        }
        .input-with-unit {
            display: flex;
            align-items: center;
        }
        .input-with-unit input {
            width: 60px;
            margin-right: 5px;
        }
        .help-text {
            display: block;
            color: #777;
            font-size: 12px;
            margin-top: 2px;
        }
        .update-chart-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            margin: 10px 0;
            cursor: pointer;
            border-radius: 4px;
        }
        .update-chart-btn:hover {
            background-color: #45a049;
        }
    `;
    document.head.appendChild(style);

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
            <button class="btn contact-btn" onclick="generateEmail('${emp.name}')">📩 Contact</button>
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

function generateEmail(employeeName) {
    const prompt = `Write a professional email to congratulate ${employeeName} for being selected to join a new work project.;`
    fetch('/generate_email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
    })
    .then(response => response.json())
    .then(data => {
        const emailContent = encodeURIComponent(data.email);
        const subject = encodeURIComponent(`Congratulations ${employeeName}`);
        const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${emailContent};`
        window.open(mailtoLink, '_blank');
    })
    .catch(error => {
        console.error('Error generating email:', error);
        alert('Failed to generate email.');
    });
}

function renderGanttChart(data) {
    console.log("Rendering Gantt charts with data:", data);
  
    const container = document.getElementById('gantt-chart-container');
    container.innerHTML = `
      <div class="chart-row">
        <div class="chart-column">
          <h4 class="chart-title">Training Phase</h4>
          <div class="chart-wrapper">
            <canvas id="trainingChartCanvas"></canvas>
          </div>
        </div>
        <div class="chart-column">
          <h4 class="chart-title">Implementation Phase</h4>
          <div class="chart-wrapper">
            <canvas id="implementationChartCanvas"></canvas>
          </div>
        </div>
      </div>
    `;
    // Add styling for the new layout with fixed height
    const style = document.createElement('style');
    style.textContent = `
      .chart-row {
        display: flex;
        width: 100%;
        gap: 20px;
      }
      .chart-column {
        flex: 1;
        min-width: 0;
      }
      .chart-title {
        text-align: center;
        margin-bottom: 10px;
      }
      .chart-wrapper {
        height: 500px; /* Fixed height for charts */
        position: relative;
      }
    `;
    document.head.appendChild(style);
  
    if (!data.timeline || !Array.isArray(data.timeline) || data.timeline.length === 0) {
      container.innerHTML = '<p class="text-center">No timeline data available to display in the chart.</p>';
      return;
    }
  
    try {
      const colorPalette = [
        "#ff6384", "#36a2eb", "#ffce56", "#4bc0c0",
        "#9966ff", "#c9cbcf", "#ff9f40", "#7ccc63",
        "#f27173", "#6c8ebf"
      ];
  
      // Step 1: Convert the data to include both training and implementation phases
      const processedData = [];
      
      // If data contains separate training/implementation entries
      if (data.timeline[0].hasOwnProperty('phase')) {
        // Data is already split into training and implementation
        processedData.push(...data.timeline);
      } else {
        // Convert single entries into separate training and implementation entries
        data.timeline.forEach(item => {
          const trainingStartDate = new Date(item.start_date);
          const trainingEndDate = new Date(trainingStartDate);
          trainingEndDate.setDate(trainingEndDate.getDate() + item.training_time_days);
          
          const implementationStartDate = new Date(trainingEndDate);
          const implementationEndDate = new Date(item.end_date);
          
          // Add training phase
          processedData.push({
            member: item.member,
            role: item.role,
            phase: "Training",
            start_date: item.start_date,
            end_date: trainingEndDate.toISOString().split('T')[0],
            summary: item.summary,
            task_description: item.task_description,
            duration_days: item.training_time_days
          });
          
          // Add implementation phase
          processedData.push({
            member: item.member,
            role: item.role,
            phase: "Implementation",
            start_date: trainingEndDate.toISOString().split('T')[0],
            end_date: item.end_date,
            summary: item.summary,
            task_description: item.task_description,
            duration_days: item.implementation_time_days
          });
        });
      }
  
      // Filter training and implementation data
      const trainingData = processedData.filter(item => item.phase === "Training");
      const implementationData = processedData.filter(item => item.phase === "Implementation");
  
      // Create simplified program objects for each phase
      const trainingPrograms = trainingData.map(item => ({
        name: item.role || `Member ${item.member}`,
        start: new Date(item.start_date),
        end: new Date(item.end_date),
        member: item.member.toString(),
        summary: item.summary || "",
        task_description: item.task_description || "",
        duration_days: item.duration_days || 0
      }));
      
      const implementationPrograms = implementationData.map(item => ({
        name: item.role || `Member ${item.member}`,
        start: new Date(item.start_date),
        end: new Date(item.end_date),
        member: item.member.toString(),
        summary: item.summary || "",
        task_description: item.task_description || "",
        duration_days: item.duration_days || 0
      }));
  
      // Step 2: Prepare and render both charts
      const memberColors = {};
      const uniqueMembers = [...new Set(processedData.map(p => p.member.toString()))];
      uniqueMembers.forEach((member, index) => {
        memberColors[member] = colorPalette[index % colorPalette.length];
      });
  
  
      // Render training chart
      renderPhaseChart(
        trainingPrograms,
        "trainingChartCanvas",
        memberColors,
        uniqueMembers,
        "Training Phase"
      );
  
      // Render implementation chart
      renderPhaseChart(
        implementationPrograms,
        "implementationChartCanvas",
        memberColors,
        uniqueMembers,
        "Implementation Phase"
      );
  
      console.log("Gantt charts created successfully");
    } catch (e) {
      console.error("Error creating Gantt charts:", e);
      container.innerHTML = `<p class="text-center">Error creating charts: ${e.message}</p>`;
    }
  }
  
  function renderPhaseChart(programs, canvasId, memberColors, uniqueMembers, phaseTitle) {
    // Filter out any programs with invalid dates
    const validPrograms = programs.filter(
      p => !isNaN(p.start.getTime()) && !isNaN(p.end.getTime())
    );
  
    if (validPrograms.length === 0) {
      document.getElementById(canvasId).closest('.chart-column').innerHTML = 
        `<p class="text-center">No valid date data available for ${phaseTitle}.</p>`;
      return;
    }
  
    validPrograms.forEach(prog => {
      prog.color = memberColors[prog.member];
    });
  
    // Sort by start date
    validPrograms.sort((a, b) => a.start - b.start);
  
    // Assign to non-overlapping lanes
    const columns = []; // each index stores the latest end date in that column
    const chartData = [];
  
    validPrograms.forEach(prog => {
      // Find the first column where this program doesn't overlap
      let assignedColumn = 0;
      while (columns[assignedColumn] && columns[assignedColumn] > prog.start) {
        assignedColumn++;
      }
      
      // Update the column's end date
      columns[assignedColumn] = prog.end;
      
      // Lane name for this program
      const lane = `Lane ${assignedColumn + 1}`;
      
      chartData.push({
        x: lane,
        y: [prog.start, prog.end],
        backgroundColor: prog.color,
        borderColor: "#000000",
        borderWidth: 1,
        member: prog.member,
        role: prog.name,
        summary: prog.summary,
        task: prog.task_description,
        duration: prog.duration_days
      });
    });
  
    // Calculate min and max dates for chart scaling
    const allDates = validPrograms.flatMap(p => [p.start, p.end]);
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    
    // Add padding to min/max dates
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);
  
    const ctx = document.getElementById(canvasId).getContext("2d");
  
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        datasets: [{
          label: phaseTitle,
          data: chartData,
          backgroundColor: chartData.map(d => d.backgroundColor),
          borderColor: chartData.map(d => d.borderColor),
          borderWidth: 1,
          borderSkipped: false,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        }]
      },
      options: {
        indexAxis: "x",
        responsive: true,
        maintainAspectRatio: false, // This is important for fixed height
        layout: {
          padding: {
            top: 5,
            bottom: 5
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              generateLabels: function(chart) {
                return uniqueMembers.map((member) => {
                  return {
                    text: `Member ${member}`,
                    fillStyle: memberColors[member],
                    strokeStyle: '#000',
                    lineWidth: 1,
                    hidden: false
                  }
                });
              }
            },
            onClick: function(e, legendItem, legend) {
              const member = uniqueMembers[legendItem.index];
              const chart = legend.chart;
              
              const meta = chart.getDatasetMeta(0);
              chartData.forEach((dataPoint, i) => {
                if (dataPoint.member === member) {
                  meta.data[i].hidden = !meta.data[i].hidden;
                }
              });
              
              chart.update();
            }
          },
          tooltip: {
            callbacks: {
              title: context => context[0].raw.role,
              label: context => {
                const d = context.raw;
                return [
                  `Member ${d.member}`,
                  `From: ${new Date(d.y[0]).toLocaleDateString()}`,
                  `To: ${new Date(d.y[1]).toLocaleDateString()}`,
                  `Duration: ${d.duration} days`,
                  `Summary: ${d.summary}`,
                  `Task: ${d.task}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            type: "category",
            title: { display: true, text: "Parallel Lanes" },
            grid: { display: false }
          },
          y: {
            type: "time",
            min: minDate,
            max: maxDate,
            time: {
              unit: 'month',
              displayFormats: {
                month: 'MMM yyyy'
              },
              tooltipFormat: 'MMM dd, yyyy'
            },
            title: { display: true, text: "Timeline" }
          }
        }
      }
    });
  
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
              <button class="btn contact-btn" onclick="generateEmail('${emp.name}')">📩 Contact</button>
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
  
  function generateEmail(employeeName) {
      const prompt = `Write a professional email to congratulate ${employeeName} for being selected to join a new work project.;`
      fetch('/generate_email', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt })
      })
      .then(response => response.json())
      .then(data => {
          const emailContent = encodeURIComponent(data.email);
          const subject = encodeURIComponent(`Congratulations ${employeeName}`);
          const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${emailContent};`
          window.open(mailtoLink, '_blank');
      })
      .catch(error => {
          console.error('Error generating email:', error);
          alert('Failed to generate email.');
      });
  
  }}