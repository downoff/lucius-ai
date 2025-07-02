// The backend URL for your live Render service.
const backendUrl = 'https://lucius-ai.onrender.com'; // IMPORTANT: Make sure this is your correct backend URL

document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    if (promptForm) {
        promptForm.addEventListener('submit', handleChatSubmit);
    }
});

/**
 * This is the main function that decides which AI to use.
 * @param {Event} event The form submission event.
 */
async function handleChatSubmit(event) {
    event.preventDefault();

    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const promptInput = document.getElementById('prompt-input');
    const toneSelect = document.getElementById('tone-select');
    
    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;
    const finalPrompt = `Your tone of voice must be strictly ${selectedTone}. Now, please respond to the following request: "${userPrompt}"`;
    
    sendButton.setAttribute('aria-busy', 'true');
    sendButton.disabled = true;
    
    const token = localStorage.getItem('token');
    let userIsPro = false;

    // First, check if the user is logged in and if they are a Pro member
    if (token) {
        try {
            const response = await fetch(`${backendUrl}/api/users/me`, {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const user = await response.json();
                userIsPro = user.isPro; // Check the user's pro status
            }
        } catch (error) {
            console.error('Could not verify pro status, defaulting to basic model.', error);
        }
    }

    // Now, decide which model to use
    let modelToUse;
    if (userIsPro) {
        console.log("User is Pro. Using Gemini Pro model.");
        outputArea.innerText = 'Lucius (Pro) is thinking...';
        // Use a powerful Gemini Pro model for paying users
        modelToUse = 'google/gemini-2.5-pro-exp-03-25:free'; 
    } else {
        console.log("User is Free/Anonymous. Using basic model.");
        outputArea.innerText = 'Lucius (Basic) is thinking...';
        // Use a fast, free model for the basic tier
        modelToUse = 'o1-mini'; 
    }

    // Call the Puter.js API with the chosen model
    puter.ai.chat(finalPrompt, { model: modelToUse })
        .then(response => {
            outputArea.innerText = response.message.content;
        })
        .catch(error => {
            console.error('Error during Puter.ai generation:', error);
            outputArea.innerText = 'Sorry, an error occurred. Please try again.';
        })
        .finally(() => {
            sendButton.setAttribute('aria-busy', 'false');
            sendButton.disabled = false;
        });
}