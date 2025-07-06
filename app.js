const backendUrl = 'https://lucius-ai.onrender.com'; // IMPORTANT: Use your actual backend URL

document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    if (promptForm) {
        promptForm.addEventListener('submit', handleChatSubmit);
    }
});

async function handleChatSubmit(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    if (token) {
        await callProApi(token);
    } else {
        await callFreeApi();
    }
}

async function callFreeApi() {
    console.log("Calling Free API (Puter.js - Non-Streaming)");
    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const loader = document.getElementById('loader');
    const promptInput = document.getElementById('prompt-input');
    const toneSelect = document.getElementById('tone-select');

    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;
    const finalPrompt = `Your tone of voice must be strictly ${selectedTone}. Now, please respond to the following request: "${userPrompt}"`;
    
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

async function callProApi(token) {
    console.log("Calling Pro API (Backend)");
    const sendButton = document.getElementById('generate-button');
    const outputArea = document.getElementById('output-area');
    const loader = document.getElementById('loader');
    const promptInput = document.getElementById('prompt-input');
    const toneSelect = document.getElementById('tone-select');
    
    const userPrompt = promptInput.value;
    const selectedTone = toneSelect.value;
    
    setLoadingState(true);
    outputArea.innerText = 'Lucius (Pro) is thinking...';

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