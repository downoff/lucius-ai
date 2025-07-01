document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    // Make sure the form exists on the page before adding a listener
    if(promptForm) {
        promptForm.addEventListener('submit', handleChatSubmit);
    }
});

/**
 * Handles AI generation for ALL users using the free Puter.js library.
 * This function no longer checks for a login token.
 * @param {Event} event The form submission event.
 */
function handleChatSubmit(event) {
    event.preventDefault(); // Stop the page from reloading

    const sendButton = document.getElementById('generate-button');
    const promptInput = document.getElementById('prompt-input');
    const outputArea = document.getElementById('output-area');
    const toneSelect = document.getElementById('tone-select');

    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;

    const finalPrompt = `Your tone of voice must be strictly ${selectedTone}. Now, please respond to the following request: "${userPrompt}"`;

    sendButton.setAttribute('aria-busy', 'true');
    sendButton.disabled = true;
    outputArea.innerText = 'Lucius is thinking...';

    // This now runs for everyone, logged in or not.
    puter.ai.chat(finalPrompt)
        .then(response => {
            outputArea.innerText = response;
        })
        .catch(error => {
            console.error('Error during Lucius AI generation:', error);
            outputArea.innerText = 'Sorry, an error occurred. Please try again.';
        })
        .finally(() => {
            sendButton.setAttribute('aria-busy', 'false');
            sendButton.disabled = false;
        });
}