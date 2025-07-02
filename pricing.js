document.addEventListener('DOMContentLoaded', () => {
    const upgradeButton = document.getElementById('upgrade-button');
    if (upgradeButton) {
        upgradeButton.addEventListener('click', handleUpgradeClick);
    }
});

function handleUpgradeClick(event) {
    // Check for a login token in localStorage
    const token = localStorage.getItem('token');

    if (token) {
        // If the user is logged in, let them proceed to payment.
        // The link in the HTML already points to Stripe.
        console.log('User is logged in, proceeding to Stripe.');
        return true; 
    } else {
        // If the user is NOT logged in, stop them from going to Stripe.
        event.preventDefault(); 
        // And redirect them to the sign-up page first.
        alert('Please create a free account first to continue your upgrade.');
        window.location.href = 'signup.html';
    }
}