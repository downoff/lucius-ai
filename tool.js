// This function runs as soon as the tool.html page's content has loaded
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get the tool ID from the URL (e.g., "?id=12345")
    const params = new URLSearchParams(window.location.search);
    const toolId = params.get('id');

    // If there is no ID in the URL, show an error and stop.
    if (!toolId) {
        document.getElementById('tool-name').innerText = 'Tool not found! No ID provided.';
        // Hide the tool interface if there's no tool
        document.getElementById('tool-interface').style.display = 'none';
        return;
    }

    // 2. Fetch the details for this specific tool from our own backend server
    fetchToolDetails(toolId);

    // 3. Add an event listener to the form to know when the user clicks "Generate"
    const promptForm = document.getElementById('prompt-form');
    promptForm.addEventListener('submit', handleGeneration);
});


/**
 * Fetches the specific tool's details (name, description) from our server.
 * @param {string} toolId The ID of the tool to fetch.
 */
async function fetchToolDetails(toolId) {
    try {
        const response = await fetch(`http://localhost:3000/api/tools/${toolId}`);
        if (!response.ok) {
            throw new Error('Tool not found');
        }
        const tool = await response.json();

        // Update the page with the tool's information
        document.getElementById('tool-name').innerText = tool.name;
        document.getElementById('tool-description').innerText = tool.description;

    } catch (error) {
        console.error('Error fetching tool details:', error);
        document.getElementById('tool-name').innerText = 'Error loading tool.';
        document.getElementById('tool-interface').style.display = 'none';
    }
}


/**
 * Handles the AI generation when the user submits the form.
 * This function now uses puter.ai.chat() directly in the browser.
 * @param {Event} event The form submission event.
 */
function handleGeneration(event) {
    event.preventDefault(); // Prevent the form from reloading the page

    const generateButton = document.getElementById('generate-button');
    const promptInput = document.getElementById('prompt-input');
    const toolOutput = document.getElementById('tool-output');

    const prompt = promptInput.value;

    // Disable the button and show a loading message
    generateButton.setAttribute('aria-busy', 'true');
    generateButton.disabled = true;
    toolOutput.innerText = 'Generating, please wait...';

    // Use the Puter.js library to call the AI
    puter.ai.chat(prompt)
        .then(response => {
            // --- DEBUGGING LINE ---
            // This will print the full AI response to the browser's console (F12 -> Console).
            // This is our "x-ray" to see what the response looks like.
            console.log('Puter.ai responded with:', response);

            // --- THE FIX (Our Best Guess) ---
            // Instead of response.text, we are now trying to display the 'response' directly.
            toolOutput.innerText = response;
        })
        .catch(error => {
            console.error('Error during Puter.ai generation:', error);
            toolOutput.innerText = 'An error occurred. Please try again.';
        })
        .finally(() => {
            // Re-enable the button after the process is complete
            generateButton.setAttribute('aria-busy', 'false');
            generateButton.disabled = false;
        });
}