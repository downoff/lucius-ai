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

            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', logout);
            }

            // --- NEW: Fetch and display chat history ---
            loadChatHistory(token);

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

/**
 * Fetches the list of conversation titles and displays them in the sidebar.
 * @param {string} token The user's login token.
 */
async function loadChatHistory(token) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return; // Do nothing if the sidebar isn't on the page

    // IMPORTANT: Make sure this is your correct live backend URL
    const backendUrl = 'https://lucius.onrender.com';

    try {
        const response = await fetch(`${backendUrl}/api/conversations`, {
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) {
            throw new Error('Could not fetch history.');
        }

        const conversations = await response.json();
        
        historyList.innerHTML = ''; // Clear the "No history yet" message

        if (conversations.length === 0) {
            historyList.innerHTML = '<li>No history yet.</li>';
            return;
        }

        conversations.forEach(convo => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            // We'll add loading a conversation in the next step
            link.href = `#`; // In the future, this will be ?convoId=${convo._id}
            link.textContent = convo.title;
            listItem.appendChild(link);
            historyList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Failed to load chat history:", error);
        historyList.innerHTML = '<li>Could not load history.</li>';
    }
}