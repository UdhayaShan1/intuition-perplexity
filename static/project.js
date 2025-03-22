let projectData = {
    ProjectName: "",
    ProjectDescription: "",
    ProjectDuration: "",
    members: []
};

let currentProject = "project1"; // Changeable
localStorage.setItem("currentProject", currentProject);

document.addEventListener("DOMContentLoaded", () => {
    // Load from DB
    fetch(`/load_project?project_name=${currentProject}`)
        .then(res => res.json())
        .then(data => {
            console.log("Loaded data:", data);
            projectData = data;
            document.getElementById("project-name").value = data.ProjectName || "";
            document.getElementById("project-description").value = data.ProjectDescription || "";
            document.getElementById("project-duration").value = data.ProjectDuration || "";
            data.members.forEach(member => addMember(member));
        });

    document.getElementById("gentimeline").addEventListener("click", () => {
        saveProject();  // Optional: save before navigating
        window.location.href = "/timeline";
    });
});

function addMember(data = {}) {
    console.log("Adding member:", data);
    const container = document.createElement('div');
    container.className = 'member-container';

    const thumbnail = document.createElement('div');
    thumbnail.className = 'thumbnail';
    thumbnail.innerText = 'No image';

    const rightSide = document.createElement('div');
    rightSide.className = 'member-details';

    const roleInput = document.createElement('input');
    roleInput.type = 'text';
    roleInput.placeholder = 'Member Role';
    roleInput.className = 'role-input';
    roleInput.value = data.MemberRole || '';

    const trainingTimeInput = document.createElement('input');
    trainingTimeInput.type = 'text';
    trainingTimeInput.placeholder = 'Training Time';
    trainingTimeInput.className = 'training-time-input';
    trainingTimeInput.value = data.TrainingTime || '';

    const trainingDescTextarea = document.createElement('textarea');
    trainingDescTextarea.placeholder = 'Training Description';
    trainingDescTextarea.className = 'training-desc-box';
    trainingDescTextarea.value = data.TrainingDescription || '';

    const implTimeInput = document.createElement('input');
    implTimeInput.type = 'text';
    implTimeInput.placeholder = 'Implementation Time';
    implTimeInput.className = 'impl-time-input';
    implTimeInput.value = data.ImplementationTime || '';

    const implDescTextarea = document.createElement('textarea');
    implDescTextarea.placeholder = 'Implementation Description';
    implDescTextarea.className = 'impl-desc-box';
    implDescTextarea.value = data.ImplementationDescription || '';

    const note = document.createElement('textarea');
    note.className = 'note-box';
    note.placeholder = 'Other Remarks';
    note.value = data["Other Remarks"] || '';

    // Listen for edits
    [roleInput, trainingTimeInput, trainingDescTextarea, implTimeInput, implDescTextarea, note].forEach(input => {
        input.addEventListener('input', () => updateProjectData());
    });

    rightSide.appendChild(roleInput);
    rightSide.appendChild(trainingTimeInput);
    rightSide.appendChild(trainingDescTextarea);
    rightSide.appendChild(implTimeInput);
    rightSide.appendChild(implDescTextarea);
    rightSide.appendChild(note);

    container.appendChild(thumbnail);
    container.appendChild(rightSide);
    document.getElementById("members").appendChild(container);
}

function updateProjectData() {
    const containers = document.querySelectorAll('.member-container');
    projectData.members = [];
    containers.forEach(container => {
        const inputs = container.querySelectorAll('input, textarea');
        projectData.members.push({
            MemberRole: inputs[0].value,
            TrainingTime: inputs[1].value,
            TrainingDescription: inputs[2].value,
            ImplementationTime: inputs[3].value,
            ImplementationDescription: inputs[4].value,
            "Other Remarks": inputs[5].value
        });
    });
    projectData.ProjectName = document.getElementById("project-name").value;
    projectData.ProjectDescription = document.getElementById("project-description").value;
    projectData.ProjectDuration = document.getElementById("project-duration").value;
}

function saveProject() {
    updateProjectData();
    fetch(`/save_project?project_name=${currentProject}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
    })
    .then(res => res.json())
    .then(response => {
        console.log("Saved:", response.status);
    })
    .catch(err => {
        console.error("Save failed:", err);
    });
}