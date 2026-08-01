/* ============================================================
   CARDÁPIO DIGITAL — Lógica do Cliente (Persistência no Banco)
   ============================================================ */

const cardapio = {
  produtos: [],
  clientes: [],
  enderecos: [],
  carrinho: [],
  categoriaAtual: 'destaques',

  async init() {
    await openIDB();
    await this.carregarDados();
    this.bindTabs();
    this.render();
  },

  async carregarDados() {
    // Carrega produtos do banco (Supabase ou IndexedDB)
    try {
      this.produtos = await dbCarregarProdutos();
    } catch (e) {
      console.warn('Erro ao carregar produtos do banco:', e);
      this.produtos = [];
    }

    // Carrega clientes e endereços existentes para gerar IDs sequenciais
    try {
      this.clientes = await dbCarregarClientes();
    } catch (e) { this.clientes = []; }
    try {
      this.enderecos = await dbCarregarEnderecos();
    } catch (e) { this.enderecos = []; }

    // Seed mínima se não houver produtos no banco
    if (this.produtos.length === 0) {
      const seed = [
        { id: 1, nome: 'Coca-Cola Lata', preco: 7.00, visivel: true, categoria: 'bebidas', descricao: '350ml', imagem_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80' },
        { id: 2, nome: 'Hot Dog Tradicional', preco: 15.00, visivel: true, categoria: 'lanches', descricao: 'Pão 15cm, molho de carne, salsicha, milho verde, batata palha, vinagrete e ovo de codorna', imagem_url: 'https://images.unsplash.com/photo-1612392062126-2f3db5023f3e?w=300&q=80' },
        { id: 3, nome: 'Batatinha Frita', preco: 20.00, visivel: true, categoria: 'porcoes', descricao: 'Porção de batatinha frita crocante', imagem_url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=300&q=80' },
        { id: 4, nome: 'Hambúrguer Duplo', preco: 33.00, visivel: true, categoria: 'lanches', descricao: '2 Carnes, 2 Tomates, 2 Fatias de Presunto, 2 Fatias de Queijo, o dobro de Calabresa', imagem_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' },
        { id: 5, nome: 'X-Tudo', preco: 23.00, visivel: true, categoria: 'lanches', descricao: 'Pão bola, Carne, Queijo, Presunto, Salsicha, Ovo, Calabresa, Bacon, Cebola, Tomate e Alface', imagem_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&q=80' },
        { id: 6, nome: 'Hambúrguer', preco: 22.00, visivel: true, categoria: 'lanches', descricao: 'Pão bola, Carne, Ovo, Queijo, Presunto, Cebola, Tomate e Alface', imagem_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80' },
        { id: 7, nome: "Hambúrguer Kid's", preco: 17.00, visivel: true, categoria: 'lanches', descricao: 'Pão bola, Carne, Queijo e Presunto', imagem_url: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=300&q=80' },
        { id: 8, nome: 'Refrigerante Lata', preco: 6.00, visivel: true, categoria: 'bebidas', descricao: '350ml', imagem_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80' },
        { id: 9, nome: 'Suco Natural', preco: 10.00, visivel: true, categoria: 'bebidas', descricao: 'Laranja, maracujá ou acerola', imagem_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&q=80' },
        { id: 10, nome: 'X-Salada', preco: 21.00, visivel: true, categoria: 'lanches', descricao: 'Pão bola, Carne, Queijo, Presunto, Cebola, Tomate e Alface', imagem_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&q=80' },
      ];
      for (const p of seed) {
        this.produtos.push(p);
        try { await dbSalvarProduto(p); } catch (e) { console.warn('Erro ao salvar seed produto:', e); }
      }
    }
  },

  // Gera próximo ID numérico sequencial compatível com o banco
  nextId(lista) {
    if (!lista || lista.length === 0) return 1;
    return Math.max(...lista.map(x => Number(x.id) || 0)) + 1;
  },

  bindTabs() {
    document.querySelectorAll('.cp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.cp-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.categoriaAtual = tab.dataset.cat;
        this.render();
      });
    });
  },

  render() {
    this.renderDestaques();
    this.renderLista();
    this.atualizarFab();
  },

  getDestaques() {
    return this.produtos.filter(p => p.visivel).slice(0, 4);
  },

  getPorCategoria(cat) {
    if (cat === 'destaques') return this.produtos.filter(p => p.visivel);
    return this.produtos.filter(p => p.visivel && p.categoria === cat);
  },

  renderDestaques() {
    const grid = document.getElementById('gridDestaques');
    const destaques = this.getDestaques();
    grid.innerHTML = destaques.map(p => `
      <div class="cp-destaque-card">
        <button class="cp-add-btn" onclick="cardapio.adicionar(${p.id})">+</button>
        <img src="${p.imagem_url || 'https://via.placeholder.com/80?text=🍔'}" class="cp-destaque-img" alt="${this.esc(p.nome)}">
        <div class="cp-destaque-name">${this.esc(p.nome)}</div>
        <div class="cp-destaque-price">R$ ${p.preco.toFixed(2).replace('.', ',')}</div>
      </div>
    `).join('');
  },

  renderLista() {
    const titulo = document.getElementById('listaTitulo');
    const grid = document.getElementById('gridLista');
    const nomes = { destaques: 'Todos os Produtos', lanches: 'Lanches', bebidas: 'Bebidas', porcoes: 'Porções' };
    titulo.textContent = nomes[this.categoriaAtual] || 'Produtos';
    const lista = this.getPorCategoria(this.categoriaAtual);

    grid.innerHTML = lista.map(p => `
      <div class="cp-item">
        <div class="cp-item-img-wrap">
          <img src="${p.imagem_url || 'https://via.placeholder.com/90?text=🍔'}" class="cp-item-img" alt="${this.esc(p.nome)}">
        </div>
        <div class="cp-item-info">
          <div class="cp-item-name">${this.esc(p.nome)}</div>
          <div class="cp-item-desc">${this.esc(p.descricao || '')}</div>
          <div class="cp-item-footer">
            <div class="cp-item-price">R$ ${p.preco.toFixed(2).replace('.', ',')}</div>
            <button class="cp-item-add" onclick="cardapio.adicionar(${p.id})">+</button>
          </div>
        </div>
      </div>
    `).join('');
  },

  adicionar(id) {
    const prod = this.produtos.find(p => p.id === id);
    if (!prod) return;
    const existente = this.carrinho.find(c => c.id === id);
    if (existente) {
      existente.qtd++;
      existente.subtotal = existente.qtd * existente.preco;
    } else {
      this.carrinho.push({ id: prod.id, nome: prod.nome, preco: prod.preco, qtd: 1, subtotal: prod.preco });
    }
    this.atualizarFab();
    this.toast(`+ ${prod.nome}`);
  },

  remover(index) {
    this.carrinho.splice(index, 1);
    this.renderCarrinho();
    this.atualizarFab();
  },

  alterarQtd(index, delta) {
    const item = this.carrinho[index];
    item.qtd += delta;
    if (item.qtd <= 0) { this.remover(index); return; }
    item.subtotal = item.qtd * item.preco;
    this.renderCarrinho();
    this.atualizarFab();
  },

  atualizarFab() {
    const count = this.carrinho.reduce((s, i) => s + i.qtd, 0);
    const el = document.getElementById('fabCount');
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  },

  abrirCarrinho() {
    this.renderCarrinho();
    document.getElementById('modalCarrinho').classList.add('show');
    document.body.style.overflow = 'hidden';
  },

  fecharCarrinho(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modalCarrinho').classList.remove('show');
    document.body.style.overflow = '';
  },

  renderCarrinho() {
    const body = document.getElementById('carrinhoBody');
    const total = this.carrinho.reduce((s, i) => s + i.subtotal, 0);
    if (this.carrinho.length === 0) {
      body.innerHTML = '<div class="cp-empty-cart">Nenhum item no carrinho</div>';
    } else {
      body.innerHTML = this.carrinho.map((item, idx) => `
        <div class="cp-cart-item">
          <div class="cp-cart-qty">
            <button onclick="cardapio.alterarQtd(${idx}, -1)">−</button>
            <span>${item.qtd}</span>
            <button onclick="cardapio.alterarQtd(${idx}, 1)">+</button>
          </div>
          <div class="cp-cart-name">${this.esc(item.nome)}</div>
          <div class="cp-cart-price">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</div>
          <button class="cp-cart-remove" onclick="cardapio.remover(${idx})">🗑️</button>
        </div>
      `).join('');
    }
    document.getElementById('carrinhoTotal').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
  },

  irParaCheckout() {
    if (this.carrinho.length === 0) {
      this.toast('Adicione itens ao carrinho primeiro.', 'error');
      return;
    }
    this.fecharCarrinho();
    this.renderResumoCheckout();
    document.getElementById('modalCheckout').classList.add('show');
    document.body.style.overflow = 'hidden';
  },

  fecharCheckout(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modalCheckout').classList.remove('show');
    document.body.style.overflow = '';
  },

  renderResumoCheckout() {
    const total = this.carrinho.reduce((s, i) => s + i.subtotal, 0);
    document.getElementById('chkResumo').innerHTML = `
      <div style="margin-bottom:6px"><strong>Itens:</strong></div>
      ${this.carrinho.map(i => `<div>• ${i.qtd}x ${this.esc(i.nome)} — R$ ${i.subtotal.toFixed(2).replace('.', ',')}</div>`).join('')}
      <div style="margin-top:8px;font-size:1rem;font-weight:700;color:var(--cp-primary)">
        Total: R$ ${total.toFixed(2).replace('.', ',')}
      </div>
    `;
  },

  async enviarPedido() {
    const nome = document.getElementById('chk-nome').value.trim();
    const telefone = document.getElementById('chk-telefone').value.trim();
    const rua = document.getElementById('chk-rua').value.trim();
    const numero = document.getElementById('chk-numero').value.trim();
    const bairro = document.getElementById('chk-bairro').value.trim();
    const pagamento = document.getElementById('chk-pagamento').value;
    const obs = document.getElementById('chk-obs').value.trim();

    if (!nome) { this.toast('Informe seu nome.', 'error'); return; }
    if (!telefone) { this.toast('Informe seu telefone.', 'error'); return; }
    if (!rua) { this.toast('Informe o endereço.', 'error'); return; }
    if (!pagamento) { this.toast('Selecione a forma de pagamento.', 'error'); return; }

    const total = this.carrinho.reduce((s, i) => s + i.subtotal, 0);

    // Recarrega listas do banco para ter dados atualizados e gerar IDs corretos
    try { this.clientes = await dbCarregarClientes(); } catch(e) {}
    try { this.enderecos = await dbCarregarEnderecos(); } catch(e) {}

    // 1. Salva Endereço
    const enderecoId = this.nextId(this.enderecos);
    const endereco = {
      id: enderecoId,
      pais: 'Brasil',
      estado: '',
      cidade: 'Carajás',
      bairro: bairro || '',
      rua: rua,
      numero: numero || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      await dbSalvarEndereco(endereco);
      this.enderecos.push(endereco);
      console.log('Endereço salvo:', endereco);
    } catch(e) {
      console.error('Erro ao salvar endereço:', e);
      this.toast('Erro ao salvar endereço. Tente novamente.', 'error');
      return;
    }

    // 2. Salva Cliente
    const clienteId = this.nextId(this.clientes);
    const cliente = {
      id: clienteId,
      nome: nome,
      telefone: telefone,
      endereco_id: enderecoId,
      data_cadastro: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      await dbSalvarCliente(cliente);
      this.clientes.push(cliente);
      console.log('Cliente salvo:', cliente);
    } catch(e) {
      console.error('Erro ao salvar cliente:', e);
      this.toast('Erro ao salvar cliente. Tente novamente.', 'error');
      return;
    }

    // 3. Salva Pedido
    let pedidosExistentes = [];
    try { pedidosExistentes = await dbCarregarPedidos(); } catch(e) {}
    const pedidoId = this.nextId(pedidosExistentes);
    const numeroPedido = '#W' + String(pedidoId).padStart(3, '0');

    const pedido = {
      id: pedidoId,
      numero_pedido: numeroPedido,
      cliente_id: clienteId,
      endereco_id: enderecoId,
      tipo: 'delivery',
      status: 'pendente',
      total: total,
      forma_pagamento: pagamento,
      pago: false,
      observacao: obs || null,
      data_pedido: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await dbSalvarPedido(pedido);
      console.log('Pedido salvo:', pedido);
    } catch(e) {
      console.error('Erro ao salvar pedido:', e);
      this.toast('Erro ao salvar pedido. Tente novamente.', 'error');
      return;
    }

    // 4. Salva Itens do Pedido
    for (const item of this.carrinho) {
      const itemPedido = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        pedido_id: pedidoId,
        tipo_item: 'produto',
        produto_id: item.id,
        combo_id: null,
        quantidade: item.qtd,
        preco_unitario: item.preco,
        subtotal: item.subtotal,
        created_at: new Date().toISOString()
      };
      try {
        await dbSalvarItemPedido(itemPedido);
        console.log('Item salvo:', itemPedido);
      } catch(e) {
        console.error('Erro ao salvar item:', e);
      }
    }

    // 5. Envia WhatsApp
    const msg = this.gerarMensagemWhatsApp(nome, telefone, rua, numero, bairro, pagamento, obs, total);
    const url = `https://wa.me/5599999999999?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    this.toast('Pedido enviado com sucesso! ✅');
    this.carrinho = [];
    this.atualizarFab();
    this.fecharCheckout();

    // Limpa formulário
    document.getElementById('chk-nome').value = '';
    document.getElementById('chk-telefone').value = '';
    document.getElementById('chk-rua').value = '';
    document.getElementById('chk-numero').value = '';
    document.getElementById('chk-bairro').value = '';
    document.getElementById('chk-pagamento').value = '';
    document.getElementById('chk-obs').value = '';
  },

  gerarMensagemWhatsApp(nome, telefone, rua, numero, bairro, pagamento, obs, total) {
    const mapPag = { dinheiro: 'Dinheiro', pix: 'PIX', cartao_credito: 'Cartão de Crédito', cartao_debito: 'Cartão de Débito' };
    let txt = `*Novo Pedido — Lanches e Massas*\n\n`;
    txt += `*Cliente:* ${nome}\n`;
    txt += `*Telefone:* ${telefone}\n`;
    txt += `*Endereço:* ${rua}, ${numero} — ${bairro}\n`;
    txt += `*Pagamento:* ${mapPag[pagamento] || pagamento}\n\n`;
    txt += `*Itens:*\n`;
    this.carrinho.forEach(i => {
      txt += `• ${i.qtd}x ${i.nome} — R$ ${i.subtotal.toFixed(2).replace('.', ',')}\n`;
    });
    txt += `\n*Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
    if (obs) txt += `\n\n*Observação:* ${obs}`;
    return txt;
  },

  toggleInfo(e) {
    const modal = document.getElementById('modalInfo');
    if (e && e.target !== e.currentTarget) return;
    modal.classList.toggle('show');
    document.body.style.overflow = modal.classList.contains('show') ? 'hidden' : '';
  },

  toast(msg, type = 'success') {
    const container = document.getElementById('cpToastContainer');
    const toast = document.createElement('div');
    toast.className = `cp-toast ${type}`;
    const icon = type === 'error' ? '❌' : '✅';
    toast.innerHTML = `<span>${icon}</span> ${this.esc(msg)}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  esc(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};


// Função utilitária de máscara de telefone
function formatarTelefone(v) {
  const r = v.replace(/\D/g, "").slice(0, 11);
  if (r.length === 0) return "";
  if (r.length <= 2) return "(" + r;
  if (r.length <= 6) return "(" + r.slice(0, 2) + ") " + r.slice(2);
  if (r.length <= 10) return "(" + r.slice(0, 2) + ") " + r.slice(2, 6) + "-" + r.slice(6);
  return "(" + r.slice(0, 2) + ") " + r.slice(2, 7) + "-" + r.slice(7);
}

document.addEventListener('DOMContentLoaded', () => cardapio.init());


// Expõe toast globalmente para db.js
window.toast = cardapio.toast.bind(cardapio);
