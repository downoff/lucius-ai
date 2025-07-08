// This is the backend URL for your live Render service.
const backendUrl = 'https://lucius-ai.onrender.com'; // IMPORTANT: Use your actual backend URL

document.addEventListener('DOMContentLoaded', () => {
    fetchUserData();
});

async function fetchUserData() {
    const token = localStorage.getItem('token');
    const userEmailElement = document.getElementById('user-email');
    const planStatusElement = document.getElementById('plan-status');

    // If there's no token, the user is not logged in. Redirect them.
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/api/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token, // Send the token to the secure backend
            }
        });

        if (!response.ok) {
            // If the token is invalid or expired, the server will send an error.
            // Redirect to login page.
            localStorage.removeItem('token'); // Clear the bad token
            window.location.href = 'login.html';
            return;
        }

        const user = await response.json();

        // Update the page with the user's data
        if (userEmailElement) {
            userEmailElement.innerText = `Welcome, ${user.email}`;
        }
        if (planStatusElement) {
            planStatusElement.innerText = user.isPro ? 'Lucius Pro Member' : 'Basic Member';
            if (user.isPro) {
                planStatusElement.style.color = 'var(--primary-color)'; // Make it purple for Pro users
            }
        }

    } catch (error) {
        console.error('Failed to fetch user data:', error);
        // If there's any error, clear the token and redirect to login
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}