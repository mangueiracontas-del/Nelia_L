// ============================================================
// PDV PEDIDOS — Camada de Dados
// Supabase (online) + IndexedDB (offline fallback)
// ============================================================

const IDB_NAME = 'pdv_cache', IDB_VERSION = 1;
let idb;

function openIDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      const stores = ['produtos','combos','combo_produtos','clientes','enderecos',
                      'pedidos','itens_pedido','usuarios','queue','config'];
      stores.forEach(s => {
        if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' });
      });
    };
    req.onsuccess  = e => { idb = e.target.result; res(idb); };
    req.onerror    = () => rej(req.error);
  });
}
const idbAll    = s => new Promise((r,j)=>{ const tx=idb.transaction(s,'readonly'); const q=tx.objectStore(s).getAll(); q.onsuccess=()=>r(q.result); q.onerror=()=>j(q.error); });
const idbPut    = (s,o) => new Promise((r,j)=>{ const tx=idb.transaction(s,'readwrite'); const q=tx.objectStore(s).put(o); q.onsuccess=()=>r(q.result); q.onerror=()=>j(q.error); });
const idbDelete = (s,k) => new Promise((r,j)=>{ const tx=idb.transaction(s,'readwrite'); const q=tx.objectStore(s).delete(k); q.onsuccess=()=>r(); q.onerror=()=>j(q.error); });
const idbGet    = (s,k) => new Promise((r,j)=>{ const tx=idb.transaction(s,'readonly'); const q=tx.objectStore(s).get(k); q.onsuccess=()=>r(q.result); q.onerror=()=>j(q.error); });

// ---- Supabase helpers ----
function sbHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': window.SUPABASE_ANON,
    'Authorization': 'Bearer ' + window.SUPABASE_ANON,
    'Prefer': 'return=representation'
  };
}

async function sbSelect(table, params = '') {
  const r = await fetch(`${window.SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: sbHeaders() });
  if (!r.ok) { const err = await r.text(); throw new Error(`Supabase SELECT erro ${r.status}: ${err}`); }
  return r.json();
}

async function sbUpsert(table, row) {
  const r = await fetch(`${window.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders(), 'Prefer': 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(row)
  });
  if (!r.ok) { const err = await r.text(); console.error('UPSERT erro:', r.status, err); throw new Error(`Supabase UPSERT erro ${r.status}: ${err}`); }
  return r.json();
}

