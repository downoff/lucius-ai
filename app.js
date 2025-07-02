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
        await callProApi(token);
    } else {
        await callFreeApi();
    }
}

/**
 * Handles AI generation for FREE users with STREAMING.
 */
async function callFreeApi() {
    console.log("Calling Free API (Puter.js with Streaming)");

    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const loader = document.getElementById('loader');
    const promptInput = document.getElementById('prompt-input');
    const toneSelect = document.getElementById('tone-select');

    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;
    const finalPrompt = `Your tone of voice must be strictly ${selectedTone}. Now, please respond to the following request: "${userPrompt}"`;
    
    // --- UI Update: Start Loading ---
    sendButton.disabled = true;
    loader.innerHTML = '<div class="loader"></div>'; // Show the spinner
    loader.style.display = 'block';
    outputArea.innerText = ''; // Clear previous response

    try {
        // We add {stream: true} to get the typewriter effect
        const responseStream = await puter.ai.chat(finalPrompt, { stream: true });

        for await (const part of responseStream) {
            if (part.message?.content) {
                // The 'replaceAll' cleans up the streaming text
                outputArea.innerText += part.message.content.replaceAll(' .', '.');
            }
        }
    } catch (error) {
        console.error('Error during Puter.js streaming:', error);
        outputArea.innerText = 'Sorry, an error occurred with the Basic AI.';
    } finally {
        // --- UI Update: Stop Loading ---
        sendButton.disabled = false;
        loader.style.display = 'none'; // Hide the spinner
        loader.innerHTML = '';
    }
}

/**
 * Handles the AI generation for LOGGED-IN users.
 * Note: Streaming for the backend would require more significant changes, so we will keep it simple for now.
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
    
    // --- UI Update: Start Loading ---
    sendButton.disabled = true;
    loader.innerHTML = '<div class="loader"></div>';
    loader.style.display = 'block';
    outputArea.innerText = '';

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
        outputArea.innerText = data.text; // The Pro response appears all at once for now

    } catch (error) {
        console.error('Generation fetch error:', error);
        outputArea.innerText = `Error: ${error.message}`;
    } finally {
        // --- UI Update: Stop Loading ---
        sendButton.disabled = false;
        loader.style.display = 'none';
        loader.innerHTML = '';
    }
}