// The backend URL for your live Render service.
const backendUrl = 'https://lucius-ai.onrender.com'; // This should be your backend URL

document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    if (promptForm) {
        promptForm.addEventListener('submit', handlePostGeneration);
    }
});

/**
 * This is the main function that decides which AI to use based on login status.
 * @param {Event} event The form submission event.
 */
async function handlePostGeneration(event) {
    event.preventDefault();
    const token = localStorage.getItem('token'); // Check if a login token exists

    if (token) {
        // If a token exists, the user is logged in.
        // We will use the "Pro" workflow by calling our secure backend.
        await callProApi(token);
    } else {
        // If there is no token, the user is a free, anonymous visitor.
        // We will use the "Basic" workflow by calling the free Puter.js API.
        await callFreeApi();
    }
}

/**
 * Handles AI generation for FREE users by calling Puter.js on the frontend.
 */
async function callFreeApi() {
    console.log("Calling Free API (Puter.js)");
    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const loader = document.getElementById('loader');
    const coreMessage = document.getElementById('core-message').value;
    const platform = document.getElementById('platform-select').value;
    const keywords = document.getElementById('keywords').value;

    let finalPrompt = `You are an expert social media marketer. Your target platform is ${platform}. Create 3 variations of a social media post based on the following core message: "${coreMessage}". The tone should be engaging and professional.`;
    if (keywords) {
        finalPrompt += ` Be sure to include the following keywords: ${keywords}.`;
    }

    setLoadingState(true);
    outputArea.innerText = 'Lucius (Basic) is thinking...';

    try {
        const response = await puter.ai.chat(finalPrompt);
        outputArea.innerText = response.message.content;
    } catch (error) {
        console.error('Error during Puter.js generation:', error);
        outputArea.innerText = 'Sorry, an error occurred with the Basic AI.';
    } finally {
        setLoadingState(false);
    }
}

/**
 * Handles the AI generation for LOGGED-IN users by calling our secure backend.
 * @param {string} token The user's login token.
 */
async function callProApi(token) {
    console.log("Calling Pro API (Backend)");
    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const loader = document.getElementById('loader');
    const coreMessage = document.getElementById('core-message').value;
    const platform = document.getElementById('platform-select').value;
    const keywords = document.getElementById('keywords').value;

    let finalPrompt = `You are an expert social media marketer. Your target platform is ${platform}. Create 3 variations of a social media post based on the following core message: "${coreMessage}". The tone should be engaging and professional.`;
    if (keywords) {
        finalPrompt += ` Be sure to include the following keywords: ${keywords}.`;
    }

    setLoadingState(true);
    outputArea.innerText = 'Lucius (Pro) is thinking...';

    try {
        const response = await fetch(`${backendUrl}/api/ai/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ prompt: finalPrompt, tone: 'N/A' }),
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
        setLoadingState(false);
    }
}

function setLoadingState(isLoading) {
    const sendButton = document.getElementById('generate-button');
    const loader = document.getElementById('loader');
    if (isLoading) {
        sendButton.disabled = true;
        loader.innerHTML = '<div class="loader"></div>';
        loader.style.display = 'block';
    } else {
        sendButton.disabled = false;
        loader.style.display = 'none';
        loader.innerHTML = '';
    }
}