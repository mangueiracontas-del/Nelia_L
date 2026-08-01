// ============================================================
// PDV PEDIDOS — Autenticacao
// Roles: admin, caixa, garcom, cozinha, entregador
// ============================================================

let currentUser = null;

async function initAuth() {
  const saved = localStorage.getItem('pdv_user');
  if (saved) {
    try { currentUser = JSON.parse(saved); } catch(e) { currentUser = null; }
  }
  updateAuthUI();
}

// ---- Login por nome de usuario e senha ----
async function login(nome, senha) {
  const usuario = await dbBuscarUsuarioPorNome(nome);
  if (!usuario) return false;
  if (usuario.senha !== senha) return false;

  currentUser = {
    id:   usuario.id,
    nome: usuario.nome,
    role: usuario.role,
    tipo: usuario.tipo
  };
  localStorage.setItem('pdv_user', JSON.stringify(currentUser));
  updateAuthUI();
  return true;
}

function fazerLogout() {
  currentUser = null;
  localStorage.removeItem('pdv_user');
  updateAuthUI();
  showPage('login');
  toast('Sessao encerrada.', 'info');
}

function updateAuthUI() {
  // Elementos opcionais — só atualiza se existirem na página
  const lbl = document.getElementById('user-nav-label');
  if (lbl) {
    lbl.textContent = currentUser ? currentUser.nome : 'Entrar';
  }

  const logArea  = document.getElementById('logado-area');
  const formArea = document.getElementById('login-form-area');

  if (logArea) {
    if (currentUser) {
      logArea.style.display  = 'block';
      if (formArea) formArea.style.display = 'none';
      const nm = document.getElementById('logado-nome');
      if (nm) nm.textContent = currentUser.nome + ' (' + currentUser.role + ')';
    } else {
      logArea.style.display  = 'none';
      if (formArea) {
        formArea.style.display = 'block';
        renderLoginForm();
      }
    }
  }

  updateNavVisibility();
}

function updateNavVisibility() {
  const navPedidos   = document.getElementById('nav-pedidos');
  const navProdutos  = document.getElementById('nav-produtos');
  const navClientes  = document.getElementById('nav-clientes');
  const navRelatorio = document.getElementById('nav-relatorio');

  const isAdmin  = currentUser && currentUser.tipo === 'admin';
  const isCaixa  = currentUser && (currentUser.role === 'caixa' || currentUser.role === 'admin');
  const isGarcom = currentUser && (currentUser.role === 'garcom' || currentUser.role === 'admin');

  if (navPedidos)   navPedidos.style.display   = (isCaixa || isGarcom) ? 'flex' : 'none';
  if (navProdutos)  navProdutos.style.display  = isAdmin ? 'flex' : 'none';
  if (navClientes)  navClientes.style.display  = isAdmin ? 'flex' : 'none';
  if (navRelatorio) navRelatorio.style.display = isAdmin ? 'flex' : 'none';
}

function isAdmin() {
  return currentUser && currentUser.tipo === 'admin';
}

function isCaixa() {
  return currentUser && (currentUser.role === 'caixa' || currentUser.tipo === 'admin');
}

function isGarcom() {
  return currentUser && (currentUser.role === 'garcom' || currentUser.tipo === 'admin');
}

function isCozinha() {
  return currentUser && (currentUser.role === 'cozinha' || currentUser.tipo === 'admin');
}

function isEntregador() {
  return currentUser && (currentUser.role === 'entregador' || currentUser.tipo === 'admin');
}

// ---- UI de login ----
function renderLoginForm() {
  const formArea = document.getElementById('login-form-area');
  if (!formArea) return;

  formArea.innerHTML = `
    <div class="form-group">
      <label class="form-label">Nome de Usuario</label>
      <input type="text" class="form-control" id="login-nome" placeholder="Digite seu nome de usuario"
             onkeydown="if(event.key==='Enter')doLogin()">
    </div>
    <div class="form-group">
      <label class="form-label">Senha</label>
      <input type="password" class="form-control" id="login-senha" placeholder="Digite sua senha"
             onkeydown="if(event.key==='Enter')doLogin()">
    </div>
    <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="doLogin()">
      Entrar
    </button>`;
}

