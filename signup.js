// Define the backend URL at the top.
// IMPORTANT: Replace this with your actual backend URL from Render.
const backendUrl = 'https://lucius-ai.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    signupForm.addEventListener('submit', handleSignup);
});

async function handleSignup(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageArea = document.getElementById('message-area');
    const signupButton = document.getElementById('signup-button');

    signupButton.setAttribute('aria-busy', 'true');
    signupButton.disabled = true;
    messageArea.innerText = '';

    try {
        const response = await fetch(`${backendUrl}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
            messageArea.innerText = 'Success! Your account has been created. Please proceed to the login page.';
            messageArea.style.color = 'green';
        } else {
            messageArea.innerText = `Error: ${data.message}`;
            messageArea.style.color = 'red';
        }
    } catch (error) {
        console.error('Signup fetch error:', error);
        messageArea.innerText = 'An error occurred. Please check the console and try again.';
        messageArea.style.color = 'red';
    } finally {
        signupButton.setAttribute('aria-busy', 'false');
        signupButton.disabled = false;
    }
}