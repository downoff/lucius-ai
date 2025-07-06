// The backend URL for your live Render service.
const backendUrl = 'https://lucius-backend.onrender.com'; // Use your actual backend URL

document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    if (promptForm) {
        promptForm.addEventListener('submit', handlePostGeneration);
    }
});

async function handlePostGeneration(event) {
    event.preventDefault();
    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const token = localStorage.getItem('token');
    const loader = document.getElementById('loader');

    if (!token) {
        outputArea.innerText = 'Please log in or sign up to use the post generator.';
        return;
    }

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
    outputArea.innerText = 'Lucius is crafting your posts...';

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
        sendButton.disabled = false;
        loader.style.display = 'none';
        loader.innerHTML = '';
    }
}