async function doLogin() {
  const nome = document.getElementById('login-nome');
  const senha = document.getElementById('login-senha');

  if (!nome || !senha) { 
    toast('Preencha nome de usuario e senha.', 'error'); 
    return; 
  }

  const ok = await login(nome.value.trim(), senha.value);
  if (ok) {
    toast('Bem-vindo, ' + currentUser.nome + '!', 'success');

    const formArea = document.getElementById('login-form-area');
    const logArea = document.getElementById('logado-area');
    const loginArea = document.getElementById('login-area');
    const appArea = document.getElementById('app-area');

    if (formArea) formArea.style.display = 'none';
    if (logArea) {
      logArea.style.display = 'block';
      const nm = document.getElementById('logado-nome');
      if (nm) nm.textContent = currentUser.nome + ' (' + currentUser.role + ')';
    }
    if (loginArea) loginArea.style.display = 'none';
    if (appArea) {
      appArea.style.display = 'block';
      if (typeof app !== 'undefined' && app.init) await app.init();
    }
  } else {
    toast('Nome de usuario ou senha incorretos.', 'error');
    senha.value = '';
  }
}

// ---- Alterar senha do usuario logado ----
function openChangePassword() {
  const senhaContent = document.getElementById('senha-content');
  if (!senhaContent) return;

  senhaContent.innerHTML = `
    <div style="background:var(--bg3);border-radius:var(--radius);padding:8px 14px;margin-bottom:16px;font-size:12px;color:var(--text2)">
      Usuario: <span style="font-family:var(--mono);color:var(--text);font-weight:600">${esc(currentUser.nome)}</span>
    </div>
    <div class="form-group"><label class="form-label">Senha Atual</label>
      <input type="password" class="form-control" id="cp-atual"></div>
    <div class="form-group"><label class="form-label">Nova Senha</label>
      <input type="password" class="form-control" id="cp-nova" placeholder="Minimo 6 caracteres"></div>
    <div class="form-group"><label class="form-label">Confirmar Nova Senha</label>
      <input type="password" class="form-control" id="cp-conf"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-secondary" onclick="closeModal('modal-senha')">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarSenha()">Alterar</button>
    </div>`;
  openModal('modal-senha');
}

async function salvarSenha() {
  const atual = document.getElementById('cp-atual');
  const nova  = document.getElementById('cp-nova');
  const conf  = document.getElementById('cp-conf');

  if (!atual || !nova || !conf) { 
    toast('Preencha todos os campos', 'error'); 
    return; 
  }
  if (!atual.value || !nova.value || !conf.value) { 
    toast('Preencha todos os campos', 'error'); 
    return; 
  }
  if (nova.value.length < 6) { 
    toast('Minimo 6 caracteres', 'error'); 
    return; 
  }
  if (nova.value !== conf.value) { 
    toast('As senhas nao conferem', 'error'); 
    return; 
  }

  const usuarios = await dbCarregarUsuarios();
  const usuario = usuarios.find(u => u.id === currentUser.id);

  if (!usuario || atual.value !== usuario.senha) { 
    toast('Senha atual incorreta', 'error'); 
    return; 
  }

  usuario.senha = nova.value;
  await dbSalvarUsuario(usuario);

  closeModal('modal-senha');
  toast('Senha alterada com sucesso!', 'success');
}

// ---- Seed de usuarios padrao ----
async function seedUsuariosPDV() {
  const usuarios = await dbCarregarUsuarios();

  if (usuarios.length === 0) {
    const defaultUsers = [
      { id: 'USR-' + Date.now() + '-1', nome: 'Admin',     senha: 'admin123',  role: 'admin',      tipo: 'admin',  dataCriacao: new Date().toISOString() },
      { id: 'USR-' + Date.now() + '-2', nome: 'Caixa',     senha: 'caixa123',  role: 'caixa',      tipo: 'normal', dataCriacao: new Date().toISOString() },
      { id: 'USR-' + Date.now() + '-3', nome: 'Garcom',    senha: 'garcom123', role: 'garcom',     tipo: 'normal', dataCriacao: new Date().toISOString() },
      { id: 'USR-' + Date.now() + '-4', nome: 'Cozinha',   senha: 'cozinha123',role: 'cozinha',    tipo: 'normal', dataCriacao: new Date().toISOString() },
      { id: 'USR-' + Date.now() + '-5', nome: 'Entregador',senha: 'entrega123',role: 'entregador', tipo: 'normal', dataCriacao: new Date().toISOString() }
    ];

    for (const user of defaultUsers) {
      await dbSalvarUsuario(user);
    }
    console.log('Usuarios PDV padrao criados com sucesso!');
  }
}

// ---- Helpers globais ----
function esc(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function showPage(page) {
  // Placeholder para compatibilidade
}
