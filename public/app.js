/**
 * Author: Victor Love
 * Date: [Current Date]
 * Description: Frontend JavaScript for the Daily Task Manager.
 * Handles user authentication and CRUD operations for tasks.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    // Authentication section
    const authSection = document.getElementById('auth-section');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');

    // Task management section
    const taskSection = document.getElementById('task-section');
    const taskForm = document.getElementById('new-task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');

    // Messaging
    const errorMessage = document.getElementById('error-message');

    // --- HELPER FUNCTIONS ---

    // Function to display an error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 4000); // Hide after 4 seconds
    }
    
    // Gets authentication headers, including the JWT token
    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // --- API CALLS (CRUD OPERATIONS) ---

    // READ: Fetch all tasks from the server
    async function fetchTasks() {
        const headers = getAuthHeaders();
        if (!headers) return; // Stop if not logged in

        try {
            const response = await fetch('/api/tasks', { headers }); // Changed from /api/students

            if (!response.ok) {
                // If token is bad, log the user out
                if (response.status === 401 || response.status === 403) {
                   logout();
                }
                throw new Error('Could not fetch tasks.');
            }

            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            showError(error.message);
        }
    }

    // CREATE: Add a new task
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const description = taskInput.value.trim();
        if (!description) return;

        const headers = getAuthHeaders();

        try {
            const response = await fetch('/api/tasks', { // Changed from /api/students
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ description }) // Changed payload to match task model
            });

            if (!response.ok) throw new Error('Failed to add task.');
            
            taskInput.value = ''; // Clear input field
            fetchTasks(); // Refresh the list
        } catch (error) {
            showError(error.message);
        }
    });

    // UPDATE & DELETE (handled via a single event listener on the task list)
    taskList.addEventListener('click', async (e) => {
        const headers = getAuthHeaders();
        const target = e.target;
        const li = target.closest('li');
        if (!li) return;

        const id = li.dataset.id;

        // DELETE button clicked
        if (target.classList.contains('delete-btn')) {
            try {
                const response = await fetch(`/api/tasks/${id}`, { // Changed from /api/students
                    method: 'DELETE',
                    headers: headers
                });
                if (!response.ok) throw new Error('Failed to delete task.');
                fetchTasks(); // Refresh list
            } catch (error) {
                showError(error.message);
            }
        }

        // TOGGLE COMPLETE button clicked
        if (target.classList.contains('toggle-btn')) {
            const isCompleted = !li.querySelector('span').classList.contains('completed');
            try {
                const response = await fetch(`/api/tasks/${id}`, { // Changed from /api/students
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify({ isCompleted }) // Update the completion status
                });
                if (!response.ok) throw new Error('Failed to update task.');
                fetchTasks(); // Refresh list
            } catch (error) {
                showError(error.message);
            }
        }
    });


    // --- RENDERING ---

    // Renders the list of tasks to the page
    function renderTasks(tasks) {
        taskList.innerHTML = ''; // Clear the current list
        if (tasks.length === 0) {
            taskList.innerHTML = '<li class="list-group-item text-muted">No tasks yet. Add one above!</li>';
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.dataset.id = task._id;
            li.innerHTML = `
                <span class="${task.isCompleted ? 'completed' : ''}">${task.description}</span>
                <div>
                    <button class="btn btn-sm btn-outline-success toggle-btn">${task.isCompleted ? 'Undo' : 'Complete'}</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    }

    // --- AUTHENTICATION ---

    // Register a new user
    registerBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            alert('Registration successful! Please log in.');
        } catch (error) {
            showError(error.message);
        }
    });

    // Login a user
    loginBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            // Store token and username in browser's local storage
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            
            updateUIForAuthState();
        } catch (error) {
            showError(error.message);
        }
    });

    // Logout
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        updateUIForAuthState();
    }
    logoutBtn.addEventListener('click', logout);


    // --- UI MANAGEMENT ---

    // Updates the UI based on whether the user is logged in or not
    function updateUIForAuthState() {
        const token = localStorage.getItem('token');
        if (token) {
            // Logged in
            authSection.style.display = 'none';
            taskSection.style.display = 'block';
            userInfo.textContent = `Logged in as: ${localStorage.getItem('username')}`;
            fetchTasks();
        } else {
            // Logged out
            authSection.style.display = 'block';
            taskSection.style.display = 'none';
            taskList.innerHTML = '';
        }
    }

    // Initial check when the page loads
    updateUIForAuthState();
});
