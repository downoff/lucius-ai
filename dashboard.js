const backendUrl = 'https://lucius-ai.onrender.com'; // Your backend URL

document.addEventListener('DOMContentLoaded', () => {
    fetchUserData();
});

async function fetchUserData() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/api/users/me`, {
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        const user = await response.json();
        updateDashboardUI(user);

    } catch (error) {
        console.error('Failed to fetch user data:', error);
        window.location.href = 'login.html';
    }
}

function updateDashboardUI(user) {
    // Populate User and Plan details
    document.getElementById('user-email').innerText = `Welcome back, ${user.name || user.email}`;
    const planStatusElement = document.getElementById('plan-status');
    planStatusElement.innerText = user.isPro ? 'Lucius Pro' : 'Basic';
    if (user.isPro) {
        planStatusElement.style.color = 'var(--primary-color)';
    }
    document.getElementById('user-credits').innerText = user.credits;

    // --- NEW: Handle the Connections Section ---
    const connectionsSection = document.getElementById('connections-section');
    if (user.xAuth && user.xAuth.isVerified) {
        // If user has connected their X account, show a success message
        connectionsSection.innerHTML = `<p>✅ X/Twitter Account Connected</p>`;
    } else {
        // Otherwise, show the button to connect
        connectionsSection.innerHTML = `
            <p>Connect your social accounts to enable post scheduling.</p>
            <a href="${backendUrl}/twitter/auth" role="button">Connect your X/Twitter Account</a>
        `;
    }
}