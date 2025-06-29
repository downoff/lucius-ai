// Define the backend URL at the top for easy changes in the future.
// IMPORTANT: Replace this with your actual backend URL from Render.
const backendUrl = 'https://lucius-ai.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    if (promptForm) {
        promptForm.addEventListener('submit', handleChatSubmit);
    }
});

async function handleChatSubmit(event) {
    event.preventDefault();
    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const token = localStorage.getItem('token');

    if (!token) {
        outputArea.innerText = 'This is a pro feature. Please log in or sign up to use the AI generator.';
        return;
    }

    const promptInput = document.getElementById('prompt-input');
    const toneSelect = document.getElementById('tone-select');
    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;
    
    sendButton.setAttribute('aria-busy', 'true');
    sendButton.disabled = true;
    outputArea.innerText = 'Lucius is thinking...';

    try {
        const response = await fetch(`${backendUrl}/api/ai/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({
                prompt: userPrompt,
                tone: selectedTone
            }),
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
        sendButton.setAttribute('aria-busy', 'false');
        sendButton.disabled = false;
    }
}