document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('employeeRegistrationForm');
    
    // Load available projects when page loads
    loadAvailableProjects();
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate personality traits
            const selectedTraits = document.querySelectorAll('.trait-checkbox:checked');
            const traitValidationMessage = document.getElementById('trait-validation-message');
            
            if (selectedTraits.length < 3) {
                traitValidationMessage.style.display = 'block';
                return;
            } else {
                traitValidationMessage.style.display = 'none';
            }
            
            // Gather form data
            const name = document.getElementById('employee-name').value;
            const department = document.getElementById('employee-department').value;
            const yearsWithCompany = parseInt(document.getElementById('employee-years').value);
            const interests = document.getElementById('employee-interests').value.split(',').map(item => item.trim());
            const skills = document.getElementById('employee-skills').value.split(',').map(item => item.trim());
            
            // Gather selected personality traits
            const personalities = [];
            selectedTraits.forEach(trait => {
                personalities.push(trait.nextElementSibling.textContent);
            });
            
            // Gather selected projects - Get the text content, not value
            const likedProjects = getSelectedOptions('liked-projects', true); // true = get text
            const dislikedProjects = getSelectedOptions('disliked-projects', true); // true = get text
            
            // Prepare data for submission
            const employeeData = {
                name: name,
                department: department,
                years_with_company: yearsWithCompany,
                general_interests: interests,
                skills: skills,
                personalities: personalities,
                liked_projects: likedProjects,
                disliked_projects: dislikedProjects
            };
            
            // Submit data to server
            submitEmployeeData(employeeData);
        });
    }
    
    // Helper function to get selected options from a multiple select
    // Modified to get text content instead of value if getText is true
    function getSelectedOptions(selectId, getText = false) {
        const select = document.getElementById(selectId);
        const result = [];
        
        if (select) {
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].selected) {
                    result.push(getText ? select.options[i].textContent : select.options[i].value);
                }
            }
        }
        
        return result;
    }
    
    function loadAvailableProjects() {
        const likedProjectsSelect = document.getElementById('liked-projects');
        const dislikedProjectsSelect = document.getElementById('disliked-projects');
        
        // Clear the loading options
        if (likedProjectsSelect) likedProjectsSelect.innerHTML = '';
        if (dislikedProjectsSelect) dislikedProjectsSelect.innerHTML = '';
        
        // Fetch projects list from server
        fetch('/get_projects')
            .then(response => response.json())
            .then(projects => {
                if (projects.length === 0) {
                    const option = document.createElement('option');
                    option.textContent = 'No projects available';
                    option.disabled = true;
                    
                    if (likedProjectsSelect) likedProjectsSelect.appendChild(option.cloneNode(true));
                    if (dislikedProjectsSelect) dislikedProjectsSelect.appendChild(option);
                } else {
                    projects.forEach(project => {
                        const option = document.createElement('option');
                        // Store the project name as both the value and display text
                        const projectName = project.name || `Project ${project.id}`;
                        option.value = projectName;
                        option.textContent = projectName;
                        
                        if (likedProjectsSelect) likedProjectsSelect.appendChild(option.cloneNode(true));
                        if (dislikedProjectsSelect) dislikedProjectsSelect.appendChild(option.cloneNode(true));
                    });
                }
            })
            .catch(error => {
                console.error('Error loading projects:', error);
                
                const errorOption = document.createElement('option');
                errorOption.textContent = 'Error loading projects';
                errorOption.disabled = true;
                
                if (likedProjectsSelect) likedProjectsSelect.appendChild(errorOption.cloneNode(true));
                if (dislikedProjectsSelect) dislikedProjectsSelect.appendChild(errorOption);
            });
    }
    
    // Rest of the code remains the same...
    function submitEmployeeData(data) {
        // Disable form while submitting
        const submitButton = document.querySelector('#employeeRegistrationForm button[type="submit"]');
        const alertBox = document.getElementById('registration-alert');
        
        submitButton.disabled = true;
        submitButton.innerHTML = 'Registering...';
        
        fetch('/register_employee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alertBox.className = 'alert alert-success';
                alertBox.textContent = 'Registration successful! Welcome to the team.';
                form.reset();
                
                // Redirect to home page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                alertBox.className = 'alert alert-danger';
                alertBox.textContent = `Registration failed: ${data.message}`;
            }
        })
        .catch(error => {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = 'An error occurred during registration. Please try again.';
            console.error('Error:', error);
        })
        .finally(() => {
            alertBox.style.display = 'block';
            submitButton.disabled = false;
            submitButton.innerHTML = 'Register';
        });
    }
    
    // Add event listeners for select elements to limit selections to 3
    const likedProjects = document.getElementById('liked-projects');
    const dislikedProjects = document.getElementById('disliked-projects');
    
    if (likedProjects) {
        likedProjects.addEventListener('change', function(e) {
            limitSelection(this, 3);
        });
    }
    
    if (dislikedProjects) {
        dislikedProjects.addEventListener('change', function(e) {
            limitSelection(this, 3);
        });
    }
    
    function limitSelection(selectElement, maxItems) {
        const selectedCount = Array.from(selectElement.options)
            .filter(option => option.selected).length;
            
        if (selectedCount > maxItems) {
            alert(`Please select a maximum of ${maxItems} items`);
            // Deselect the last selected option
            for (let i = 0; i < selectElement.options.length; i++) {
                if (selectElement.options[i].selected) {
                    selectElement.options[i].selected = false;
                    break;
                }
            }
        }
    }
});