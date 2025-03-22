const currentProject = localStorage.getItem("currentProject") || "project1";

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

    data.timeline.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'timeline-card';

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
                            <strong><a onclick="showEmployeeDetails('${rec.name}')" class="employee-link">${rec.name}</a></strong>: ${rec.reason}
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
}

function showEmployeeDetails(name) {
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

    const html = `
        <h3>${emp.name}</h3>
        <p><strong>Department:</strong> ${emp.department || 'N/A'}</p>
        <p><strong>Years with Company:</strong> ${emp.years_with_company || 'N/A'}</p>
        <p><strong>General Interests:</strong> ${(data.general_interests || []).join(', ')}</p>
        <p><strong>Skills:</strong> ${(data.skills || []).join(', ')}</p>
        <p><strong>Personalities:</strong> ${(data.personalities || []).join(', ')}</p>
        <div class="button-group">
            <button class="btn contact-btn">📩 Contact</button>
            <button class="btn assign-btn">✅ Assign</button>
        </div>
    `;

    document.getElementById("employee-modal-body").innerHTML = html;
    document.getElementById("employee-modal").style.display = "flex";
}
function closeModal() {
    document.getElementById("employee-modal").style.display = "none";
}
