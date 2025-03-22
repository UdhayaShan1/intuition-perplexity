let projectData = {
    generalTask: "",
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
            document.getElementById("general-task-text").value = data.generalTask || "";
            console.log("Type of members:", typeof data.members);
            console.log("Is array:", Array.isArray(data.members));
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

    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.placeholder = 'Overview of the Project';
    taskInput.className = 'task-input';
    taskInput.value = data.task || '';

    const implTextarea = document.createElement('textarea');
    implTextarea.placeholder = 'Possible overall implementations to do';
    implTextarea.className = 'implementation-box';
    implTextarea.value = data.implementation || '';

    const trainingTextarea = document.createElement('textarea');
    trainingTextarea.placeholder = 'Trainings/Courses to do';
    trainingTextarea.className = 'training-box';
    trainingTextarea.value = data.training || '';

    const note = document.createElement('textarea');
    note.className = 'note-box';
    note.placeholder = 'Remarks';
    note.value = data.remarks || '';

    // Listen for edits
    [taskInput, implTextarea, trainingTextarea, note].forEach(input => {
        input.addEventListener('input', () => updateProjectData());
    });

    rightSide.appendChild(taskInput);
    rightSide.appendChild(implTextarea);
    rightSide.appendChild(trainingTextarea);
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
            task: inputs[0].value,
            implementation: inputs[1].value,
            training: inputs[2].value,
            remarks: inputs[3].value
        });
    });
    projectData.generalTask = document.getElementById("general-task-text").value;
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
