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
          nome: "Marvel's Wolverine",
          marca: 'Insomniac Games',
          preco: 317.07,
          estoque: 10,
          categoria: 'Jogos',
          selo: 'Novidade',
          opcoes: 'PS5',
          imagem: 'https://image.api.playstation.com/vulcan/ap/rnd/202510/0721/e54995d925972b21f0092d0f27a4884f2c883c439514dede.png',
          descricao: "Marvel's Wolverine é um jogo de ação e aventura em terceira pessoa focado em entregar uma experiência visceral, adulta e brutal na pele de Logan. Desenvolvido pela Insomniac Games para PlayStation 5, o título traz uma história original e emocionante onde o mutante embarca em uma jornada global — passando por locais icônicos como o Canadá e Madripoor — para desvendar mistérios do seu passado e lutar pela sobrevivência da espécie mutante."
        },
        {
          id: Date.now() + 2,
          nome: 'EA SPORTS FC™ 26',
          marca: 'Electronic Arts',
          preco: 349.90,
          estoque: 4,
          categoria: 'Jogos',
          selo: 'Em Estoque',
          opcoes: 'PS5, PS4, Xbox Series X/S, Xbox One, PC',
          imagem: 'https://image.api.playstation.com/vulcan/ap/rnd/202608/0314/d0cc38456ebe67005ebea2709f52a3d2f6780985b6403219.png',
          descricao: 'Jogo de simulação de futebol lançado pela Electronic Arts em setembro de 2025. Desenvolvido pela EA Vancouver e EA Romania, o título conta com mais de 20.000 atletas, 750 clubes e seleções, 120 estádios e 35 ligas.'
        },
        {
          id: Date.now() + 3,
          nome: 'Grand Theft Auto V',
          marca: 'Rockstar North',
          preco: 136.90,
          estoque: 80,
          categoria: 'Jogos',
          selo: 'Promoção',
          opcoes: 'PS5, PS4, PS3, Xbox 360, Xbox Series X/S, Xbox One, PC',
          imagem: 'https://thumb.wikimedia.org/wikipedia/pt/thumb/8/80/Grand_Theft_Auto_V_capa.png/250px-Grand_Theft_Auto_V_capa.png?utm_source=pt.wikipedia.org&utm_campaign=parser&utm_content=thumbnail',
          descricao: 'Grand Theft Auto V é um jogo eletrônico de ação-aventura desenvolvido pela Rockstar North e publicado pela Rockstar Games. Ambientado no estado fictício de San Andreas, baseado no sul da Califórnia, o modo história para um jogador acompanha três protagonistas.'
        }
      ];
      salvarProdutos([...atuais, ...exemplos]);
      renderizarTabela();
      mostrarMensagem('Produtos de exemplo carregados!', 'success');
    });

    renderizarTabela();