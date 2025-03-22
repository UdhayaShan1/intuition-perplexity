document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('employeeRegistrationForm');
    
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
            
            // Prepare data for submission
            const employeeData = {
                name: name,
                department: department,
                years_with_company: yearsWithCompany,
                general_interests: interests,
                skills: skills,
                personalities: personalities
            };
            
            // Submit data to server
            submitEmployeeData(employeeData);
        });
    }
    
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
});