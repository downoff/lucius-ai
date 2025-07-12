// Use your live backend URL from Render
const backendUrl = 'https://lucius-ai.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // Check if the user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html'; // Redirect if not logged in
        return;
    }

    // Load existing scheduled posts when the page loads
    loadScheduledPosts(token);

    // Add listener for the schedule form
    const scheduleForm = document.getElementById('schedule-form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', (event) => handleScheduleSubmit(event, token));
    }
});

/**
 * Fetches and displays the list of scheduled posts
 */
async function loadScheduledPosts(token) {
    const postsListDiv = document.getElementById('scheduled-posts-list');
    postsListDiv.innerHTML = '<p>Loading scheduled posts...</p>';

    try {
        const response = await fetch(`${backendUrl}/api/scheduled-posts`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Failed to fetch posts.');

        const posts = await response.json();
        postsListDiv.innerHTML = ''; // Clear loading message

        if (posts.length === 0) {
            postsListDiv.innerHTML = '<p>You have no scheduled posts yet.</p>';
            return;
        }

        const list = document.createElement('ul');
        posts.forEach(post => {
            const listItem = document.createElement('li');
            const postDate = new Date(post.scheduledAt).toLocaleString();
            listItem.innerHTML = `
                <p><strong>Status:</strong> ${post.status}</p>
                <p>"${post.content}"</p>
                <p><small>Scheduled for: ${postDate}</small></p>
                <button data-id="${post._id}" class="delete-button secondary outline">Delete</button>
            `;
            list.appendChild(listItem);
        });
        postsListDiv.appendChild(list);

        // Add event listeners to the new delete buttons
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (event) => handleDeletePost(event, token));
        });

    } catch (error) {
        console.error(error);
        postsListDiv.innerHTML = '<p style="color: red;">Could not load scheduled posts.</p>';
    }
}

/**
 * Handles the submission of the new post form
 */
async function handleScheduleSubmit(event, token) {
    event.preventDefault();
    const scheduleButton = document.getElementById('schedule-button');
    const messageArea = document.getElementById('schedule-message-area');
    const content = document.getElementById('post-content').value;
    const scheduledAt = document.getElementById('schedule-datetime').value;

    scheduleButton.setAttribute('aria-busy', 'true');
    scheduleButton.disabled = true;

    try {
        const response = await fetch(`${backendUrl}/api/schedule-post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ content, platform: 'X/Twitter', scheduledAt })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to schedule post.');
        }

        messageArea.innerText = 'Post scheduled successfully!';
        messageArea.style.color = 'green';
        document.getElementById('schedule-form').reset(); // Clear the form
        loadScheduledPosts(token); // Refresh the list of posts

    } catch (error) {
        console.error(error);
        messageArea.innerText = `Error: ${error.message}`;
        messageArea.style.color = 'red';
    } finally {
        scheduleButton.setAttribute('aria-busy', 'false');
        scheduleButton.disabled = false;
    }
}

/**
 * Handles deleting a scheduled post
 */
async function handleDeletePost(event, token) {
    const postId = event.target.getAttribute('data-id');
    if (!confirm('Are you sure you want to delete this scheduled post?')) {
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/api/scheduled-posts/${postId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Failed to delete post.');

        alert('Post deleted successfully.');
        loadScheduledPosts(token); // Refresh the list

    } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
    }
}