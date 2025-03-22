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
    
    // Check if this is a request for a new project
    if (urlParams.get('new') === 'true') {
        // Clear localStorage and generate a new ID for a new project
        projectId = `project_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem("currentProjectId", projectId);
        
        // Set empty project data
        projectData = {
            ProjectName: "",
            ProjectDescription: "",
            ProjectDuration: "",
            members: []
        };
        
        // Update the form with empty values
        document.getElementById("project-name").value = "";
        document.getElementById("project-description").value = "";
        document.getElementById("project-duration").value = "";
        
        // Clear any existing members
        document.getElementById("members").innerHTML = "";
        
        console.log(`Created new project with ID: ${projectId}`);
    } else {
        // If not a new project, try to get the ID from URL or localStorage
        projectId = urlParams.get('id') || localStorage.getItem("currentProjectId");
        
        if (projectId) {
            localStorage.setItem("currentProjectId", projectId);
            
            console.log(`Loading existing project with ID: ${projectId}`);
            
            // Load from DB
            loadProjectData(projectId);
        } else {
            // If no ID was found, create a new project
            projectId = `project_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            localStorage.setItem("currentProjectId", projectId);
            console.log(`No project ID found, creating new with ID: ${projectId}`);
        }
    }

    // Save button
    document.getElementById("save-project").addEventListener("click", () => {
        console.log("Save button clicked");
        saveProject();
    });

    document.getElementById("gentimeline").addEventListener("click", () => {
        saveProject()
            .then(() => {
                // Only navigate after save is complete
                window.location.href = `/timeline?id=${encodeURIComponent(projectId)}`;
            })
            .catch(err => {
                console.error("Error saving before timeline:", err);
                if (confirm("Failed to save project. Continue to timeline anyway?")) {
                    window.location.href = `/timeline?id=${encodeURIComponent(projectId)}`;
                }
            });
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

    // Add refresh button handler if it exists
    const refreshButton = document.getElementById("refresh-project");
    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            if (hasUnsavedChanges) {
                if (confirm("You have unsaved changes. Refreshing will discard these changes. Continue?")) {
                    loadProjectData(projectId);
                    hasUnsavedChanges = false;
                }
            } else {
                loadProjectData(projectId);
            }
        });
    }
});

function loadProjectData(id) {
    console.log(`Loading project data for ID: ${id}`);
    
    // Clear current data
    document.getElementById("members").innerHTML = "";
    
    // Load fresh data from DB
    return fetch(`/load_project?project_name=${encodeURIComponent(id)}`)
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
            console.log(`Loaded ${data.members ? data.members.length : 0} members from database`);
            return data;
        })
        .catch(err => {
            console.error("Error loading project data:", err);
        });
}

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

    // In your addMember function, update the removeButton event listener:
    const removeButton = document.createElement('button');
    removeButton.className = 'btn btn-danger mt-2';
    removeButton.innerText = 'Remove';
    removeButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to remove this member?")) {
            console.log("Removing member...");
            removeMember(container);
        }
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
    console.log("Updating project data...");
    
    // First clear members array
    projectData.members = [];
    
    // Get all current member containers in the DOM
    const containers = document.querySelectorAll('.member-container');
    console.log(`Found ${containers.length} member containers in DOM`);
    
    // Rebuild members array from DOM elements
    containers.forEach((container, index) => {
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
    
    // Update project metadata
    projectData.ProjectName = document.getElementById("project-name").value;
    projectData.ProjectDescription = document.getElementById("project-description").value;
    projectData.ProjectDuration = document.getElementById("project-duration").value;
    
    console.log(`Project data updated with ${projectData.members.length} members`);
}

function saveProject() {
    console.log("saveProject function called");
    updateProjectData();
    
    console.log("Project data updated:", projectData);
    console.log(`Saving project with ID: ${projectId}`);
    
    // Return a Promise for better control flow
    return new Promise((resolve, reject) => {
        // Always save using the project ID
        console.log(`Sending POST request to /save_project?project_name=${encodeURIComponent(projectId)}`);
        fetch(`/save_project?project_name=${encodeURIComponent(projectId)}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(projectData)
        })
        .then(res => {
            console.log("Response received:", res.status);
            if (!res.ok) {
                throw new Error(`Server returned ${res.status}: ${res.statusText}`);
            }
            return res.json();
        })
        .then(response => {
            console.log("Saved:", response.status);
            hasUnsavedChanges = false; // Reset the unsaved changes flag
            resolve(response); // Resolve the promise
        })
        .catch(err => {
            console.error("Save failed:", err);
            reject(err); // Reject the promise with the error
        });
    });
}

function removeMember(container) {
    // Remove the container from the DOM
    container.remove();
    
    console.log("Member container removed from DOM");
    
    // Update project data to reflect removal
    const prevMemberCount = projectData.members.length;
    updateProjectData();
    const newMemberCount = projectData.members.length;
    
    console.log(`Members before removal: ${prevMemberCount}, after removal: ${newMemberCount}`);
    
    // Force save with verification
    forceSaveAfterRemoval();
}

function forceSaveAfterRemoval() {
    console.log("Force saving after member removal...");
    updateProjectData(); // Ensure data is up to date
    
    // Direct API call with explicit content type and careful error handling
    fetch(`/save_project?project_name=${encodeURIComponent(projectId)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(projectData)
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }
        console.log(`Response status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        console.log("Save after removal successful:", data);
        hasUnsavedChanges = false;
    })
    .catch(err => {
        console.error("Error saving after removal:", err);
        alert("Failed to save after removing member. Please try saving manually.");
    });
}

// Debug helper function
function logMembersStatus() {
    console.log("-------- MEMBERS STATUS --------");
    console.log(`DOM members: ${document.querySelectorAll('.member-container').length}`);
    console.log(`Project data members: ${projectData.members.length}`);
    console.log("--------------------------------");
}