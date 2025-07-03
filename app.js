// The backend URL for your live Render service.
const backendUrl = 'https://lucius-ai.onrender.com'; // IMPORTANT: Make sure this is your correct backend URL

document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    if (promptForm) {
        promptForm.addEventListener('submit', handleChatSubmit);
    }
});

/**
 * The main function that decides which AI to use.
 * @param {Event} event The form submission event.
 */
async function handleChatSubmit(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');

    if (token) {
        // Logged-in users will call the backend for the Pro experience
        await callProApi(token);
    } else {
        // Anonymous users will call the free frontend API
        await callFreeApi();
    }
}

/**
 * Handles AI generation for FREE users by calling Puter.js (Non-Streaming).
 */
async function callFreeApi() {
    console.log("Calling Free API (Puter.js - Non-Streaming)");

    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const loader = document.getElementById('loader');
    const promptInput = document.getElementById('prompt-input');
    const toneSelect = document.getElementById('tone-select');

    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;
    const finalPrompt = `Your tone of voice must be strictly ${selectedTone}. Now, please respond to the following request: "${userPrompt}"`;
    
    sendButton.disabled = true;
    loader.innerHTML = '<div class="loader"></div>';
    loader.style.display = 'block';
    outputArea.innerText = 'Lucius (Basic) is thinking...';

    try {
        // This is the stable, non-streaming call
        const response = await puter.ai.chat(finalPrompt);
        // The AI's text is inside response.message.content
        outputArea.innerText = response.message.content;

    } catch (error) {
        console.error('Error during Puter.js generation:', error);
        outputArea.innerText = 'Sorry, an error occurred with the Basic AI.';
    } finally {
        sendButton.disabled = false;
        loader.style.display = 'none';
        loader.innerHTML = '';
    }
}

/**
 * Handles the AI generation for LOGGED-IN users by calling our secure backend.
 * @param {string} token The user's login token.
 */
async function callProApi(token) {
    console.log("Calling Pro API (Backend with Gemini)");

    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const loader = document.getElementById('loader');
    const promptInput = document.getElementById('prompt-input');
    const toneSelect = document.getElementById('tone-select');
    
    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;
    
    sendButton.disabled = true;
    loader.innerHTML = '<div class="loader"></div>';
    loader.style.display = 'block';
    outputArea.innerText = 'Lucius (Pro) is thinking...';

    try {
        const response = await fetch(`${backendUrl}/api/ai/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ prompt: userPrompt, tone: selectedTone }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'An error occurred.');
        }

        const data = await response.json();
        outputArea.innerText = data.text;

    } catch (error) {
        console.error('Generation fetch error:', error);
        outputArea.innerText = `Error: ${error.message}`;
    } finally {
        sendButton.disabled = false;
        loader.style.display = 'none';
        loader.innerHTML = '';
    }
}