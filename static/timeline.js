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

    const title = document.createElement('h2');
    title.innerText = `📌 Project: ${data.generalTask}`;
    container.appendChild(title);

    data.timeline.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'timeline-card';

        let recHTML = "";
        if (item.recommendations && item.recommendations.length > 0) {
            recHTML = "<p><strong>Top 3 Employee Matches:</strong></p><ul>";
            item.recommendations.forEach(rec => {
                recHTML += `<li><strong>${rec.name}</strong>: ${rec.reason}</li>`;
            });
            recHTML += "</ul>";
        }

        card.innerHTML = `
            <h3>👤 Member ${item.member} - ${item.role}</h3>
            <p><strong>📝 Summary:</strong> ${item.summary}</p>
            <p><strong>🧠 Task:</strong> ${item.task_description}</p>
            <p><strong>📘 Training Time:</strong> ${item.training_time_days} day(s)</p>
            <p><strong>💻 Implementation Time:</strong> ${item.implementation_time_days} day(s)</p>
            <p><strong>🧮 Total Duration:</strong> ${item.total_duration_days} day(s)</p>
            <p><strong>📅 Start Date:</strong> ${item.start_date}</p>
            <p><strong>📅 End Date:</strong> ${item.end_date}</p>
            ${recHTML}
        `;

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
