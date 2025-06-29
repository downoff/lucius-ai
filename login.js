document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);
});

async function handleLogin(event) {
    event.preventDefault(); // Stop the page from reloading

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageArea = document.getElementById('message-area');
    const loginButton = document.getElementById('login-button');

    loginButton.setAttribute('aria-busy', 'true');
    loginButton.disabled = true;
    messageArea.innerText = '';

    try {
        const response = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Success! The server sent back a token.
            messageArea.innerText = 'Login successful! Redirecting...';
            messageArea.style.color = 'green';
            
            // CRITICAL STEP: Save the token to localStorage.
            // localStorage is a small storage space in the browser.
            localStorage.setItem('token', data.token);

            // Redirect to the homepage after a short delay.
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);

        } else {
            // Handle errors from the server (e.g., "Invalid credentials")
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