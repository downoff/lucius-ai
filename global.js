const backendUrl = 'https://lucius-ai.onrender.com'; // Your backend URL

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});

async function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const loggedOutLinks = document.getElementById('logged-out-links');
    const loggedInLinks = document.getElementById('logged-in-links');

    if (loggedOutLinks && loggedInLinks) {
        if (token) {
            // User is logged in
            loggedOutLinks.style.display = 'none';
            loggedInLinks.style.display = 'flex';

            // Fetch user data to display their credits in the nav
            try {
                const response = await fetch(`${backendUrl}/api/users/me`, {
                    headers: { 'x-auth-token': token }
                });
                if (!response.ok) throw new Error('Auth failed');
                const user = await response.json();

                // Build the navigation for a logged-in user
                loggedInLinks.innerHTML = `
                    <li><span style="margin-right: 1rem;">Credits: <strong>${user.credits}</strong></span></li>
                    <li><a href="dashboard.html">Dashboard</a></li>
                    <li><a href="pricing.html" role="button" class="secondary">Upgrade</a></li>
                    <li><button id="logout-button">Logout</button></li>
                `;

            } catch (error) {
                // If fetching user fails, show a simpler nav
                loggedInLinks.innerHTML = `
                    <li><a href="dashboard.html">Dashboard</a></li>
                    <li><button id="logout-button">Logout</button></li>
                `;
            }
            
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) logoutButton.addEventListener('click', logout);

        } else {
            // User is logged out
            loggedOutLinks.style.display = 'flex';
            loggedInLinks.style.display = 'none';
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}