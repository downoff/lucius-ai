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
    const token = localStorage.getItem('token');

    if (!token) {
        messageArea.innerText = 'You must be logged in as a Pro user to generate images.';
        return;
    }

    const prompt = promptInput.value;
    
    generateButton.setAttribute('aria-busy', 'true');
    generateButton.disabled = true;
    messageArea.innerText = 'Generating your image, this may take a moment...';
    imageElement.style.display = 'none'; // Hide the old image

    const backendUrl = 'https://lucius-backend.onrender.com'; // Use your actual backend URL

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
        generateButton.setAttribute('aria-busy', 'false');
        generateButton.disabled = false;
    }
}