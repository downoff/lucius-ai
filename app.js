// The backend URL should be your live Render Web Service URL
const backendUrl = 'https://lucius-ai.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    if (promptForm) {
        promptForm.addEventListener('submit', handlePostGeneration);
    }
});

/**
 * Main function that decides which AI to use based on login status.
 * @param {Event} event The form submission event.
 */
async function handlePostGeneration(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');

    // This is the "AI Router" logic
    if (token) {
        await callProApi(token);
    } else {
        await callFreeApi();
    }
}

/**
 * Creates the specialized prompt for the Social Media Studio.
 * @returns {string} The final prompt to be sent to the AI.
 */
function buildFinalPrompt() {
    // Get values from the new, specialized form fields
    const coreMessage = document.getElementById('core-message').value;
    const platform = document.getElementById('platform-select').value;
    const keywords = document.getElementById('keywords').value;

    // Use Prompt Engineering to create a powerful, detailed prompt for the AI
    let finalPrompt = `You are an expert social media marketer. Your target platform is ${platform}. Create 3 variations of a social media post based on the following core message: "${coreMessage}". The tone should be engaging and professional.`;
    if (keywords) {
        finalPrompt += ` Be sure to include the following keywords: ${keywords}.`;
    }
    return finalPrompt;
}

/**
 * Toggles the UI into a "loading" state.
 * @param {boolean} isLoading 
 */
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


/**
 * Handles AI generation for FREE users by calling Puter.js.
 */
async function callFreeApi() {
    console.log("Calling Free API (Puter.js)");
    const outputArea = document.getElementById('output-area');
    const finalPrompt = buildFinalPrompt();
    
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
 * Handles AI generation for LOGGED-IN users by calling our secure backend.
 * @param {string} token The user's login token.
 */
async function callProApi(token) {
    console.log("Calling Pro API (Backend)");
    const outputArea = document.getElementById('output-area');
    const finalPrompt = buildFinalPrompt();

    setLoadingState(true);
    outputArea.innerText = 'Lucius (Pro) is thinking...';

    try {
        const response = await fetch(`${backendUrl}/api/ai/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({
                prompt: finalPrompt,
                tone: 'N/A' // Tone is now part of the prompt itself
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
        setLoadingState(false);
    }
}