document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    signupForm.addEventListener('submit', handleSignup);
});

async function handleSignup(event) {
    event.preventDefault(); // Stop the page from reloading

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageArea = document.getElementById('message-area');
    const signupButton = document.getElementById('signup-button');

    signupButton.setAttribute('aria-busy', 'true');
    signupButton.disabled = true;
    messageArea.innerText = '';

    try {
        const response = await fetch('http://localhost:3000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // response.ok checks if the status code is 2xx
            messageArea.innerText = 'Success! Your account has been created.';
            messageArea.style.color = 'green';
            // Optionally redirect to a login page after a delay
            // setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        } else {
            // Handle errors from the server (e.g., "User already exists")
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