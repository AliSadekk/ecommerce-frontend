window.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const firstname = document.getElementById('firstname');
    const lastname = document.getElementById('lastname');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confpass = document.getElementById('confpass');

    const setFieldStatus = (input, isValid, message = '') => {
        const errorDisplay = input.parentElement.querySelector('small');
        input.classList.toggle('valid', isValid);
        input.classList.toggle('invalid', !isValid && input.value.trim() !== '');
        if (errorDisplay) {
            errorDisplay.textContent = !isValid && input.value.trim() !== '' ? message : '';
        }
    };

    const isEmailValid = (value) => {
        const pattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|hotmail\.com)$/;
        return pattern.test(value.trim());
    };

    const isPasswordValid = (value) => {
        const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
        return pattern.test(value.trim());
    };

    firstname.addEventListener('input', () => {
        const ok = firstname.value.trim().length > 0;
        setFieldStatus(firstname, ok, 'First name is required.');
    });

    lastname.addEventListener('input', () => {
        const ok = lastname.value.trim().length > 0;
        setFieldStatus(lastname, ok, 'Last name is required.');
    });

    email.addEventListener('input', () => {
        const ok = isEmailValid(email.value);
        setFieldStatus(email, ok, 'Enter a valid Gmail, Yahoo, or Hotmail address.');
    });

    password.addEventListener('input', () => {
        const ok = isPasswordValid(password.value);
        setFieldStatus(password, ok, 'Min 8 chars, 1 uppercase, 1 lowercase, 1 digit.');
        if (confpass.value.trim() !== '') {
            validateConfirmPassword();
        }
    });

    const validateConfirmPassword = () => {
        const matches = confpass.value.trim() === password.value.trim() && confpass.value.trim() !== '';
        setFieldStatus(confpass, matches, 'Passwords do not match.');
        return matches;
    };

    confpass.addEventListener('input', validateConfirmPassword);



form.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstOk = firstname.value.trim().length > 0;
    const lastOk = lastname.value.trim().length > 0;
    const emailOk = isEmailValid(email.value);
    const passOk = isPasswordValid(password.value);
    const confirmOk = validateConfirmPassword();

    setFieldStatus(firstname, firstOk, 'First name is required.');
    setFieldStatus(lastname, lastOk, 'Last name is required.');
    setFieldStatus(email, emailOk, 'Enter a valid Gmail, Yahoo, or Hotmail address.');
    setFieldStatus(password, passOk, 'Min 8 chars, 1 uppercase, 1 lowercase, 1 digit.');

    if (!firstOk || !lastOk || !emailOk || !passOk || !confirmOk) {
        return;
    }

   
    let users = [];
    try {
        const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        users = Array.isArray(storedUsers) ? storedUsers : [];
    } catch (error) {
        setFieldStatus(email, false, 'Unable to read saved accounts. Please try again.');
        return;
    }

    
    const emailExists = users.some(u => u.email.toLowerCase() === email.value.trim().toLowerCase());
    if (emailExists) {
        setFieldStatus(email, false, 'This email is already registered.');
        return;
    }

   
    const newUser = {
        firstName: firstname.value.trim(),
        lastName: lastname.value.trim(),
        email: email.value.trim(),
        password: password.value.trim()
    };

    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));

    alert('Registration successful! Redirecting to login...');
    window.location.href = 'login.html';
});
});