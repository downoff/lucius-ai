// The backend URL for your live Render service.
const backendUrl = 'https://lucius-ai.onrender.com'; // IMPORTANT: Use your actual backend URL

document.addEventListener('DOMContentLoaded', () => {
    const imageForm = document.getElementById('image-form');
    if (imageForm) {
        imageForm.addEventListener('submit', handleImageGeneration);
    }
});

async function handleImageGeneration(event) {
    event.preventDefault();

    const generateButton = document.getElementById('generate-image-button');
    const promptInput = document.getElementById('image-prompt-input');
    const messageArea = document.getElementById('image-message-area');
    const imageElement = document.getElementById('generated-image');
    const loader = document.getElementById('image-loader');
    const token = localStorage.getItem('token');

    if (!token) {
        messageArea.innerText = 'You must be logged in as a Pro user to generate images.';
        return;
    }

    const prompt = promptInput.value;
    
    generateButton.disabled = true;
    loader.innerHTML = '<div class="loader"></div>';
    loader.style.display = 'block';
    messageArea.innerText = 'Generating your image, this can take up to a minute...';
    imageElement.style.display = 'none'; // Hide the old image

    try {
        const response = await fetch(`${backendUrl}/api/ai/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'An error occurred.');
        }

        const data = await response.json();
        
        // Update the image source with the URL from the server
        imageElement.src = data.imageUrl;
        imageElement.style.display = 'block'; // Make the image visible
        messageArea.innerText = 'Your generated image:';

    } catch (error) {
        console.error('Image generation fetch error:', error);
        messageArea.innerText = `Error: ${error.message}`;
    } finally {
        generateButton.disabled = false;
        loader.style.display = 'none';
        loader.innerHTML = '';
    }
}