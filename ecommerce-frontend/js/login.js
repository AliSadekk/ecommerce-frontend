window.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    const clearErrors = () => {
        emailError.textContent = '';
        passwordError.textContent = '';
        emailInput.classList.remove('invalid');
        passwordInput.classList.remove('invalid');
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors();

        const emailVal = emailInput.value.trim().toLowerCase();
        const passVal = passwordInput.value.trim();

        
        let users = [];
        try {
            const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            users = Array.isArray(storedUsers) ? storedUsers : [];
        } catch (error) {
            emailError.textContent = 'Unable to read saved accounts. Please try again.';
            return;
        }

       
        const userAccount = users.find(u => u.email === emailVal);

        if (!userAccount) {
            emailError.textContent = 'No account found with this email.';
            emailInput.classList.add('invalid');
            return;
        }

       
        if (userAccount.password !== passVal) {
            passwordError.textContent = 'Incorrect password.';
            passwordInput.classList.add('invalid');
            return;
        }

        
        localStorage.setItem('currentUser', JSON.stringify({
            firstName: userAccount.firstName,
            lastName: userAccount.lastName,
            email: userAccount.email
        }));

        alert(`Welcome back, ${userAccount.firstName}!`);
        
    });
});