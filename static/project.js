let projectData = {
    ProjectName: "",
    ProjectDescription: "",
    ProjectDuration: "",
    members: []
};

let projectId = ""; // Unique identifier for the project
let autoSaveTimer;
let hasUnsavedChanges = false;

document.addEventListener("DOMContentLoaded", () => {
    // Get projectId from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    projectId = urlParams.get('id') || localStorage.getItem("currentProjectId");
    
    if (!projectId) {
        // If no project ID, generate a new one using timestamp and random number
        projectId = `project_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem("currentProjectId", projectId);
    }
    
    console.log(`Loading project with ID: ${projectId}`);

    // Load from DB
    fetch(`/load_project?project_name=${encodeURIComponent(projectId)}`)
        .then(res => res.json())
        .then(data => {
            console.log("Loaded data:", data);
            projectData = data;
            document.getElementById("project-name").value = data.ProjectName || "";
            document.getElementById("project-description").value = data.ProjectDescription || "";
            document.getElementById("project-duration").value = data.ProjectDuration || "";
            if (data.members && data.members.length > 0) {
                data.members.forEach(member => addMember(member));
            }
        });

    // Save button
    document.getElementById("save-project").addEventListener("click", () => {
        console.log("Save button clicked");
        saveProject();
    });

    document.getElementById("gentimeline").addEventListener("click", () => {
        saveProject();  // Save before navigating
        window.location.href = `/timeline?id=${encodeURIComponent(projectId)}`;
    });

    // Add input event listeners to the project fields
    document.getElementById("project-name").addEventListener("input", () => {
        updateProjectData();
        scheduleAutoSave();
    });
    
    document.getElementById("project-description").addEventListener("input", () => {
        updateProjectData();
        scheduleAutoSave();
    });
    
    document.getElementById("project-duration").addEventListener("input", () => {
        updateProjectData();
        scheduleAutoSave();
    });

    // Save before leaving the page
    window.addEventListener("beforeunload", function(e) {
        if (hasUnsavedChanges) {
            saveProject();
            // Most browsers ignore this message now, but it's still required to trigger the beforeunload dialog
            e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        }
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

    const removeButton = document.createElement('button');
    removeButton.className = 'btn btn-danger mt-2';
    removeButton.innerText = 'Remove';
    removeButton.addEventListener('click', () => {
        container.remove();
        updateProjectData();
        saveProject(); // Save the project data after removing a member
    });

    // Listen for edits
    [roleInput, trainingTimeInput, trainingDescTextarea, implTimeInput, implDescTextarea, note].forEach(input => {
        input.addEventListener('input', () => {
            updateProjectData();
            scheduleAutoSave();
        });
    });

    rightSide.appendChild(roleInput);
    rightSide.appendChild(trainingTimeInput);
    rightSide.appendChild(trainingDescTextarea);
    rightSide.appendChild(implTimeInput);
    rightSide.appendChild(implDescTextarea);
    rightSide.appendChild(note);
    rightSide.appendChild(removeButton);

    container.appendChild(thumbnail);
    container.appendChild(rightSide);
    document.getElementById("members").appendChild(container);
}

function scheduleAutoSave() {
    hasUnsavedChanges = true;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveProject();
    }, 3000); // Auto-save after 3 seconds of inactivity
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
    console.log("saveProject function called");
    updateProjectData();
    
    console.log("Project data updated:", projectData);
    console.log(`Saving project with ID: ${projectId}`);
    
    console.log(`Sending POST request to /save_project?project_name=${encodeURIComponent(projectId)}`);
    fetch(`/save_project?project_name=${encodeURIComponent(projectId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
    })
    .then(res => {
        console.log("Response received:", res.status);
        return res.json();
    })
    .then(response => {
        console.log("Saved:", response.status);
        hasUnsavedChanges = false; // Reset the unsaved changes flag
    })
    .catch(err => {
        console.error("Save failed:", err);
    });
}