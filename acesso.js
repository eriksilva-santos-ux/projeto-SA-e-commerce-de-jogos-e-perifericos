const adminsAutorizados = [
      { id: '12345', senha: 'admin123', nome: 'Administrador Master', cargo: 'Gerente Geral' },
      { id: '99999', senha: 'vortex2026', nome: 'Suporte Vortex', cargo: 'Operador' }
    ];

    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminIdInput = document.getElementById('adminId');
    const adminPasswordInput = document.getElementById('adminPassword');
    const feedbackAlert = document.getElementById('feedbackAlert');
    const submitBtn = document.getElementById('submitBtn');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const togglePasswordIcon = document.getElementById('togglePasswordIcon');

    let tentativas = 0;
    const maxTentativas = 3;

    // Se já estiver logado, mostra atalho direto para o painel
    const sessaoAtiva = JSON.parse(sessionStorage.getItem('adminLogado'));
    if (sessaoAtiva) {
      mostrarAlerta(`Sessão ativa como ${sessaoAtiva.nome}. <a href="cadastro-produto.html" class="alert-link">Ir para o painel</a>`, 'info');
    }

    function atualizarBadgeCarrinho() {
      const cartBadge = document.getElementById('cart-badge');
      const carrinho = JSON.parse(localStorage.getItem('vortex_cart')) || [];
      const totalItens = carrinho.reduce((acc, item) => acc + (item.qty || 1), 0);
      if (cartBadge) cartBadge.textContent = totalItens;
    }
    atualizarBadgeCarrinho();

    togglePasswordBtn.addEventListener('click', function () {
      const isPassword = adminPasswordInput.type === 'password';
      adminPasswordInput.type = isPassword ? 'text' : 'password';
      togglePasswordIcon.classList.toggle('bi-eye', !isPassword);
      togglePasswordIcon.classList.toggle('bi-eye-slash', isPassword);
    });

    function mostrarAlerta(mensagem, tipo) {
      feedbackAlert.className = `alert alert-${tipo} mt-3 mb-0 py-2 small d-flex align-items-center gap-2`;
      const icone = tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
      feedbackAlert.innerHTML = `<i class="bi ${icone}"></i><span>${mensagem}</span>`;
    }

    adminLoginForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const idDigitado = adminIdInput.value.trim();
      const senhaDigitada = adminPasswordInput.value;

      if (!idDigitado || !senhaDigitada) {
        mostrarAlerta('Preencha o ID de Administrador e a senha.', 'warning');
        return;
      }

      const adminEncontrado = adminsAutorizados.find(
        (adm) => adm.id === idDigitado && adm.senha === senhaDigitada
      );

      if (adminEncontrado) {
        sessionStorage.setItem('adminLogado', JSON.stringify({
          id: adminEncontrado.id,
          nome: adminEncontrado.nome,
          cargo: adminEncontrado.cargo,
          loginEm: new Date().toISOString()
        }));

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Acessando...';
        mostrarAlerta(`Bem-vindo(a), ${adminEncontrado.nome}! Redirecionando...`, 'success');

        setTimeout(() => {
          window.location.href = 'cadastro-produto.html';
        }, 800);
      } else {
        tentativas++;
        const restantes = maxTentativas - tentativas;

        if (restantes <= 0) {
          submitBtn.disabled = true;
          adminIdInput.disabled = true;
          adminPasswordInput.disabled = true;
          mostrarAlerta('Acesso bloqueado temporariamente por excesso de tentativas inválidas.', 'danger');
        } else {
          mostrarAlerta(`ID ou senha inválidos. Você tem mais ${restantes} tentativa(s).`, 'danger');
          adminPasswordInput.value = '';
          adminPasswordInput.focus();
        }
      }
    });