async function sbDelete(table, id) {
  const r = await fetch(`${window.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: sbHeaders()
  });
  if (!r.ok) { const err = await r.text(); throw new Error(`Supabase DELETE erro ${r.status}: ${err}`); }
}

// ============================================================
// MAPEAMENTOS
// ============================================================

// --- Produtos ---
function produtoToDb(p) {
  return {
    id: p.id, nome: p.nome, descricao: p.desc || p.descricao || null,
    preco: p.preco, imagem_url: p.imagem_url || p.image || null,
    visivel: p.visivel !== undefined ? p.visivel : true,
    sku: p.sku || null, codigo_busca: p.codigo_busca || null,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString()
  };
}
function produtoFromDb(r) {
  return {
    id: r.id, nome: r.nome, desc: r.descricao || '', descricao: r.descricao || '',
    preco: parseFloat(r.preco), price: parseFloat(r.preco),
    imagem_url: r.imagem_url || '', image: r.imagem_url || '',
    visivel: r.visivel, visible: r.visivel,
    sku: r.sku || '', codigo_busca: r.codigo_busca || '',
    created_at: r.created_at, updated_at: r.updated_at
  };
}

// --- Combos ---
function comboToDb(c) {
  return {
    id: c.id, nome: c.nome, descricao: c.desc || c.descricao || null,
    preco: c.preco, imagem_url: c.imagem_url || c.image || null,
    visivel: c.visivel !== undefined ? c.visivel : true,
    created_at: c.created_at || new Date().toISOString(),
    updated_at: c.updated_at || new Date().toISOString()
  };
}
function comboFromDb(r) {
  return {
    id: r.id, nome: r.nome, desc: r.descricao || '', descricao: r.descricao || '',
    preco: parseFloat(r.preco), price: parseFloat(r.preco),
    imagem_url: r.imagem_url || '', image: r.imagem_url || '',
    visivel: r.visivel, visible: r.visivel,
    created_at: r.created_at, updated_at: r.updated_at
  };
}

// --- Clientes ---
function clienteToDb(c) {
  return {
    id: c.id, nome: c.nome, telefone: c.telefone,
    endereco_id: c.endereco_id || null,
    data_cadastro: c.data_cadastro || new Date().toISOString().slice(0,10),
    created_at: c.created_at || new Date().toISOString(),
    updated_at: c.updated_at || new Date().toISOString()
  };
}
function clienteFromDb(r) {
  return {
    id: r.id, nome: r.nome, telefone: r.telefone,
    endereco_id: r.endereco_id,
    data_cadastro: r.data_cadastro,
    created_at: r.created_at, updated_at: r.updated_at
  };
}

// --- Enderecos ---
function enderecoToDb(e) {
  return {
    id: e.id, pais: e.pais, estado: e.estado, cidade: e.cidade,
    bairro: e.bairro, rua: e.rua, numero: e.numero,
    created_at: e.created_at || new Date().toISOString(),
    updated_at: e.updated_at || new Date().toISOString()
  };
}
function enderecoFromDb(r) {
  return {
    id: r.id, pais: r.pais, estado: r.estado, cidade: r.cidade,
    bairro: r.bairro, rua: r.rua, numero: r.numero,
    created_at: r.created_at, updated_at: r.updated_at
  };
}

// --- Usuarios ---
function usuarioToDb(u) {
  return {
    id: u.id, nome: u.nome, tipo: u.tipo, role: u.role,
    senha: u.senha, data_criacao: u.dataCriacao || new Date().toISOString()
  };
}
function usuarioFromDb(r) {
  return {
    id: r.id, nome: r.nome, tipo: r.tipo, role: r.role,
    senha: r.senha, dataCriacao: r.data_criacao
  };
}

// --- Pedidos ---
function pedidoToDb(p) {
  return {
    id: p.id,
    numero_pedido: p.numero_pedido,
    cliente_id: p.cliente_id || null,
    endereco_id: p.endereco_id || null,
    tipo: p.tipo || 'delivery',
    status: p.status || 'pendente',
    total: p.total || 0,
    forma_pagamento: p.forma_pagamento || null,
    pago: p.pago !== undefined ? p.pago : false,
    observacao: p.observacao || null,
    operador_id: p.operador_id || null,
    entregador: p.entregador || null,
    data_pedido: p.data_pedido || new Date().toISOString(),
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString()
  };
}
function pedidoFromDb(r) {
  return {
    id: r.id,
    numero_pedido: r.numero_pedido,
    cliente_id: r.cliente_id,
    endereco_id: r.endereco_id,
    tipo: r.tipo,
    status: r.status,
    total: parseFloat(r.total),
    forma_pagamento: r.forma_pagamento,
    pago: r.pago,
    observacao: r.observacao,
    operador_id: r.operador_id,
    entregador: r.entregador,
    data_pedido: r.data_pedido,
    created_at: r.created_at,
    updated_at: r.updated_at
  };
}

// --- Itens Pedido ---
function itemPedidoToDb(i) {
  return {
    id: i.id,
    pedido_id: i.pedido_id,
    tipo_item: i.tipo_item,
    produto_id: i.produto_id || null,
    combo_id: i.combo_id || null,
    quantidade: i.quantidade || 1,
    preco_unitario: i.preco_unitario || 0,
    subtotal: i.subtotal || 0,
    observacao: i.observacao || null,
    created_at: i.created_at || new Date().toISOString()
  };
}
function itemPedidoFromDb(r) {
  return {
    id: r.id,
    pedido_id: r.pedido_id,
    tipo_item: r.tipo_item,
    produto_id: r.produto_id,
    combo_id: r.combo_id,
    quantidade: r.quantidade,
    preco_unitario: parseFloat(r.preco_unitario),
    subtotal: parseFloat(r.subtotal),
    observacao: r.observacao,
    created_at: r.created_at
  };
}

// ============================================================
// PRODUTOS
// ============================================================
async function dbCarregarProdutos() {
  if (!navigator.onLine) { const c = await idbAll('produtos'); return c.map(produtoFromDb); }
  try {
    const rows = await sbSelect('produtos', 'order=nome.asc');
    for (const r of rows) await idbPut('produtos', r);
    return rows.map(produtoFromDb);
  } catch (err) { console.warn('Supabase offline, usando cache produtos:', err); return (await idbAll('produtos')).map(produtoFromDb); }
}
async function dbSalvarProduto(p) {
  const row = produtoToDb(p); await idbPut('produtos', row);
  if (navigator.onLine) { await sbUpsert('produtos', row); } else { await idbPut('queue', { action: 'upsert', table: 'produtos', row, ts: Date.now() }); atualizarBadgeOffline(); }
}
async function dbExcluirProduto(id) {
  await idbDelete('produtos', id);
  if (navigator.onLine) { await sbDelete('produtos', id); } else { await idbPut('queue', { action: 'delete', table: 'produtos', id, ts: Date.now() }); atualizarBadgeOffline(); }
}

// ============================================================
// COMBOS
// ============================================================
async function dbCarregarCombos() {
  if (!navigator.onLine) { const c = await idbAll('combos'); return c.map(comboFromDb); }
  try {
    const rows = await sbSelect('combos', 'order=nome.asc');
    for (const r of rows) await idbPut('combos', r);
    return rows.map(comboFromDb);
  } catch (err) { console.warn('Supabase offline, usando cache combos:', err); return (await idbAll('combos')).map(comboFromDb); }
}
async function dbSalvarCombo(c) {
  const row = comboToDb(c); await idbPut('combos', row);
  if (navigator.onLine) { await sbUpsert('combos', row); } else { await idbPut('queue', { action: 'upsert', table: 'combos', row, ts: Date.now() }); atualizarBadgeOffline(); }
}
async function dbExcluirCombo(id) {
  await idbDelete('combos', id);
  if (navigator.onLine) { await sbDelete('combos', id); } else { await idbPut('queue', { action: 'delete', table: 'combos', id, ts: Date.now() }); atualizarBadgeOffline(); }
}

// ============================================================
// COMBO_PRODUTOS (relacionamento)
// ============================================================
async function dbCarregarComboProdutos() {
  if (!navigator.onLine) return await idbAll('combo_produtos');
  try {
    const rows = await sbSelect('combo_produtos', 'order=combo_id.asc');
    for (const r of rows) await idbPut('combo_produtos', r);
    return rows;
  } catch (err) { return await idbAll('combo_produtos'); }
}
async function dbSalvarComboProduto(cp) {
  await idbPut('combo_produtos', cp);
  if (navigator.onLine) { await sbUpsert('combo_produtos', cp); } else { await idbPut('queue', { action: 'upsert', table: 'combo_produtos', row: cp, ts: Date.now() }); atualizarBadgeOffline(); }
}

// ============================================================
// CLIENTES
// ============================================================
async function dbCarregarClientes() {
  if (!navigator.onLine) { const c = await idbAll('clientes'); return c.map(clienteFromDb); }
  try {
    const rows = await sbSelect('clientes', 'order=nome.asc');
    for (const r of rows) await idbPut('clientes', r);
    return rows.map(clienteFromDb);
  } catch (err) { return (await idbAll('clientes')).map(clienteFromDb); }
}
async function dbSalvarCliente(c) {
  const row = clienteToDb(c); await idbPut('clientes', row);
  if (navigator.onLine) { await sbUpsert('clientes', row); } else { await idbPut('queue', { action: 'upsert', table: 'clientes', row, ts: Date.now() }); atualizarBadgeOffline(); }
}
async function dbExcluirCliente(id) {
  await idbDelete('clientes', id);
  if (navigator.onLine) { await sbDelete('clientes', id); } else { await idbPut('queue', { action: 'delete', table: 'clientes', id, ts: Date.now() }); atualizarBadgeOffline(); }
}

// ============================================================
// ENDERECOS
// ============================================================
async function dbCarregarEnderecos() {
  if (!navigator.onLine) { const e = await idbAll('enderecos'); return e.map(enderecoFromDb); }
  try {
    const rows = await sbSelect('enderecos', 'order=cidade.asc');
    for (const r of rows) await idbPut('enderecos', r);
    return rows.map(enderecoFromDb);
  } catch (err) { return (await idbAll('enderecos')).map(enderecoFromDb); }
}
async function dbSalvarEndereco(e) {
  const row = enderecoToDb(e); await idbPut('enderecos', row);
  if (navigator.onLine) { await sbUpsert('enderecos', row); } else { await idbPut('queue', { action: 'upsert', table: 'enderecos', row, ts: Date.now() }); atualizarBadgeOffline(); }
}
async function dbExcluirEndereco(id) {
  await idbDelete('enderecos', id);
  if (navigator.onLine) { await sbDelete('enderecos', id); } else { await idbPut('queue', { action: 'delete', table: 'enderecos', id, ts: Date.now() }); atualizarBadgeOffline(); }
}

// ============================================================
// USUARIOS
// ============================================================
async function dbCarregarUsuarios() {
  if (!navigator.onLine) { const u = await idbAll('usuarios'); return u.map(usuarioFromDb); }
  try {
    const rows = await sbSelect('usuarios', 'order=nome.asc');
    for (const r of rows) await idbPut('usuarios', r);
    return rows.map(usuarioFromDb);
  } catch (err) { return (await idbAll('usuarios')).map(usuarioFromDb); }
}
async function dbSalvarUsuario(u) {
  const row = usuarioToDb(u); await idbPut('usuarios', row);
  if (navigator.onLine) { await sbUpsert('usuarios', row); } else { await idbPut('queue', { action: 'upsert', table: 'usuarios', row, ts: Date.now() }); atualizarBadgeOffline(); }
}
async function dbExcluirUsuario(id) {
  await idbDelete('usuarios', id);
  if (navigator.onLine) { await sbDelete('usuarios', id); } else { await idbPut('queue', { action: 'delete', table: 'usuarios', id, ts: Date.now() }); atualizarBadgeOffline(); }
}
async function dbBuscarUsuarioPorNome(nome) {
  const usuarios = await dbCarregarUsuarios();
  return usuarios.find(u => u.nome.toLowerCase() === nome.toLowerCase()) || null;
}

// ============================================================
// PEDIDOS
// ============================================================
async function dbCarregarPedidos(statusFilter = null) {
  if (!navigator.onLine) {
    let cached = await idbAll('pedidos');
    if (statusFilter) cached = cached.filter(p => p.status === statusFilter);
    return cached.map(pedidoFromDb).sort((a,b) => new Date(b.data_pedido) - new Date(a.data_pedido));
  }
  try {
    let params = 'order=data_pedido.desc';
    if (statusFilter) params += '&status=eq.' + encodeURIComponent(statusFilter);
    const rows = await sbSelect('pedidos', params);
    for (const r of rows) await idbPut('pedidos', r);
    return rows.map(pedidoFromDb);
  } catch (err) {
    console.warn('Supabase offline, usando cache pedidos:', err);
    let cached = await idbAll('pedidos');
    if (statusFilter) cached = cached.filter(p => p.status === statusFilter);
    return cached.map(pedidoFromDb).sort((a,b) => new Date(b.data_pedido) - new Date(a.data_pedido));
  }
}

async function dbSalvarPedido(pedido) {
  const row = pedidoToDb(pedido);
  await idbPut('pedidos', row);
  if (navigator.onLine) {
    const result = await sbUpsert('pedidos', row);
    return result[0];
  } else {
    await idbPut('queue', { action: 'upsert', table: 'pedidos', row, ts: Date.now() });
    atualizarBadgeOffline();
    return row;
  }
}

async function dbExcluirPedido(id) {
  await idbDelete('pedidos', id);
  // Tambem remove itens do pedido do cache
  const itens = await idbAll('itens_pedido');
  for (const i of itens) { if (i.pedido_id === id) await idbDelete('itens_pedido', i.id); }
  if (navigator.onLine) {
    await sbDelete('pedidos', id);
  } else {
    await idbPut('queue', { action: 'delete', table: 'pedidos', id, ts: Date.now() });
    atualizarBadgeOffline();
  }
}

async function dbAtualizarStatusPedido(id, status) {
  const pedido = await idbGet('pedidos', id);
  if (pedido) {
    pedido.status = status;
    pedido.updated_at = new Date().toISOString();
    await idbPut('pedidos', pedido);
  }
  if (navigator.onLine) {
    await fetch(`${window.SUPABASE_URL}/rest/v1/pedidos?id=eq.${id}`, {
      method: 'PATCH',
      headers: sbHeaders(),
      body: JSON.stringify({ status, updated_at: new Date().toISOString() })
    });
  } else {
    await idbPut('queue', { action: 'patch', table: 'pedidos', id, data: { status, updated_at: new Date().toISOString() }, ts: Date.now() });
    atualizarBadgeOffline();
  }
}

async function dbAtualizarPagamentoPedido(id, pago, formaPagamento) {
  const pedido = await idbGet('pedidos', id);
  if (pedido) {
    pedido.pago = pago;
    if (formaPagamento) pedido.forma_pagamento = formaPagamento;
    pedido.updated_at = new Date().toISOString();
    await idbPut('pedidos', pedido);
  }
  if (navigator.onLine) {
    const body = { pago, updated_at: new Date().toISOString() };
    if (formaPagamento) body.forma_pagamento = formaPagamento;
    await fetch(`${window.SUPABASE_URL}/rest/v1/pedidos?id=eq.${id}`, {
      method: 'PATCH', headers: sbHeaders(), body: JSON.stringify(body)
    });
  } else {
    await idbPut('queue', { action: 'patch', table: 'pedidos', id, data: { pago, forma_pagamento: formaPagamento, updated_at: new Date().toISOString() }, ts: Date.now() });
    atualizarBadgeOffline();
  }
}

// ============================================================
// ITENS DO PEDIDO
// ============================================================
async function dbCarregarItensPedido(pedidoId) {
  if (!navigator.onLine) {
    const all = await idbAll('itens_pedido');
    return all.filter(i => i.pedido_id === pedidoId).map(itemPedidoFromDb);
  }
  try {
    const rows = await sbSelect('itens_pedido', 'pedido_id=eq.' + pedidoId);
    for (const r of rows) await idbPut('itens_pedido', r);
    return rows.map(itemPedidoFromDb);
  } catch (err) {
    const all = await idbAll('itens_pedido');
    return all.filter(i => i.pedido_id === pedidoId).map(itemPedidoFromDb);
  }
}

async function dbSalvarItemPedido(item) {
  const row = itemPedidoToDb(item);
  await idbPut('itens_pedido', row);
  if (navigator.onLine) {
    return await sbUpsert('itens_pedido', row);
  } else {
    await idbPut('queue', { action: 'upsert', table: 'itens_pedido', row, ts: Date.now() });
    atualizarBadgeOffline();
    return [row];
  }
}

async function dbExcluirItemPedido(id) {
  await idbDelete('itens_pedido', id);
  if (navigator.onLine) { await sbDelete('itens_pedido', id); }
  else { await idbPut('queue', { action: 'delete', table: 'itens_pedido', id, ts: Date.now() }); atualizarBadgeOffline(); }
}

// ============================================================
// CONFIG / FILA OFFLINE
// ============================================================
async function dbGetConfig(key) {
  const r = await idbGet('config', key);
  return r ? r.value : null;
}
async function dbSetConfig(key, value) {
  await idbPut('config', { key, value });
}

async function sincronizarFila() {
  if (!navigator.onLine) return;
  const fila = await idbAll('queue');
  if (!fila.length) return;
  for (const item of fila) {
    try {
      if (item.action === 'upsert') await sbUpsert(item.table, item.row);
      if (item.action === 'delete') await sbDelete(item.table, item.id);
      if (item.action === 'patch') {
        await fetch(`${window.SUPABASE_URL}/rest/v1/${item.table}?id=eq.${item.id}`, {
          method: 'PATCH', headers: sbHeaders(), body: JSON.stringify(item.data)
        });
      }
      await idbDelete('queue', item.qid || item.id);
    } catch (err) {
      console.warn('Erro ao sincronizar item:', err);
    }
  }
  atualizarBadgeOffline();
  toast(`Fila sincronizada com Supabase!`, 'success');
}

async function atualizarBadgeOffline() {
  const fila = await idbAll('queue');
  const badge = document.getElementById('offline-badge');
  const cnt   = document.getElementById('pending-count');
  if (badge) {
    if (fila.length > 0) { badge.classList.add('show'); if(cnt) cnt.textContent = fila.length; }
    else badge.classList.remove('show');
  }
}

window.addEventListener('online',  () => { toast('Conexao restaurada. Sincronizando...', 'info'); sincronizarFila(); });
window.addEventListener('offline', () => { toast('Sem conexao. Dados salvos localmente.', 'info'); atualizarBadgeOffline(); });
