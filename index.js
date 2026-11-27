const STORAGE_PRODUTOS = 'vortex_produtos';
    const CART_KEY = 'vortex_cart';
    const IMAGEM_PADRAO = 'https://placehold.co/300x200/121620/ff0055?text=Vortex';

    function formatarMoeda(valor) {
      return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // 1. Renderiza na Home os produtos cadastrados no painel (cadastro-produto.html)
    function carregarProdutosCadastrados() {
      const produtos = JSON.parse(localStorage.getItem(STORAGE_PRODUTOS)) || [];
      const section = document.getElementById('novidadesAdminSection');
      const grid = document.getElementById('novidadesAdminGrid');

      if (produtos.length === 0) {
        section.classList.add('d-none');
        return;
      }

      section.classList.remove('d-none');
      grid.innerHTML = '';

      produtos.forEach((produto) => {
        const imgUrl = produto.imagem || IMAGEM_PADRAO;
        const semEstoque = Number(produto.estoque) <= 0;

        const col = document.createElement('div');
        col.className = 'col-6 col-md-3 product-item';

        const card = document.createElement('div');
        card.className = 'card card-custom h-100 p-3';

        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = produto.nome;
        img.className = 'card-img-top rounded mb-3';
        img.style.cssText = 'height: 200px; object-fit: cover; width: 100%;';
        img.onerror = function () { this.src = IMAGEM_PADRAO; };

        const body = document.createElement('div');
        body.className = 'card-body d-flex flex-column justify-content-between p-0 text-center';

        const topInfo = document.createElement('div');
        topInfo.innerHTML = `
          <h5 class="card-title text-white mb-1 fs-6">${produto.nome}</h5>
          <p class="card-text text-secondary small mb-2">
            ${produto.categoria} • ${semEstoque ? '<span class="text-danger">Esgotado</span>' : produto.estoque + ' em estoque'}
          </p>
        `;

        const bottomInfo = document.createElement('div');
        bottomInfo.innerHTML = `<span class="fs-5 fw-bold text-success d-block mb-3">${formatarMoeda(produto.preco)}</span>`;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'd-grid gap-2';

        const btnAdd = document.createElement('button');
        btnAdd.type = 'button';
        btnAdd.className = 'btn btn-action btn-sm';
        btnAdd.disabled = semEstoque;
        btnAdd.innerHTML = `<i class="bi ${semEstoque ? 'bi-x-circle' : 'bi-cart-plus'} me-1"></i> ${semEstoque ? 'Esgotado' : 'Adicionar'}`;
        btnAdd.addEventListener('click', () => {
          addToCart(produto.id, produto.nome, produto.preco, produto.categoria, imgUrl);
        });

        const btnDetalhes = document.createElement('a');
        btnDetalhes.href = `detalhe-produto.html?id=${produto.id}`;
        btnDetalhes.className = 'btn btn-outline-secondary btn-sm text-white';
        btnDetalhes.textContent = 'Ver Detalhes';

        actionsDiv.appendChild(btnAdd);
        actionsDiv.appendChild(btnDetalhes);
        bottomInfo.appendChild(actionsDiv);
        body.appendChild(topInfo);
        body.appendChild(bottomInfo);
        card.appendChild(img);
        card.appendChild(body);
        col.appendChild(card);
        grid.appendChild(col);
      });
    }

    // 2. Carrinho padronizado com cart.html (chave 'vortex_cart' e propriedade 'qty')
    function atualizarBadgeCarrinho() {
      const cartBadge = document.getElementById('cart-badge');
      const carrinho = JSON.parse(localStorage.getItem(CART_KEY)) || [];
      const total = carrinho.reduce((acc, item) => acc + (item.qty || 1), 0);
      if (cartBadge) cartBadge.textContent = total;
    }

    window.addToCart = function (id, name, price, category, image) {
      const carrinho = JSON.parse(localStorage.getItem(CART_KEY)) || [];
      const existente = carrinho.find(item => item.id === id);

      if (existente) {
        existente.qty = (existente.qty || 1) + 1;
      } else {
        carrinho.push({ id, name, price, category, image, qty: 1 });
      }

      localStorage.setItem(CART_KEY, JSON.stringify(carrinho));
      atualizarBadgeCarrinho();

      const toastMsg = document.getElementById('toast-message');
      const toastEl = document.getElementById('cartToast');
      if (toastMsg && toastEl) {
        toastMsg.textContent = `"${name}" adicionado ao carrinho!`;
        bootstrap.Toast.getOrCreateInstance(toastEl).show();
      }
    };

    // 3. Pesquisa na loja
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchStatusBanner = document.getElementById('searchStatusBanner');
    const searchStatusText = document.getElementById('searchStatusText');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const searchedTerm = document.getElementById('searchedTerm');
    const searchResultsSection = document.getElementById('searchResultsSection');
    const searchResultsGrid = document.getElementById('searchResultsGrid');
    const heroSection = document.getElementById('heroSection');

    function filtrarLoja(termoRaw) {
      const termo = termoRaw.trim().toLowerCase();
      const secoes = document.querySelectorAll('.product-section');

      if (!termo) {
        limparPesquisa();
        return;
      }

      clearSearchBtn.classList.remove('d-none');
      heroSection.classList.add('d-none');
      secoes.forEach(sec => sec.classList.add('d-none'));

      const todosItens = document.querySelectorAll('.product-section .product-item');
      searchResultsGrid.innerHTML = '';
      let encontrados = 0;

      todosItens.forEach(item => {
        const texto = item.textContent.toLowerCase();
        if (texto.includes(termo)) {
          searchResultsGrid.appendChild(item.cloneNode(true));
          encontrados++;
        }
      });

      searchStatusBanner.classList.remove('d-none');
      searchStatusBanner.classList.add('d-flex');

      if (encontrados > 0) {
        searchStatusText.textContent = `${encontrados} resultado(s) encontrado(s) para "${termoRaw}"`;
        searchResultsSection.classList.remove('d-none');
        noResultsMessage.classList.add('d-none');
      } else {
        searchStatusText.textContent = `Busca por "${termoRaw}"`;
        searchedTerm.textContent = termoRaw;
        searchResultsSection.classList.add('d-none');
        noResultsMessage.classList.remove('d-none');
      }
    }

    window.limparPesquisa = function () {
      searchInput.value = '';
      clearSearchBtn.classList.add('d-none');
      searchStatusBanner.classList.add('d-none');
      searchStatusBanner.classList.remove('d-flex');
      noResultsMessage.classList.add('d-none');
      searchResultsSection.classList.add('d-none');
      heroSection.classList.remove('d-none');

      document.querySelectorAll('.product-section').forEach(sec => {
        if (sec.id === 'novidadesAdminSection') {
          const temCadastrados = (JSON.parse(localStorage.getItem(STORAGE_PRODUTOS)) || []).length > 0;
          sec.classList.toggle('d-none', !temCadastrados);
        } else {
          sec.classList.remove('d-none');
        }
      });
    };

    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      filtrarLoja(searchInput.value);
    });

    searchInput.addEventListener('input', () => {
      if (searchInput.value.trim() === '') limparPesquisa();
    });

    clearSearchBtn.addEventListener('click', limparPesquisa);

    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_PRODUTOS) carregarProdutosCadastrados();
      if (e.key === CART_KEY) atualizarBadgeCarrinho();
    });

    carregarProdutosCadastrados();
    atualizarBadgeCarrinho();