// This code will run on every page that includes this script.
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});

async function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const loggedOutLinks = document.getElementById('logged-out-links');
    const loggedInLinks = document.getElementById('logged-in-links');
    
    // IMPORTANT: Make sure this is your correct live backend URL from Render
    const backendUrl = 'https://lucius-ai.onrender.com';

    if (loggedOutLinks && loggedInLinks) {
        if (token) {
            // User is logged in. Show the correct navigation buttons.
            loggedOutLinks.style.display = 'none';
            loggedInLinks.style.display = 'flex';

            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', logout);
            }

            // --- NEW: Fetch user profile to check for Pro status ---
            try {
                const response = await fetch(`${backendUrl}/api/users/me`, {
                    headers: { 'x-auth-token': token }
                });

                if (response.ok) {
                    const user = await response.json();
                    const welcomeMessage = document.getElementById('welcome-message');
                    
                    if (welcomeMessage && user.isPro) {
                        // If we are on the homepage and the user is Pro, change the message!
                        welcomeMessage.innerHTML = `Welcome back, Pro Member!<br/>You are using the advanced Gemini model.`;
                    }
                }
            } catch (error) {
                console.error('Could not fetch user profile:', error);
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