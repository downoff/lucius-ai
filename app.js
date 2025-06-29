// The login/logout logic is now in global.js.
// This file now only handles the chat functionality on the homepage.
document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    // Make sure the form exists on the page before adding a listener
    if(promptForm) {
        promptForm.addEventListener('submit', handleChatSubmit);
    }
});

/**
 * Handles the AI generation when the user submits the chat form.
 * This version uses the free Puter.js library.
 * @param {Event} event The form submission event.
 */
function handleChatSubmit(event) {
    event.preventDefault(); // Prevent the form from reloading the page

    const sendButton = document.getElementById('generate-button');
    const promptInput = document.getElementById('prompt-input');
    const outputArea = document.getElementById('output-area');
    const toneSelect = document.getElementById('tone-select');

    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;

    // We still use our unique "Tone of Voice" feature!
    const finalPrompt = `Your tone of voice must be strictly ${selectedTone}. Now, please respond to the following request: "${userPrompt}"`;

    // Disable the button and show a loading message
    sendButton.setAttribute('aria-busy', 'true');
    sendButton.disabled = true;
    outputArea.innerText = 'Lucius is thinking...';

    // Use the Puter.js library to call the AI directly from the frontend
    puter.ai.chat(finalPrompt)
        .then(response => {
            // Display the AI's response in our output area
            outputArea.innerText = response;
        })
        .catch(error => {
            console.error('Error during Lucius AI generation:', error);
            outputArea.innerText = 'Sorry, an error occurred. Please try again.';
        })
        .finally(() => {
            // Re-enable the button after the process is complete
            sendButton.setAttribute('aria-busy', 'false');
            sendButton.disabled = false;
        });
}