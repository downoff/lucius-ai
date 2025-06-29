// This code will run on every page that includes this script.
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const loggedOutLinks = document.getElementById('logged-out-links');
    const loggedInLinks = document.getElementById('logged-in-links');

    // Make sure these elements exist on the page before trying to modify them
    if (loggedOutLinks && loggedInLinks) {
        if (token) {
            // User is logged in: show the 'Logout' & 'Upgrade' links.
            loggedOutLinks.style.display = 'none';
            loggedInLinks.style.display = 'flex'; // 'flex' makes it visible and aligns items

            const logoutButton = document.getElementById('logout-button');
            // Add listener only if the button exists
            if (logoutButton) {
                logoutButton.addEventListener('click', logout);
            }
        } else {
            // User is logged out: show the 'Login' & 'Sign Up' links.
            loggedOutLinks.style.display = 'flex';
            loggedInLinks.style.display = 'none';
        }
    }
}

function logout() {
    // To logout, we remove the token from storage
    localStorage.removeItem('token');
    // And then redirect back to the homepage
    window.location.href = 'index.html';
}