// The backend URL for your live Render service.
const backendUrl = 'https://lucius-ai.onrender.com'; // IMPORTANT: Use your actual backend URL

document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    if (promptForm) {
        promptForm.addEventListener('submit', handlePostGeneration);
    }
});

/**
 * This is the main function that decides which AI to use.
 * It's the "brain" of our Freemium model.
 * @param {Event} event The form submission event.
 */
async function handlePostGeneration(event) {
    event.preventDefault();

    const token = localStorage.getItem('token'); // Check if a login token exists

    if (token) {
        // If token exists, user is logged in. Call the backend for the Pro experience.
        await callProApi(token);
    } else {
        // If no token, user is a free visitor. Call the frontend Puter.js API.
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

    sendButton.disabled = true;
    loader.innerHTML = '<div class="loader"></div>';
    loader.style.display = 'block';
    outputArea.innerText = 'Lucius (Basic) is thinking...';

    try {
        const response = await puter.ai.chat(finalPrompt);
        outputArea.innerText = response.message.content;

    } catch (error) {
        console.error('Error during Puter.js generation:', error);
        outputArea.innerText = 'Sorry, an error occurred with the Basic AI.';
    } finally {
        send