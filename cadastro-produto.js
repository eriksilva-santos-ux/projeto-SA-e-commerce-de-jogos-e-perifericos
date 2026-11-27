const adminSessao = JSON.parse(sessionStorage.getItem('adminLogado'));
    if (!adminSessao) {
      alert('Acesso restrito! Faça login como administrador.');
      window.location.href = 'acesso.html';
    } else {
      const adminNomeBadge = document.getElementById('adminNomeBadge');
      adminNomeBadge.innerHTML = `<i class="bi bi-person-badge text-danger me-1"></i>${adminSessao.nome}`;
    }

    document.getElementById('btnSairAdmin').addEventListener('click', () => {
      sessionStorage.removeItem('adminLogado');
      window.location.href = 'acesso.html';
    });

    const STORAGE_KEY = 'vortex_produtos';
    const IMAGEM_PADRAO = 'https://placehold.co/100x100/121620/ff0055?text=Vortex';

    const formProduto = document.getElementById('formProduto');
    const produtoIdInput = document.getElementById('produtoId');
    const nomeInput = document.getElementById('nome');
    const marcaInput = document.getElementById('marca');
    const precoInput = document.getElementById('preco');
    const estoqueInput = document.getElementById('estoque');
    const categoriaInput = document.getElementById('categoria');
    const seloInput = document.getElementById('selo');
    const opcoesInput = document.getElementById('opcoes');
    const imagemInput = document.getElementById('imagem');
    const descricaoInput = document.getElementById('descricao');

    const corpoTabela = document.getElementById('corpoTabela');
    const semResultado = document.getElementById('semResultado');
    const textoSemResultado = document.getElementById('textoSemResultado');
    const contador = document.getElementById('contador');
    const resultadoAlert = document.getElementById('resultado');

    const buscaInput = document.getElementById('busca');
    const btnTodos = document.getElementById('btnTodos');
    const btnSalvar = document.getElementById('btnSalvar');
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
    const tituloFormulario = document.getElementById('tituloFormulario');
    const badgeEdicao = document.getElementById('badgeEdicao');

    function obterProdutos() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    function salvarProdutos(lista) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    }

    function formatarMoeda(valor) {
      return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function mostrarMensagem(texto, tipo = 'success') {
      resultadoAlert.className = `alert alert-${tipo} alert-dismissible fade show`;
      resultadoAlert.innerHTML = `
        <i class="bi ${tipo === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill'} me-2"></i>
        ${texto}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      setTimeout(() => {
        resultadoAlert.classList.add('d-none');
      }, 4000);
    }

    function renderizarTabela(filtro = '') {
      const produtos = obterProdutos();
      const termo = filtro.trim().toLowerCase();

      const filtrados = termo
        ? produtos.filter(p =>
            p.nome.toLowerCase().includes(termo) ||
            p.categoria.toLowerCase().includes(termo)
          )
        : produtos;

      corpoTabela.innerHTML = '';

      if (filtrados.length === 0) {
        semResultado.classList.remove('d-none');
        textoSemResultado.textContent = termo
          ? `Nenhum produto encontrado para "${filtro}".`
          : 'Nenhum produto cadastrado ainda.';
      } else {
        semResultado.classList.add('d-none');

        filtrados.forEach((produto, index) => {
          const badgeEstoque =
            produto.estoque > 5
              ? 'bg-success bg-opacity-10 text-success border-success'
              : produto.estoque > 0
              ? 'bg-warning bg-opacity-10 text-warning border-warning'
              : 'bg-danger bg-opacity-10 text-danger border-danger';

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="ps-3 text-secondary fw-semibold">${index + 1}</td>
            <td>
              <div class="d-flex align-items-center gap-2">
                <img src="${produto.imagem || IMAGEM_PADRAO}" alt="${produto.nome}" class="product-thumb" onerror="this.src='${IMAGEM_PADRAO}'">
                <div>
                  <span class="fw-semibold text-white d-block">${produto.nome}</span>
                  <small class="text-secondary">${produto.marca || 'Vortex'}</small>
                </div>
              </div>
            </td>
            <td><span class="badge bg-dark border border-secondary">${produto.categoria}</span></td>
            <td class="text-center">
              <span class="badge border border-opacity-25 ${badgeEstoque}">
                ${produto.estoque} un.
              </span>
            </td>
            <td class="text-end fw-bold text-success">${formatarMoeda(produto.preco)}</td>
            <td class="text-end pe-3 text-nowrap">
              <a href="detalhe-produto.html?id=${produto.id}" class="btn btn-outline-light btn-sm me-1" title="Ver Detalhes">
                <i class="bi bi-eye"></i>
              </a>
              <button type="button" class="btn btn-outline-info btn-sm me-1" title="Editar" onclick="editarProduto(${produto.id})">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn btn-outline-danger btn-sm" title="Excluir" onclick="excluirProduto(${produto.id})">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          `;
          corpoTabela.appendChild(tr);
        });
      }

      contador.textContent = `${filtrados.length} produto(s) exibido(s) de ${produtos.length}`;
    }

    formProduto.addEventListener('submit', function (e) {
      e.preventDefault();

      const idEditando = produtoIdInput.value;
      const nome = nomeInput.value.trim();
      const marca = marcaInput.value.trim() || 'Vortex';
      const preco = parseFloat(precoInput.value);
      const estoque = parseInt(estoqueInput.value, 10) || 0;
      const categoria = categoriaInput.value;
      const selo = seloInput.value;
      const opcoes = opcoesInput.value.trim();
      const imagem = imagemInput.value.trim();
      const descricao = descricaoInput.value.trim() || 'Produto oficial Vortex com garantia, alto desempenho e envio rápido para todo o Brasil.';

      if (!nome || isNaN(preco) || preco <= 0) {
        mostrarMensagem('Preencha o nome e um preço válido maior que zero.', 'danger');
        return;
      }

      const produtos = obterProdutos();

      if (idEditando) {
        const index = produtos.findIndex(p => p.id === Number(idEditando));
        if (index !== -1) {
          produtos[index] = {
            ...produtos[index],
            nome,
            marca,
            preco,
            estoque,
            categoria,
            selo,
            opcoes,
            imagem,
            descricao
          };
          salvarProdutos(produtos);
          mostrarMensagem(`Produto "${nome}" atualizado com sucesso!`, 'info');
        }
        sairModoEdicao();
      } else {
        const novoProduto = {
          id: Date.now(),
          nome,
          marca,
          preco,
          estoque,
          categoria,
          selo,
          opcoes,
          imagem,
          descricao
        };
        produtos.push(novoProduto);
        salvarProdutos(produtos);
        formProduto.reset();
        estoqueInput.value = 1;
        mostrarMensagem(`Produto "${nome}" cadastrado com sucesso!`, 'success');
      }

      renderizarTabela(buscaInput.value);
    });

    window.editarProduto = function (id) {
      const produtos = obterProdutos();
      const produto = produtos.find(p => p.id === id);
      if (!produto) return;

      produtoIdInput.value = produto.id;
      nomeInput.value = produto.nome;
      marcaInput.value = produto.marca || '';
      precoInput.value = produto.preco;
      estoqueInput.value = produto.estoque;
      categoriaInput.value = produto.categoria;
      seloInput.value = produto.selo || 'Novidade';
      opcoesInput.value = produto.opcoes || '';
      imagemInput.value = produto.imagem || '';
      descricaoInput.value = produto.descricao || '';

      tituloFormulario.innerHTML = `<i class="bi bi-pencil-square text-warning"></i> Editar Produto`;
      badgeEdicao.classList.remove('d-none');
      btnSalvar.innerHTML = `<i class="bi bi-save me-1"></i> Salvar Alterações`;
      btnCancelarEdicao.classList.remove('d-none');
      nomeInput.focus();
    };

    function sairModoEdicao() {
      produtoIdInput.value = '';
      formProduto.reset();
      estoqueInput.value = 1;
      tituloFormulario.innerHTML = `<i class="bi bi-plus-circle-fill" style="color: #ff0055;"></i> Novo Produto`;
      badgeEdicao.classList.add('d-none');
      btnSalvar.innerHTML = `<i class="bi bi-check2-circle me-1"></i> Cadastrar Produto`;
      btnCancelarEdicao.classList.add('d-none');
    }

    btnCancelarEdicao.addEventListener('click', sairModoEdicao);

    window.excluirProduto = function (id) {
      const produtos = obterProdutos();
      const produto = produtos.find(p => p.id === id);
      if (!produto) return;

      if (confirm(`Deseja realmente excluir "${produto.nome}" do catálogo?`)) {
        const atualizados = produtos.filter(p => p.id !== id);
        salvarProdutos(atualizados);
        if (Number(produtoIdInput.value) === id) sairModoEdicao();
        renderizarTabela(buscaInput.value);
        mostrarMensagem(`Produto "${produto.nome}" removido.`, 'warning');
      }
    };

    buscaInput.addEventListener('input', () => renderizarTabela(buscaInput.value));

    btnTodos.addEventListener('click', () => {
      buscaInput.value = '';
      renderizarTabela();
    });

    document.getElementById('btnCarregarExemplos').addEventListener('click', () => {
      const atuais = obterProdutos();
      if (atuais.length > 0 && !confirm('Isso adicionará 3 produtos de exemplo à lista atual. Continuar?')) {
        return;
      }
      const exemplos = [
        {
          id: Date.now() + 1,
          nome: 'Grand Theft Auto VI',
          marca: 'Rockstar Games',
          preco: 349.90,
          estoque: 15,
          categoria: 'Jogos',
          selo: 'Novidade',
          opcoes: 'PS5, Xbox Series X/S, PC',
          imagem: 'imagens/GTA_VI_cover.jpg',
          descricao: 'Grand Theft Auto VI leva você para o estado de Leonida, lar das ruas em neon de Vice City, na maior e mais imersiva evolução da franquia até hoje.'
        },
        {
          id: Date.now() + 2,
          nome: 'PlayStation 5 Pro SSD 2TB',
          marca: 'Sony',
          preco: 7390.00,
          estoque: 4,
          categoria: 'Consoles',
          selo: 'Em Estoque',
          opcoes: 'Branco',
          imagem: 'https://images.kabum.com.br/produtos/fotos/636960/console-playstation-5-pro-sony-ssd-2tb-controle-sem-fio-dualsense-branco-1000046552_1727095996_g.jpg',
          descricao: 'O PlayStation 5 Pro entrega gráficos ultrarrealistas com Ray Tracing avançado, resolução 4K nítida com PSSR e armazenamento SSD ultrarrápido de 2TB.'
        },
        {
          id: Date.now() + 3,
          nome: 'Teclado Gamer Mecânico Wooting 60HE+',
          marca: 'Wooting',
          preco: 1826.00,
          estoque: 8,
          categoria: 'Periféricos',
          selo: 'Promoção',
          opcoes: 'Preto',
          imagem: 'https://http2.mlstatic.com/D_Q_NP_2X_660385-MLB117250273565_092026-P.webp',
          descricao: 'Teclado analógico magnético 60% com Rapid Trigger ajustável de 0.1mm, switches Lekker e tempo de resposta competitivo.'
        }
      ];
      salvarProdutos([...atuais, ...exemplos]);
      renderizarTabela();
      mostrarMensagem('Produtos de exemplo carregados!', 'success');
    });

    renderizarTabela();