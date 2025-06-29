// Define the backend URL at the top.
// IMPORTANT: Replace this with your actual backend URL from Render.
const backendUrl = 'https://lucius-ai.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);
});

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageArea = document.getElementById('message-area');
    const loginButton = document.getElementById('login-button');

    loginButton.setAttribute('aria-busy', 'true');
    loginButton.disabled = true;
    messageArea.innerText = '';

    try {
        const response = await fetch(`${backendUrl}/api/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
            messageArea.innerText = 'Login successful! Redirecting...';
            messageArea.style.color = 'green';
            localStorage.setItem('token', data.token);
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            messageArea.innerText = `Error: ${data.message}`;
            messageArea.style.color = 'red';
            loginButton.setAttribute('aria-busy', 'false');
            loginButton.disabled = false;
        }
    } catch (error) {
        console.error('Login fetch error:', error);
        messageArea.innerText = 'An error occurred. Please check the console and try again.';
        messageArea.style.color = 'red';
        loginButton.setAttribute('aria-busy', 'false');
        loginButton.disabled = false;
    }
}