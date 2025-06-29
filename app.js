document.addEventListener('DOMContentLoaded', () => {
    // This listener doesn't change. It just starts the process.
    const promptForm = document.getElementById('prompt-form');
    if (promptForm) {
        promptForm.addEventListener('submit', handleChatSubmit);
    }
});

/**
 * This is the main function that decides which AI to use.
 * It's the "brain" of our Freemium model.
 * @param {Event} event The form submission event.
 */
async function handleChatSubmit(event) {
    event.preventDefault();

    const token = localStorage.getItem('token'); // Check if a login token exists

    if (token) {
        // If a token exists, the user is logged in.
        // We will use the "Pro" workflow by calling our secure backend.
        callProApi(token);
    } else {
        // If there is no token, the user is a free, anonymous visitor.
        // We will use the "Basic" workflow by calling the free Puter.js API.
        callFreeApi();
    }
}

/**
 * Handles the AI generation for FREE users by calling Puter.js on the frontend.
 */
function callFreeApi() {
    console.log("Calling Free API (Puter.js)");

    const sendButton = document.getElementById('generate-button');
    const promptInput = document.getElementById('prompt-input');
    const outputArea = document.getElementById('output-area');
    const toneSelect = document.getElementById('tone-select');

    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;
    const finalPrompt = `Your tone of voice must be strictly ${selectedTone}. Now, please respond to the following request: "${userPrompt}"`;

    sendButton.setAttribute('aria-busy', 'true');
    sendButton.disabled = true;
    outputArea.innerText = 'Lucius (Basic) is thinking...';

    puter.ai.chat(finalPrompt)
        .then(response => {
            outputArea.innerText = response;
        })
        .catch(error => {
            console.error('Error during Puter.js generation:', error);
            outputArea.innerText = 'Sorry, an error occurred. Please try again.';
        })
        .finally(() => {
            sendButton.setAttribute('aria-busy', 'false');
            sendButton.disabled = false;
        });
}

/**
 * Handles the AI generation for LOGGED-IN users by calling our secure backend.
 * @param {string} token The user's login token.
 */
async function callProApi(token) {
    console.log("Calling Pro API (Backend with Gemini)");

    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const promptInput = document.getElementById('prompt-input');
    const toneSelect = document.getElementById('tone-select');
    
    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;
    
    sendButton.setAttribute('aria-busy', 'true');
    sendButton.disabled = true;
    outputArea.innerText = 'Lucius (Pro) is thinking...';

    // The backend URL should be the one for your Render Web Service
    const backendUrl = 'https://lucius.onrender.com';

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