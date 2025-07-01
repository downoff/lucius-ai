// This is the backend URL for your live Render service.
const backendUrl = 'https://lucius-ai.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // Check if the URL has a conversation ID in it
    const params = new URLSearchParams(window.location.search);
    const convoId = params.get('convoId');

    if (convoId) {
        // If a convoId exists, load that conversation instead of showing a blank form
        loadConversation(convoId);
    } else {
        // Otherwise, set up the form for a new chat
        const promptForm = document.getElementById('prompt-form');
        if (promptForm) {
            promptForm.addEventListener('submit', handleChatSubmit);
        }
    }
});

/**
 * Fetches and displays a specific past conversation.
 * @param {string} convoId The ID of the conversation to load.
 */
async function loadConversation(convoId) {
    const outputArea = document.getElementById('output-area');
    const welcomeMessage = document.getElementById('welcome-message');
    const promptForm = document.getElementById('prompt-form');
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html'; // Redirect to login if not authenticated
        return;
    }

    welcomeMessage.innerText = 'Loading Conversation...';
    promptForm.style.display = 'none'; // Hide the new prompt form

    try {
        const response = await fetch(`${backendUrl}/api/conversations/${convoId}`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Could not load conversation.');

        const conversation = await response.json();
        
        welcomeMessage.innerText = conversation.title; // Set the title
        outputArea.innerHTML = ''; // Clear the output area

        // Loop through and display all messages from the history
        conversation.messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.style.fontWeight = message.role === 'user' ? 'bold' : 'normal';
            messageElement.innerText = message.content;
            outputArea.appendChild(messageElement);
            outputArea.appendChild(document.createElement('hr'));
        });

    } catch (error) {
        console.error('Failed to load conversation:', error);
        welcomeMessage.innerText = 'Error';
        outputArea.innerText = 'Could not load this conversation. Please try again.';
    }
}


/**
 * Handles submitting a NEW AI prompt.
 * @param {Event} event The form submission event.
 */
async function handleChatSubmit(event) {
    // This function remains mostly the same as before
    event.preventDefault();
    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const token = localStorage.getItem('token');

    if (!token) {
        outputArea.innerText = 'Please log in to use the AI generator.';
        return;
    }

    // ... (rest of the handleChatSubmit function is the same)
}