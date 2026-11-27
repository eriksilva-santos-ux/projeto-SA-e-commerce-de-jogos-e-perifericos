const loginForm = document.getElementById('loginForm');
    const email = document.getElementById('email');
    const password = document.getElementById('password');

    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();

      const storedFullName = localStorage.getItem('fullName');
      const storedEmail = localStorage.getItem('email');
      const storedPassword = localStorage.getItem('password');

      if (email.value !== storedEmail || password.value !== storedPassword) {
        alert('E-mail ou senha incorretos. Por favor, tente novamente.');
        return;
      }

      alert('Login realizado com sucesso! Bem-vindo(a), ' + storedFullName + '!');
      window.location.href = 'index.html';
    });