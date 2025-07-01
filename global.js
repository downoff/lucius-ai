document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const loggedOutLinks = document.getElementById('logged-out-links');
    const loggedInLinks = document.getElementById('logged-in-links');

    if (loggedOutLinks && loggedInLinks) {
        if (token) {
            loggedOutLinks.style.display = 'none';
            loggedInLinks.style.display = 'flex';
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', logout);
            }
            loadChatHistory(token);
        } else {
            loggedOutLinks.style.display = 'flex';
            loggedInLinks.style.display = 'none';
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

async function loadChatHistory(token) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    const backendUrl = 'https://lucius-ai.onrender.com';

    try {
        const response = await fetch(`${backendUrl}/api/conversations`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Could not fetch history.');

        const conversations = await response.json();
        historyList.innerHTML = ''; 

        if (conversations.length === 0) {
            historyList.innerHTML = '<li>No history yet.</li>';
            return;
        }

        conversations.forEach(convo => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            // This is the updated line - it now links to the conversation's ID
            link.href = `index.html?convoId=${convo._id}`;
            link.textContent = convo.title;
            listItem.appendChild(link);
            historyList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Failed to load chat history:", error);
        historyList.innerHTML = '<li>Could not load history.</li>';
    }
}