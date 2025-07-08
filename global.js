document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const loggedOutLinks = document.getElementById('logged-out-links');
    const loggedInLinks = document.getElementById('logged-in-links');

    if (loggedOutLinks && loggedInLinks) {
        if (token) {
            // User is logged in.
            loggedOutLinks.style.display = 'none';
            loggedInLinks.style.display = 'flex'; 

            // This is the updated navigation for logged-in users
            loggedInLinks.innerHTML = `
                <li><a href="dashboard.html">Dashboard</a></li>
                <li><a href="pricing.html" role="button" class="secondary">Upgrade to Pro</a></li>
                <li><button id="logout-button">Logout</button></li>
            `;
            
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', logout);
            }
        } else {
            // User is logged out.
            loggedOutLinks.style.display = 'flex';
            loggedInLinks.style.display = 'none';
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}