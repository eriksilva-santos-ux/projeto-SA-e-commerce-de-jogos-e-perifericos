const registerForm = document.getElementById('registerForm');
    const fullName = document.getElementById('fullName');
    const cpf = document.getElementById('cpf');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    registerForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      if (password.value !== confirmPassword.value) {
        alert('As senhas não são iguais. Por favor, tente novamente.');
        return;
      } 
      localStorage.setItem('fullName', fullName.value);
      localStorage.setItem('cpf', cpf.value);
      localStorage.setItem('email', email.value);
      localStorage.setItem('password', password.value);
      
      alert('Conta criada com sucesso, ' + fullName.value + '!');
      window.location.href = 'login.html';
    });

    cpf.addEventListener('input', function(event) {
      let valor = event.target.value.replace(/\D/g, '');
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      event.target.value = valor;
    });