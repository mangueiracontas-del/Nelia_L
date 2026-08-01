/* ============================================================
   PDV Pedidos — Lógica Principal (app.js)
   ============================================================ */

const app = {
  pedidos: [],
  produtos: [],
  combos: [],
  clientes: [],
  enderecos: [],
  currentFilter: 'tudo',
  searchQuery: '',
  cart: [],
  editingId: null,

  async init() {
    await openIDB();
    await this.carregarDados();
    if (this.pedidos.length === 0) this.seedData();
    this.render();
  },

  async carregarDados() {
    try {
      this.produtos = await dbCarregarProdutos();
      this.combos = await dbCarregarCombos();
      this.clientes = await dbCarregarClientes();
      this.enderecos = await dbCarregarEnderecos();
      this.pedidos = await dbCarregarPedidos();
    } catch (e) {
      console.warn('Erro ao carregar do Supabase, usando seed:', e);
      this.seedData();
    }
  },

  seedData() {
    this.produtos = [
      { id: 1, nome: 'Batatinha frita', preco: 20.00, visivel: true },
      { id: 2, nome: 'Batata especial', preco: 40.00, visivel: false },
      { id: 3, nome: 'Hot-dog Gourmet', preco: 15.00, visivel: false },
      { id: 4, nome: 'Hot dog Tradicional', preco: 15.00, visivel: true },
      { id: 5, nome: 'Hot dog Strogonoff', preco: 15.00, visivel: false },
      { id: 6, nome: 'Artesanal', preco: 20.00, visivel: false },
      { id: 7, nome: 'Hambúrguer Duplo', preco: 33.00, visivel: true },
      { id: 8, nome: 'X-tudo', preco: 23.00, visivel: true },
      { id: 9, nome: 'Refrigerante Lata', preco: 6.00, visivel: true },
      { id: 10, nome: 'Suco Natural', preco: 10.00, visivel: true },
    ];
    this.combos = [
      { id: 1, nome: 'Combo Família', preco: 65.00, visivel: true, productIds: [7,1,9] },
      { id: 2, nome: 'Combo Individual', preco: 35.00, visivel: true, productIds: [6,1,9] },
    ];
    this.clientes = [
      { id: 1, nome: 'Luana', telefone: '(55) 94984-131252' },
      { id: 2, nome: 'Alessandra', telefone: '(55) 94988-025774' },
      { id: 3, nome: 'Ana Claudia', telefone: '(55) 27992-746007' },
      { id: 4, nome: 'Sandra Pyetro', telefone: '(55) 94917-85734' },
    ];
    this.enderecos = [
      { id: 1, rua: 'Rua Jari', numero: '62', bairro: 'Núcleo', cidade: 'Carajás' },
      { id: 2, rua: 'Guama', numero: '#99', bairro: 'Centro', cidade: 'Carajás' },
      { id: 3, rua: 'Rua Araguaia', numero: '54', bairro: 'Núcleo Urbano de Carajás', cidade: 'Parauapebas' },
    ];
    // Seed de itens de pedido para demonstração
    this.itensPedido = [
      { id: 1, pedido_id: 1, tipo_item: 'combo', combo_id: 1, produto_id: null, quantidade: 1, preco_unitario: 65.00, subtotal: 65.00 },
      { id: 2, pedido_id: 1, tipo_item: 'produto', produto_id: 9, combo_id: null, quantidade: 1, preco_unitario: 6.00, subtotal: 6.00 },
      { id: 3, pedido_id: 2, tipo_item: 'produto', produto_id: 8, combo_id: null, quantidade: 1, preco_unitario: 23.00, subtotal: 23.00 },
      { id: 4, pedido_id: 2, tipo_item: 'produto', produto_id: 1, combo_id: null, quantidade: 1, preco_unitario: 20.00, subtotal: 20.00 },
      { id: 5, pedido_id: 3, tipo_item: 'combo', combo_id: 2, produto_id: null, quantidade: 1, preco_unitario: 35.00, subtotal: 35.00 },
      { id: 6, pedido_id: 4, tipo_item: 'produto', produto_id: 4, combo_id: null, quantidade: 1, preco_unitario: 15.00, subtotal: 15.00 },
      { id: 7, pedido_id: 5, tipo_item: 'produto', produto_id: 7, combo_id: null, quantidade: 1, preco_unitario: 33.00, subtotal: 33.00 },
    ];
    this.pedidos = [
      { id: 1, numero_pedido: '#1', cliente_id: 1, endereco_id: 1, tipo: 'delivery', status: 'em_preparacao', total: 67.00, forma_pagamento: 'cartao_credito', pago: false, observacao: 'Sem cebola no X-tudo', data_pedido: new Date(Date.now() - 13*60000).toISOString() },
      { id: 2, numero_pedido: '#2', cliente_id: 2, endereco_id: 2, tipo: 'delivery', status: 'em_preparacao', total: 42.00, forma_pagamento: 'pix', pago: false, observacao: '', data_pedido: new Date(Date.now() - 36*60000).toISOString() },
      { id: 3, numero_pedido: '#7', cliente_id: 3, endereco_id: 3, tipo: 'delivery', status: 'em_preparacao', total: 32.00, forma_pagamento: 'pix', pago: false, observacao: 'Troco para 50', data_pedido: new Date(Date.now() - 60*60000).toISOString() },
      { id: 4, numero_pedido: '#3', cliente_id: 4, endereco_id: null, tipo: 'mesa', status: 'em_preparacao', total: 14.00, forma_pagamento: 'dinheiro', pago: false, observacao: 'Mesa 5', entregador: 'Nelia Paula', data_pedido: new Date(Date.now() - 60*60000).toISOString() },
      { id: 5, numero_pedido: '#4', cliente_id: 4, endereco_id: null, tipo: 'mesa', status: 'entregue', total: 22.00, forma_pagamento: 'dinheiro', pago: true, observacao: 'Mesa 3', entregador: 'Nelia Paula', data_pedido: new Date(Date.now() - 65*60000).toISOString() },
    ];
  },

  setFilter(f) {
    this.currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('filter-' + f).classList.add('active');
    this.render();
  },

  search(q) {
    this.searchQuery = q.toLowerCase().trim();
    this.render();
  },

  getFiltered() {
    let list = this.pedidos;
    if (this.currentFilter !== 'tudo') {
      list = list.filter(p => p.status === this.currentFilter);
    }
    if (this.searchQuery) {
      list = list.filter(p => {
        const c = this.clientes.find(c => c.id === p.cliente_id);
        const e = this.enderecos.find(e => e.id === p.endereco_id);
        return (p.numero_pedido && p.numero_pedido.toLowerCase().includes(this.searchQuery)) ||
               (c && c.nome.toLowerCase().includes(this.searchQuery)) ||
               (c && c.telefone.toLowerCase().includes(this.searchQuery)) ||
               (e && e.rua.toLowerCase().includes(this.searchQuery));
      });
    }
    return list.sort((a,b) => new Date(b.data_pedido) - new Date(a.data_pedido));
  },

  updateStats() {
    const hoje = new Date().toDateString();
    const pedidosHoje = this.pedidos.filter(p => new Date(p.data_pedido).toDateString() === hoje && p.status !== 'cancelado');
    const totalDia = pedidosHoje.reduce((s,p) => s + p.total, 0);
    const emPrep = this.pedidos.filter(p => p.status === 'em_preparacao').length;
    const entregues = this.pedidos.filter(p => p.status === 'entregue').length;

    document.getElementById('stat-total-dia').textContent = 'R$ ' + totalDia.toFixed(2).replace('.', ',');
    document.getElementById('stat-pedidos-hoje').textContent = pedidosHoje.length;
    document.getElementById('stat-em-preparacao').textContent = emPrep;
    document.getElementById('stat-entregues').textContent = entregues;

    document.getElementById('badge-tudo').textContent = this.pedidos.filter(p => p.status !== 'cancelado').length;
    document.getElementById('badge-pendente').textContent = this.pedidos.filter(p => p.status === 'pendente').length;
    document.getElementById('badge-em_preparacao').textContent = emPrep;
    document.getElementById('badge-pronto').textContent = this.pedidos.filter(p => p.status === 'pronto').length;
    document.getElementById('badge-entregue').textContent = entregues;
  },

  render() {
    this.updateStats();
    const list = this.getFiltered();
    const container = document.getElementById('ordersList');

    if (list.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray-400)"><div style="font-size:2.5rem;margin-bottom:0.5rem">📋</div><div style="font-weight:600;color:var(--gray-600)">Nenhum pedido encontrado</div></div>';
      return;
    }

    container.innerHTML = list.map(p => {
      const cliente = this.clientes.find(c => c.id === p.cliente_id);
      const endereco = this.enderecos.find(e => e.id === p.endereco_id);
      const tempo = this.calcularTempo(p.data_pedido);
      const statusClass = 'status-' + p.status;
      const statusLabel = { pendente: 'Pendente', em_preparacao: 'Em preparação', pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado' }[p.status] || p.status;
      const tipoIcon = p.tipo === 'delivery' ? '🛵' : p.tipo === 'mesa' ? '🪑' : p.tipo === 'balcao' ? '🏪' : '📦';
      const pagLabel = p.pago ? 'Pago' : 'Não pago';
      const pagClass = p.pago ? 'payment-pago' : 'payment-pendente';

      return `
        <div class="order-row">
          <div>
            <div class="order-id">${tipoIcon} ${p.numero_pedido}</div>
            <div class="order-time ${tempo.includes('60') ? 'late' : ''}">⏱ ${tempo}</div>
            <div class="order-time">📅 ${new Date(p.data_pedido).toLocaleDateString('pt-BR')}</div>
          </div>
          <div>
            <span class="order-status ${statusClass}">${statusLabel}</span>
            <div style="margin-top:0.25rem;font-size:0.6875rem;color:var(--gray-400)">${p.tipo.toUpperCase()}</div>
          </div>
          <div>
            <div class="order-total">R$ ${p.total.toFixed(2).replace('.', ',')}</div>
            <span class="order-payment ${pagClass}">${pagLabel}</span>
            ${p.forma_pagamento ? `<div style="font-size:0.6875rem;color:var(--gray-400);margin-top:0.125rem">${this.fmtPagamento(p.forma_pagamento)}</div>` : ''}
          </div>
          <div>
            <div class="order-client">👤 ${cliente ? cliente.nome : 'Cliente não identificado'}</div>
            ${cliente ? `<div class="order-phone">📞 ${cliente.telefone}</div>` : ''}
          </div>
          <div>
            ${endereco
              ? `<div class="order-address">📍 ${endereco.rua}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade}</div>`
              : `<div class="order-address">📍 No local / Retirada</div>`}
            ${p.observacao ? `<div style="font-size:0.6875rem;color:var(--warning);margin-top:0.25rem">📝 ${this.esc(p.observacao)}</div>` : ''}
            ${p.entregador ? `<div style="font-size:0.6875rem;color:var(--gray-500);margin-top:0.125rem">🙋 ${p.entregador}</div>` : ''}
          </div>
          <div class="order-actions">
            <button class="action-btn" onclick="app.imprimir(${p.id})" title="Imprimir">🖨️</button>
            <button class="action-btn" onclick="app.mudarStatus(${p.id})" title="Status">🔄 Status</button>
            <button class="action-btn ${p.pago ? 'success' : ''}" onclick="app.togglePago(${p.id})" title="Pagar">💲 Pagar</button>
            <button class="action-btn primary" onclick="app.finalizar(${p.id})" title="Finalizar">✓ Finalizar</button>
            <button class="action-btn" onclick="app.editarPedido(${p.id})" title="Editar">✏️</button>
          </div>
        </div>`;
    }).join('');
  },

  calcularTempo(dataStr) {
    const diff = Math.floor((Date.now() - new Date(dataStr).getTime()) / 60000);
    if (diff < 1) return 'Agora';
    if (diff < 60) return diff + ' min';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h + 'h ' + (m > 0 ? m + 'min' : '');
  },

  fmtPagamento(fp) {
    const map = { dinheiro: 'Dinheiro', cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito', pix: 'PIX', voucher: 'Voucher' };
    return map[fp] || fp;
  },

  esc(text) {
    const div = document.createElement('div'); div.textContent = text; return div.innerHTML;
  },

  // ============================================================
  // NOVO PEDIDO / EDITAR PEDIDO
  // ============================================================

  openNovoPedido() {
    this.editingId = null;
    this.cart = [];
    document.getElementById('modalTitle').textContent = 'Novo Pedido';
    document.getElementById('modalBody').innerHTML = this.buildPedidoForm();
    document.getElementById('modalOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
    this.renderItemSelector('produtos');
    this.toggleNovoCliente(false);
  },

  async editarPedido(id) {
    const pedido = this.pedidos.find(p => p.id === id);
    if (!pedido) return;
    this.editingId = id;

    // Carrega os itens do pedido no carrinho
    let itens = [];
    try {
      itens = await dbCarregarItensPedido(id);
    } catch(e) {
      // Fallback para dados locais
      itens = (this.itensPedido || []).filter(i => i.pedido_id === id).map(itemPedidoFromDb);
    }

    // Converte itens do pedido para formato do carrinho
    this.cart = itens.map(item => {
      const nome = item.tipo_item === 'produto'
        ? (this.produtos.find(p => p.id === item.produto_id)?.nome || 'Produto')
        : (this.combos.find(c => c.id === item.combo_id)?.nome || 'Combo');
      return {
        id: item.tipo_item === 'produto' ? item.produto_id : item.combo_id,
        tipo_item: item.tipo_item,
        nome: nome,
        preco_unitario: item.preco_unitario,
        quantidade: item.quantidade,
        subtotal: item.subtotal,
        item_id_original: item.id  // guarda o ID original para sincronização
      };
    });

    document.getElementById('modalTitle').textContent = 'Editar Pedido ' + pedido.numero_pedido;
    document.getElementById('modalBody').innerHTML = this.buildPedidoForm(pedido);
    document.getElementById('modalOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
    this.renderItemSelector('produtos');
    this.renderCart();
    this.toggleNovoCliente(false);
  },

  buildPedidoForm(pedido = null) {
    const clientesOpts = this.clientes.map(c => `<option value="${c.id}" ${pedido && pedido.cliente_id === c.id ? 'selected' : ''}>${c.nome} — ${c.telefone}</option>`).join('');
    const enderecosOpts = this.enderecos.map(e => `<option value="${e.id}" ${pedido && pedido.endereco_id === e.id ? 'selected' : ''}>${e.rua}, ${e.numero} — ${e.bairro}</option>`).join('');

    return `
      <!-- CLIENTE EXISTENTE -->
      <div id="cliente-existente-section">
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label class="form-label">Cliente <span class="req">*</span></label>
            <select class="form-select" id="ped-cliente" onchange="app.onClienteChange()">
              <option value="">Selecione um cliente...</option>
              ${clientesOpts}
            </select>
          </div>
          <div class="form-group" style="display:flex;align-items:flex-end">
            <button type="button" class="btn btn-secondary" style="width:100%" onclick="app.toggleNovoCliente(true)">
              ➕ Novo Cliente
            </button>
          </div>
        </div>
      </div>

      <!-- CADASTRO RÁPIDO DE CLIENTE -->
      <div id="cliente-novo-section" style="display:none">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
          <span style="font-size:0.875rem;font-weight:700;color:var(--gray-800)">📝 Cadastrar novo cliente</span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="app.toggleNovoCliente(false)">← Voltar</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nome <span class="req">*</span></label>
            <input type="text" class="form-input" id="novo-cliente-nome" placeholder="Nome completo">
          </div>
          <div class="form-group">
            <label class="form-label">Telefone <span class="req">*</span></label>
            <input type="text" class="form-input" id="novo-cliente-telefone" placeholder="(99)99999-9999" maxlength="15">
          </div>
        </div>
        <div style="font-size:0.75rem;font-weight:600;color:var(--gray-700);margin:0.5rem 0 0.375rem">📍 Endereço</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Rua</label>
            <input type="text" class="form-input" id="novo-endereco-rua" placeholder="Rua / Avenida">
          </div>
          <div class="form-group" style="max-width:100px">
            <label class="form-label">Nº</label>
            <input type="text" class="form-input" id="novo-endereco-numero" placeholder="123">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Bairro</label>
            <input type="text" class="form-input" id="novo-endereco-bairro" placeholder="Bairro">
          </div>
          <div class="form-group">
            <label class="form-label">Cidade</label>
            <input type="text" class="form-input" id="novo-endereco-cidade" placeholder="Cidade">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Estado</label>
            <input type="text" class="form-input" id="novo-endereco-estado" placeholder="Estado">
          </div>
          <div class="form-group">
            <label class="form-label">País</label>
            <input type="text" class="form-input" id="novo-endereco-pais" value="Brasil">
          </div>
        </div>
        <button type="button" class="btn btn-primary" style="width:100%;margin-top:0.5rem" onclick="app.salvarNovoCliente()">
          💾 Salvar Cliente
        </button>
      </div>

      <!-- ENDEREÇO DO PEDIDO -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Endereço de entrega</label>
          <select class="form-select" id="ped-endereco">
            <option value="">No local / Retirada</option>
            ${enderecosOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo <span class="req">*</span></label>
          <select class="form-select" id="ped-tipo">
            <option value="delivery" ${!pedido || pedido.tipo === 'delivery' ? 'selected' : ''}>🛵 Delivery</option>
            <option value="mesa" ${pedido && pedido.tipo === 'mesa' ? 'selected' : ''}>🪑 Mesa</option>
            <option value="balcao" ${pedido && pedido.tipo === 'balcao' ? 'selected' : ''}>🏪 Balcão</option>
            <option value="retirada" ${pedido && pedido.tipo === 'retirada' ? 'selected' : ''}>📦 Retirada</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Forma de Pagamento</label>
          <select class="form-select" id="ped-pagamento">
            <option value="">Selecione...</option>
            <option value="dinheiro" ${pedido && pedido.forma_pagamento === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
            <option value="cartao_credito" ${pedido && pedido.forma_pagamento === 'cartao_credito' ? 'selected' : ''}>Cartão Crédito</option>
            <option value="cartao_debito" ${pedido && pedido.forma_pagamento === 'cartao_debito' ? 'selected' : ''}>Cartão Débito</option>
            <option value="pix" ${pedido && pedido.forma_pagamento === 'pix' ? 'selected' : ''}>PIX</option>
            <option value="voucher" ${pedido && pedido.forma_pagamento === 'voucher' ? 'selected' : ''}>Voucher</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Observação</label>
          <input type="text" class="form-input" id="ped-obs" placeholder="Ex: Sem cebola, troco para..." value="${pedido ? pedido.observacao || '' : ''}">
        </div>
      </div>

      <!-- SELETOR DE ITENS -->
      <div class="item-selector">
        <div class="item-selector-title">🛒 Adicionar itens ao pedido</div>
        <div class="item-tabs">
          <button class="item-tab active" onclick="app.renderItemSelector('produtos')" id="tab-produtos">Produtos</button>
          <button class="item-tab" onclick="app.renderItemSelector('combos')" id="tab-combos">Combos</button>
        </div>
        <div class="item-grid" id="itemGrid"></div>
      </div>

      <!-- CARRINHO -->
      <div class="cart-list" id="cartList"></div>
      <div class="cart-total-bar">
        <div class="cart-total-label">Total do pedido:</div>
        <div class="cart-total-value" id="cartTotal">R$ 0,00</div>
      </div>
    `;
  },

  toggleNovoCliente(mostrar) {
    const secNovo = document.getElementById('cliente-novo-section');
    const secExistente = document.getElementById('cliente-existente-section');
    if (secNovo) secNovo.style.display = mostrar ? 'block' : 'none';
    if (secExistente) secExistente.style.display = mostrar ? 'none' : 'block';
  },

  onClienteChange() {
    const clienteId = parseInt(document.getElementById('ped-cliente').value);
    if (!clienteId) return;
    const cliente = this.clientes.find(c => c.id === clienteId);
    if (cliente && cliente.endereco_id) {
      document.getElementById('ped-endereco').value = cliente.endereco_id;
    }
  },

  async salvarNovoCliente() {
    const nome = document.getElementById('novo-cliente-nome').value.trim();
    const telefone = document.getElementById('novo-cliente-telefone').value.trim();
    const rua = document.getElementById('novo-endereco-rua').value.trim();
    const numero = document.getElementById('novo-endereco-numero').value.trim();
    const bairro = document.getElementById('novo-endereco-bairro').value.trim();
    const cidade = document.getElementById('novo-endereco-cidade').value.trim();
    const estado = document.getElementById('novo-endereco-estado').value.trim();
    const pais = document.getElementById('novo-endereco-pais').value.trim() || 'Brasil';

    // Validação do telefone
    const telefoneRegex = /^\(\d{2}\)\d{4,5}-\d{4}$/;
    if (!nome) { this.toast('Informe o nome do cliente.', 'error'); return; }
    if (!telefone) { this.toast('Informe o telefone do cliente.', 'error'); return; }
    if (!telefoneRegex.test(telefone)) { this.toast('Telefone inválido. Use o formato (99)99999-9999', 'error'); return; }

    // Verifica se já existe cliente com mesmo telefone
    const existente = this.clientes.find(c => c.telefone === telefone);
    if (existente) { this.toast('Já existe um cliente com este telefone.', 'error'); return; }

    // Cria endereço
    let enderecoId = null;
    if (rua) {
      const novoEnderecoId = this.enderecos.length > 0 ? Math.max(...this.enderecos.map(e => e.id)) + 1 : 1;
      const novoEndereco = {
        id: novoEnderecoId, pais, estado, cidade, bairro, rua, numero,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      this.enderecos.push(novoEndereco);
      try { await dbSalvarEndereco(novoEndereco); } catch(e) { console.warn(e); }
      enderecoId = novoEnderecoId;
    }

    // Cria cliente
    const novoClienteId = this.clientes.length > 0 ? Math.max(...this.clientes.map(c => c.id)) + 1 : 1;
    const novoCliente = {
      id: novoClienteId, nome, telefone,
      endereco_id: enderecoId,
      data_cadastro: new Date().toISOString().slice(0,10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.clientes.push(novoCliente);
    try { await dbSalvarCliente(novoCliente); } catch(e) { console.warn(e); }

    // Volta para seleção e preenche o novo cliente
    this.toggleNovoCliente(false);

    // Atualiza o select de clientes
    const selectCliente = document.getElementById('ped-cliente');
    const option = document.createElement('option');
    option.value = novoClienteId;
    option.textContent = `${nome} — ${telefone}`;
    selectCliente.appendChild(option);
    selectCliente.value = novoClienteId;

    // Preenche endereço se houver
    if (enderecoId) {
      const selectEndereco = document.getElementById('ped-endereco');
      const optEnd = document.createElement('option');
      optEnd.value = enderecoId;
      optEnd.textContent = `${rua}, ${numero} — ${bairro}`;
      selectEndereco.appendChild(optEnd);
      selectEndereco.value = enderecoId;
    }

    this.toast(`Cliente "${nome}" cadastrado com sucesso!`);
  },

  renderItemSelector(tipo) {
    document.querySelectorAll('.item-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tipo).classList.add('active');
    const grid = document.getElementById('itemGrid');
    const list = tipo === 'produtos' ? this.produtos.filter(p => p.visivel) : this.combos.filter(c => c.visivel);

    grid.innerHTML = list.map(item => {
      const isProd = tipo === 'produtos';
      return `
        <div class="item-card" onclick="app.addToCart(${item.id}, '${isProd ? 'produto' : 'combo'}')">
          <div class="ic-name">${this.esc(item.nome)}</div>
          <div class="ic-price">R$ ${item.preco.toFixed(2).replace('.', ',')}</div>
        </div>`;
    }).join('');
  },

  addToCart(id, tipo) {
    const item = tipo === 'produto' ? this.produtos.find(p => p.id === id) : this.combos.find(c => c.id === id);
    if (!item) return;
    const existing = this.cart.find(c => c.id === id && c.tipo === tipo);
    if (existing) {
      existing.quantidade++;
      existing.subtotal = existing.quantidade * existing.preco_unitario;
    } else {
      this.cart.push({ id: item.id, tipo_item: tipo, nome: item.nome, preco_unitario: item.preco, quantidade: 1, subtotal: item.preco });
    }
    this.renderCart();
  },

  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.renderCart();
  },

  changeQty(index, delta) {
    const item = this.cart[index];
    item.quantidade += delta;
    if (item.quantidade <= 0) { this.removeFromCart(index); return; }
    item.subtotal = item.quantidade * item.preco_unitario;
    this.renderCart();
  },

  renderCart() {
    const list = document.getElementById('cartList');
    const total = this.cart.reduce((s, i) => s + i.subtotal, 0);

    if (this.cart.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--gray-400);font-size:0.8125rem">Nenhum item adicionado. Clique nos produtos acima.</div>';
    } else {
      list.innerHTML = this.cart.map((item, idx) => `
        <div class="cart-item">
          <span class="cart-item-name">${item.tipo_item === 'combo' ? '🎁' : '🍔'} ${this.esc(item.nome)}</span>
          <span class="cart-item-price">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</span>
          <div class="cart-qty">
            <button onclick="app.changeQty(${idx}, -1)">−</button>
            <span>${item.quantidade}</span>
            <button onclick="app.changeQty(${idx}, 1)">+</button>
          </div>
          <button class="cart-remove" onclick="app.removeFromCart(${idx})">&times;</button>
        </div>
      `).join('');
    }
    document.getElementById('cartTotal').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
  },

  async salvarPedido() {
    const clienteId = parseInt(document.getElementById('ped-cliente').value);
    const enderecoId = document.getElementById('ped-endereco').value;
    const tipo = document.getElementById('ped-tipo').value;
    const pagamento = document.getElementById('ped-pagamento').value;
    const obs = document.getElementById('ped-obs').value.trim();

    if (!clienteId) { this.toast('Selecione um cliente ou cadastre um novo.', 'error'); return; }
    if (this.cart.length === 0) { this.toast('Adicione pelo menos um item ao pedido.', 'error'); return; }

    const total = this.cart.reduce((s, i) => s + i.subtotal, 0);

    if (this.editingId) {
      // EDIÇÃO: atualiza pedido existente
      const p = this.pedidos.find(x => x.id === this.editingId);
      if (p) {
        p.cliente_id = clienteId;
        p.endereco_id = enderecoId ? parseInt(enderecoId) : null;
        p.tipo = tipo;
        p.forma_pagamento = pagamento;
        p.observacao = obs;
        p.total = total;
        p.updated_at = new Date().toISOString();
        try { await dbSalvarPedido(p); } catch(e) { console.warn(e); }

        // Remove itens antigos e salva novos
        const itensAntigos = (this.itensPedido || []).filter(i => i.pedido_id === this.editingId);
        for (const ia of itensAntigos) {
          try { await dbExcluirItemPedido(ia.id); } catch(e) {}
        }
        this.itensPedido = (this.itensPedido || []).filter(i => i.pedido_id !== this.editingId);

        for (const item of this.cart) {
          const novoItem = {
            id: Date.now() + Math.random(),
            pedido_id: this.editingId,
            tipo_item: item.tipo_item,
            produto_id: item.tipo_item === 'produto' ? item.id : null,
            combo_id: item.tipo_item === 'combo' ? item.id : null,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal,
            created_at: new Date().toISOString()
          };
          this.itensPedido.push(novoItem);
          try { await dbSalvarItemPedido(novoItem); } catch(e) { console.warn(e); }
        }
      }
      this.toast('Pedido atualizado com sucesso!');
    } else {
      // NOVO: cria pedido
      const nextId = this.pedidos.length > 0 ? Math.max(...this.pedidos.map(p => p.id)) + 1 : 1;
      const nextNum = '#' + nextId;
      const novo = {
        id: nextId, numero_pedido: nextNum,
        cliente_id: clienteId,
        endereco_id: enderecoId ? parseInt(enderecoId) : null,
        tipo, status: 'pendente', total,
        forma_pagamento: pagamento, pago: false,
        observacao: obs, data_pedido: new Date().toISOString()
      };
      this.pedidos.push(novo);
      try { await dbSalvarPedido(novo); } catch(e) { console.warn(e); }

      for (const item of this.cart) {
        const novoItem = {
          id: Date.now() + Math.random(),
          pedido_id: nextId,
          tipo_item: item.tipo_item,
          produto_id: item.tipo_item === 'produto' ? item.id : null,
          combo_id: item.tipo_item === 'combo' ? item.id : null,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          created_at: new Date().toISOString()
        };
        if (!this.itensPedido) this.itensPedido = [];
        this.itensPedido.push(novoItem);
        try { await dbSalvarItemPedido(novoItem); } catch(e) { console.warn(e); }
      }
      this.toast('Pedido criado com sucesso!');
    }

    this.closeModal();
    this.render();
  },

  closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modalOverlay').classList.remove('show');
    document.body.style.overflow = '';
    this.editingId = null;
    this.cart = [];
  },

  async mudarStatus(id) {
    const p = this.pedidos.find(x => x.id === id);
    if (!p) return;
    const statuses = ['pendente', 'em_preparacao', 'pronto', 'entregue'];
    const idx = statuses.indexOf(p.status);
    p.status = statuses[(idx + 1) % statuses.length];
    try { await dbAtualizarStatusPedido(id, p.status); } catch(e) { console.warn(e); }
    this.render();
    this.toast('Status atualizado: ' + p.status.replace('_', ' '));
  },

  async togglePago(id) {
    const p = this.pedidos.find(x => x.id === id);
    if (!p) return;
    p.pago = !p.pago;
    try { await dbAtualizarPagamentoPedido(id, p.pago, p.forma_pagamento); } catch(e) { console.warn(e); }
    this.render();
    this.toast(p.pago ? 'Pedido marcado como pago' : 'Pagamento cancelado');
  },

  async finalizar(id) {
    const p = this.pedidos.find(x => x.id === id);
    if (!p) return;
    p.status = 'entregue';
    p.pago = true;
    try {
      await dbAtualizarStatusPedido(id, 'entregue');
      await dbAtualizarPagamentoPedido(id, true, p.forma_pagamento);
    } catch(e) { console.warn(e); }
    this.render();
    this.toast('Pedido finalizado!');
  },

  imprimir(id) {
    this.toast('Enviando para impressora...', 'info');
  },

  toast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '✅';
    toast.innerHTML = `<span>${icon}</span> ${this.esc(message)}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  exportData() {
    const data = { pedidos: this.pedidos, produtos: this.produtos, combos: this.combos, clientes: this.clientes, enderecos: this.enderecos, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pdv-pedidos-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    this.toast('Dados exportados!');
  },

  importData(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.pedidos) this.pedidos = data.pedidos;
        if (data.produtos) this.produtos = data.produtos;
        if (data.combos) this.combos = data.combos;
        if (data.clientes) this.clientes = data.clientes;
        if (data.enderecos) this.enderecos = data.enderecos;
        this.render();
        this.toast('Dados importados!');
      } catch (err) { this.toast('Erro ao importar.', 'error'); }
    };
    reader.readAsText(file); input.value = '';
  }
};

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') app.closeModal(); });
document.addEventListener('DOMContentLoaded', () => app.init());
