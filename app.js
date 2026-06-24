// Ouvidoria Inovando - Lógica e Banco de Dados Mock (Local Storage)
// Escola Inove - Redesenho Inspirado de Alta Fidelidade (Atualizado com Slogan no Login)

// --- CONFIGURAÇÃO E DADOS DE SEED ---
const SEED_USERS = [
  { username: 'paulo', name: 'Paulo de Melo', role: 'admin', password: 'Jes0us2team9a', tipo_usuario: 'administrador' },
  { username: 'julia', name: 'Julia de Araújo', role: 'admin', password: 'Jes0us2team9a', tipo_usuario: 'administrador' },
  { username: 'direcao', name: 'Direção Escolar', role: 'admin', password: 'Jes0us2team9a', tipo_usuario: 'administrador' }
];

const SEED_PRE_REGISTERED = [];

const SEED_MANIFESTATIONS = [];

const TURMAS_OPTIONS_HTML = `
  <option value="" disabled selected>Selecione sua turma...</option>
  <option value="6º Ano">6º Ano</option>
  <option value="7º Ano">7º Ano</option>
  <option value="8º Ano">8º Ano</option>
  <option value="9º Ano">9º Ano</option>
  <option value="1º Ano Ensino Médio">1º Ano Ensino Médio</option>
  <option value="2º Ano Ensino Médio">2º Ano Ensino Médio</option>
  <option value="3º Ano Ensino Médio">3º Ano Ensino Médio</option>
  <option value="Não sou aluno">Não sou aluno</option>
`;

const SEED_POLLS = [];

function safeCreateIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    try {
      lucide.createIcons();
    } catch (e) {
      console.error("Erro ao renderizar ícones com Lucide:", e);
    }
  } else {
    console.warn("Lucide não está disponível.");
  }
}

// --- LÓGICA DE CUSTOMIZAÇÃO DE LOGOTIPO (ADMIN) ---
function getLogoHtml(className = 'header-logo-svg') {
  const customLogo = localStorage.getItem('inovando_custom_logo');
  if (customLogo) {
    return `<img src="${customLogo}" class="${className}" alt="Logo Ouvidoria" loading="lazy" />`;
  }
  return `<img src="logo.webp" class="${className}" alt="Logo Ouvidoria" loading="lazy" />`;
}

function uploadCustomLogo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      localStorage.setItem('inovando_custom_logo', e.target.result);
      showToast('Logotipo atualizado com sucesso!');
      renderApp();
    } catch (err) {
      showToast('Erro ao salvar imagem. Escolha uma imagem menor.', 'error');
    }
  };
  reader.readAsDataURL(file);
}

function restoreDefaultLogo() {
  localStorage.removeItem('inovando_custom_logo');
  showToast('Logotipo padrão restaurado.');
  renderApp();
}

// --- GERENCIAMENTO DE ESTADO E SINCRONIZAÇÃO CENTRAL (FIREBASE) ---
let firebaseEnabled = false;
let firebaseConnState = localStorage.getItem('inovando_firebase_url') ? 'connecting' : 'offline';
let dbRef = null;
let firebaseURL = localStorage.getItem('inovando_firebase_url') || '';

// Cache local sincronizado
const LOCAL_CACHE = {
  users: JSON.parse(localStorage.getItem('inovando_users')) || SEED_USERS,
  manifestations: JSON.parse(localStorage.getItem('inovando_manifestations')) || SEED_MANIFESTATIONS,
  polls: JSON.parse(localStorage.getItem('inovando_polls')) || SEED_POLLS,
  pre_registered: JSON.parse(localStorage.getItem('inovando_pre_registered')) || SEED_PRE_REGISTERED,
  audit_logs: JSON.parse(localStorage.getItem('inovando_audit_logs')) || [],
  logo: localStorage.getItem('inovando_logo') || null,
  theme: localStorage.getItem('inovando_theme') || 'light'
};

let localStorageWriteTimeout = null;
function syncCacheToLocalStorage() {
  if (localStorageWriteTimeout) {
    clearTimeout(localStorageWriteTimeout);
  }
  localStorageWriteTimeout = setTimeout(() => {
    try {
      for (const key in LOCAL_CACHE) {
        if (LOCAL_CACHE[key] !== null && LOCAL_CACHE[key] !== undefined) {
          const val = typeof LOCAL_CACHE[key] === 'string' ? LOCAL_CACHE[key] : JSON.stringify(LOCAL_CACHE[key]);
          localStorage.setItem('inovando_' + key, val);
        } else {
          localStorage.removeItem('inovando_' + key);
        }
      }
    } catch (e) {
      console.error("Failed to write to localStorage:", e);
    }
  }, 1000);
}

window.addEventListener('beforeunload', () => {
  if (localStorageWriteTimeout) {
    clearTimeout(localStorageWriteTimeout);
    try {
      for (const key in LOCAL_CACHE) {
        if (LOCAL_CACHE[key] !== null && LOCAL_CACHE[key] !== undefined) {
          const val = typeof LOCAL_CACHE[key] === 'string' ? LOCAL_CACHE[key] : JSON.stringify(LOCAL_CACHE[key]);
          localStorage.setItem('inovando_' + key, val);
        } else {
          localStorage.removeItem('inovando_' + key);
        }
      }
    } catch (e) {
      console.error("beforeunload localStorage save error:", e);
    }
  }
});

const DB = {
  get: (key, fallback) => {
    if (LOCAL_CACHE[key] !== undefined && LOCAL_CACHE[key] !== null) {
      return LOCAL_CACHE[key];
    }
    const val = localStorage.getItem('inovando_' + key);
    return val ? JSON.parse(val) : fallback;
  },
  set: (key, val) => {
    LOCAL_CACHE[key] = val;
    syncCacheToLocalStorage();
    saveToFirebase(key, val);
  },
  reset: () => {
    if (localStorageWriteTimeout) {
      clearTimeout(localStorageWriteTimeout);
    }
    localStorage.removeItem('inovando_users');
    localStorage.removeItem('inovando_manifestations');
    localStorage.removeItem('inovando_polls');
    localStorage.removeItem('inovando_pre_registered');
    localStorage.removeItem('inovando_audit_logs');
    localStorage.removeItem('inovando_logo');
    localStorage.removeItem('inovando_theme');
    
    if (firebaseEnabled && dbRef) {
      dbRef.set({
        users: SEED_USERS,
        manifestations: SEED_MANIFESTATIONS,
        polls: SEED_POLLS,
        pre_registered: SEED_PRE_REGISTERED,
        audit_logs: [],
        logo: null,
        theme: 'light'
      }).then(() => {
        location.reload();
      }).catch(err => {
        console.error("Erro ao resetar banco Firebase:", err);
        location.reload();
      });
    } else {
      location.reload();
    }
  }
};

function recalculatePollVotes(poll) {
  if (!poll.options) return;
  poll.options.forEach(opt => {
    opt.votes = 0;
  });
  if (poll.votedUsers) {
    Object.keys(poll.votedUsers).forEach(username => {
      const voteVal = poll.votedUsers[username];
      const optId = voteVal && typeof voteVal === 'object' ? voteVal.optionId : voteVal;
      if (optId) {
        const option = poll.options.find(o => o.id === optId);
        if (option) {
          option.votes += 1;
        }
      }
    });
  }
}

function mergeUsers(fbUsers, localUsers) {
  const merged = [];
  const localList = Array.isArray(localUsers) ? localUsers : [];
  const fbList = Array.isArray(fbUsers) ? fbUsers : [];

  fbList.forEach(fu => {
    const lu = localList.find(u => u.username.toLowerCase() === fu.username.toLowerCase());
    if (lu) {
      const mergedUser = { ...lu, ...fu };
      if (fu.status === 'bloqueado' || lu.status === 'bloqueado') {
        mergedUser.status = 'bloqueado';
      }
      if (lu.lastAccess && (!fu.lastAccess || new Date(lu.lastAccess) > new Date(fu.lastAccess))) {
        mergedUser.lastAccess = lu.lastAccess;
      }
      merged.push(mergedUser);
    } else {
      merged.push(fu);
    }
  });

  localList.forEach(lu => {
    if (!merged.some(mu => mu.username.toLowerCase() === lu.username.toLowerCase())) {
      merged.push(lu);
    }
  });

  return merged;
}

function mergeManifestations(fbMans, localMans) {
  const merged = [];
  const localList = Array.isArray(localMans) ? localMans : [];
  const fbList = Array.isArray(fbMans) ? fbMans : [];

  fbList.forEach(fm => {
    const lm = localList.find(m => m.id === fm.id);
    if (lm) {
      const mergedComments = [];
      const fmComments = fm.comments || [];
      const lmComments = lm.comments || [];
      
      fmComments.forEach(fc => {
        const lc = lmComments.find(c => c.id === fc.id);
        if (lc) {
          const mergedLikes = [...new Set([...(fc.likedBy || []), ...(lc.likedBy || [])])];
          mergedComments.push({ ...fc, likedBy: mergedLikes });
        } else {
          mergedComments.push(fc);
        }
      });
      
      lmComments.forEach(lc => {
        if (!mergedComments.some(mc => mc.id === lc.id)) {
          mergedComments.push(lc);
        }
      });
      
      merged.push({ ...fm, comments: mergedComments });
    } else {
      merged.push(fm);
    }
  });

  localList.forEach(lm => {
    if (!merged.some(mm => mm.id === lm.id)) {
      merged.push(lm);
    }
  });

  return merged;
}

function mergePolls(fbPolls, localPolls) {
  const merged = [];
  const localList = Array.isArray(localPolls) ? localPolls : [];
  const fbList = Array.isArray(fbPolls) ? fbPolls : [];

  fbList.forEach(fp => {
    const lp = localList.find(p => p.id === fp.id);
    if (lp) {
      const mergedVotedUsers = { ...(fp.votedUsers || {}), ...(lp.votedUsers || {}) };
      const mergedPoll = { ...fp, votedUsers: mergedVotedUsers };
      recalculatePollVotes(mergedPoll);
      merged.push(mergedPoll);
    } else {
      recalculatePollVotes(fp);
      merged.push(fp);
    }
  });

  localList.forEach(lp => {
    if (!merged.some(mp => mp.id === lp.id)) {
      recalculatePollVotes(lp);
      merged.push(lp);
    }
  });

  return merged;
}

function syncCurrentUserSession() {
  if (!currentUser) return;
  const usersList = LOCAL_CACHE.users || DB.get('users', SEED_USERS);
  const dbUser = usersList.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
  if (dbUser) {
    if (dbUser.status === 'bloqueado') {
      showToast('Sua conta foi bloqueada pela administração.', 'error');
      handleLogout();
      return;
    }
    
    let sessionChanged = false;
    if (dbUser.role !== currentUser.role) {
      currentUser.role = dbUser.role;
      sessionChanged = true;
    }
    if (dbUser.name !== currentUser.name) {
      currentUser.name = dbUser.name;
      sessionChanged = true;
    }
    if (dbUser.tipo_usuario !== currentUser.tipo_usuario) {
      currentUser.tipo_usuario = dbUser.tipo_usuario || (dbUser.role === 'admin' ? 'administrador' : 'aluno');
      sessionChanged = true;
    }
    if (dbUser.turma !== currentUser.turma) {
      currentUser.turma = dbUser.turma || '';
      sessionChanged = true;
    }
    if (dbUser.profilePic !== currentUser.profilePic) {
      currentUser.profilePic = dbUser.profilePic || null;
      sessionChanged = true;
    }
    
    if (sessionChanged) {
      localStorage.setItem('inovando_session', JSON.stringify(currentUser));
      const isAdmin = currentUser.role === 'admin';
      if ((currentView === 'admin' || currentView === 'cadastro_manager') && !isAdmin) {
        currentView = 'home';
      }
      renderApp();
    }
  }
}

function healUserDatabase() {
  try {
    const users = LOCAL_CACHE.users || [];
    const manifestations = LOCAL_CACHE.manifestations || [];
    const polls = LOCAL_CACHE.polls || [];
    const logs = LOCAL_CACHE.audit_logs || [];
    let modified = false;

    // Helper to add a user if missing
    function addMissingUser(username, name, role, type, turma) {
      if (!username) return;
      const normalizedUsername = username.trim();
      if (!normalizedUsername) return;
      const lowerUsername = normalizedUsername.toLowerCase();
      
      // Ignore placeholder/special values
      if (lowerUsername === 'anônimo' || lowerUsername === 'anonimo' || lowerUsername === 'admin' || lowerUsername === 'anónimo') {
        return;
      }
      
      if (!users.some(u => u.username.toLowerCase() === lowerUsername)) {
        // Encontra ou define nome amigável
        let friendlyName = name ? name.trim() : normalizedUsername;
        if (friendlyName.toLowerCase() === 'anônimo' || friendlyName.toLowerCase() === 'anonimo' || friendlyName.toLowerCase() === 'anónimo') {
          friendlyName = normalizedUsername;
        }

        users.push({
          username: normalizedUsername,
          name: friendlyName,
          role: role || 'aluno',
          tipo_usuario: type || 'aluno',
          password: 'Jes0us2team9a', // senha padrão restaurada (será criptografada automaticamente em sha256 pelo migrateUserData)
          turma: turma || (type === 'aluno' ? '' : 'Não sou aluno'),
          status: 'ativo',
          created_at: new Date().toISOString()
        });
        modified = true;
        console.log(`Database Healing: Restaurado usuário ausente "${normalizedUsername}" (${friendlyName})`);
      }
    }

    // 1. Extrair de manifestations (autor do post principal)
    manifestations.forEach(m => {
      if (m.authorUsername) {
        const isNotStudent = m.turma === 'Não sou aluno';
        const type = isNotStudent ? 'funcionario' : 'aluno';
        addMissingUser(m.authorUsername, m.author, 'aluno', type, m.turma);
      }
      // Extrair de comments (comentários)
      if (m.comments) {
        m.comments.forEach(c => {
          if (c.authorUsername) {
            addMissingUser(c.authorUsername, c.author, 'aluno', 'aluno', '');
          }
        });
      }
    });

    // 2. Extrair de polls (votos em enquetes)
    polls.forEach(p => {
      if (p.votedUsers) {
        Object.keys(p.votedUsers).forEach(username => {
          if (username) {
            addMissingUser(username, username, 'aluno', 'aluno', '');
          }
        });
      }
    });

    // 3. Extrair de audit logs (usuários administradores que executaram ações)
    logs.forEach(l => {
      if (l.adminUsername) {
        addMissingUser(l.adminUsername, l.adminName || l.adminUsername, 'admin', 'administrador', 'Não sou aluno');
      }
    });

    if (modified) {
      LOCAL_CACHE.users = users;
      syncCacheToLocalStorage();
      saveToFirebase('users', users);
    }
  } catch (err) {
    console.error("Database Healing Error:", err);
  }
}

// Funções de Inicialização e Sincronização
function initFirebase() {
  if (!firebaseURL) {
    firebaseEnabled = false;
    firebaseConnState = 'offline';
    console.log("Firebase Central DB: URL não configurada. Usando armazenamento local.");
    return;
  }
  
  try {
    if (typeof firebase === 'undefined') {
      firebaseEnabled = false;
      firebaseConnState = 'error';
      console.warn("Firebase Central DB: SDK do Firebase não carregado.");
      return;
    }
    
    if (firebase.apps.length > 0) {
      firebase.app().delete();
    }
    
    firebase.initializeApp({
      databaseURL: firebaseURL
    });
    
    dbRef = firebase.database().ref();
    firebaseConnState = 'connecting';
    console.log("Firebase Central DB: Conectando a " + firebaseURL);
    
    let hasLoadedData = false;
    
    dbRef.on('value', (snapshot) => {
      const isFirstLoad = !hasLoadedData;
      hasLoadedData = true;
      firebaseEnabled = true;
      firebaseConnState = 'connected';
      const data = snapshot.val();
      if (data) {
        console.log("Firebase Central DB: Dados recebidos e sincronizados com sucesso.");
        
        if (isFirstLoad) {
          // Mesclagem estruturada inicial
          LOCAL_CACHE.users = mergeUsers(data.users || [], LOCAL_CACHE.users || []);
          LOCAL_CACHE.manifestations = mergeManifestations(data.manifestations || [], LOCAL_CACHE.manifestations || []);
          LOCAL_CACHE.polls = mergePolls(data.polls || [], LOCAL_CACHE.polls || []);

          const localPre = LOCAL_CACHE.pre_registered || [];
          const fbPre = data.pre_registered || [];
          const mergedPre = [...fbPre];
          localPre.forEach(lp => {
            if (!mergedPre.some(fp => fp.matricula === lp.matricula)) {
              mergedPre.push(lp);
            }
          });
          LOCAL_CACHE.pre_registered = mergedPre;

          const localLogs = LOCAL_CACHE.audit_logs || [];
          const fbLogs = data.audit_logs || [];
          const mergedLogs = [...fbLogs];
          localLogs.forEach(ll => {
            if (!mergedLogs.some(fl => fl.id === ll.id)) {
              mergedLogs.push(ll);
            }
          });
          LOCAL_CACHE.audit_logs = mergedLogs;

          LOCAL_CACHE.logo = data.logo !== undefined ? data.logo : (LOCAL_CACHE.logo || null);
          LOCAL_CACHE.theme = data.theme || LOCAL_CACHE.theme || 'light';
          
          // Auto-recuperação (Self-Healing) inicial
          healUserDatabase();

          // Atualiza o Firebase com os dados mesclados locais
          dbRef.set({
            users: LOCAL_CACHE.users,
            manifestations: LOCAL_CACHE.manifestations,
            polls: LOCAL_CACHE.polls,
            pre_registered: LOCAL_CACHE.pre_registered,
            audit_logs: LOCAL_CACHE.audit_logs,
            logo: LOCAL_CACHE.logo || null,
            theme: LOCAL_CACHE.theme
          });
        } else {
          // Carregamento subsequente: aceita a versão do banco central
          LOCAL_CACHE.users = data.users || [];
          LOCAL_CACHE.manifestations = data.manifestations || [];
          LOCAL_CACHE.polls = data.polls || [];
          LOCAL_CACHE.pre_registered = data.pre_registered || [];
          LOCAL_CACHE.audit_logs = data.audit_logs || [];
          LOCAL_CACHE.logo = data.logo !== undefined ? data.logo : null;
          LOCAL_CACHE.theme = data.theme || 'light';
          
          // Auto-recuperação subsequente
          healUserDatabase();
        }

        // Garante que os 3 administradores padrão de produção estejam sempre presentes
        migrateUserData();
        
        // Sincroniza sessão do usuário atual imediatamente
        syncCurrentUserSession();
        
        // Atualiza o localStorage local como backup offline (debounced)
        syncCacheToLocalStorage();
        
        renderApp();
      } else {
        // Database vazio, inicializa com os dados locais atuais
        console.log("Firebase Central DB: Banco vazio. Enviando dados locais atuais...");
        dbRef.set({
          users: LOCAL_CACHE.users,
          manifestations: LOCAL_CACHE.manifestations,
          polls: LOCAL_CACHE.polls,
          pre_registered: LOCAL_CACHE.pre_registered,
          audit_logs: LOCAL_CACHE.audit_logs,
          logo: LOCAL_CACHE.logo || null,
          theme: LOCAL_CACHE.theme
        });
      }
    }, (error) => {
      hasLoadedData = true;
      console.error("Firebase Central DB: Erro de leitura:", error);
      firebaseEnabled = false;
      firebaseConnState = 'error';
      showToast("Falha na sincronização do banco. Operando no modo local.", "error");
      renderApp();
    });
    
  } catch (err) {
    console.error("Firebase Central DB: Falha ao inicializar:", err);
    firebaseEnabled = false;
    firebaseConnState = 'error';
    renderApp();
  }
}

function saveToFirebase(key, val) {
  if (firebaseEnabled && dbRef) {
    dbRef.child(key).set(val).catch(err => {
      console.error(`Firebase Central DB: Erro ao salvar ${key}:`, err);
      showToast("Erro ao sincronizar com o banco central. Salvando localmente.", "error");
    });
  }
}

function logAuditAction(action, targetItem) {
  try {
    if (!currentUser) return;
    const logs = DB.get('audit_logs', []);
    const newLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
      adminUsername: currentUser.username,
      adminName: currentUser.name,
      action: action,
      timestamp: new Date().toISOString(),
      targetItem: targetItem
    };
    logs.unshift(newLog);
    DB.set('audit_logs', logs);
  } catch (err) {
    console.error("logAuditAction Error:", err);
  }
}

// Inicialização segura
if (!localStorage.getItem('inovando_users')) DB.set('users', SEED_USERS);
if (!localStorage.getItem('inovando_manifestations')) DB.set('manifestations', SEED_MANIFESTATIONS);
if (!localStorage.getItem('inovando_polls')) DB.set('polls', SEED_POLLS);
if (!localStorage.getItem('inovando_pre_registered')) DB.set('pre_registered', SEED_PRE_REGISTERED);
if (!localStorage.getItem('inovando_audit_logs')) DB.set('audit_logs', []);

// Inicializar Conexão Firebase
initFirebase();

function migrateUserData() {
  try {
    let users = DB.get('users', SEED_USERS);
    let modified = false;

    // Garante a existência e configuração das 3 contas administrativas de produção
    const admins = [
      { username: 'paulo', name: 'Paulo de Melo', role: 'admin', password: 'Jes0us2team9a', status: 'ativo', tipo_usuario: 'administrador' },
      { username: 'julia', name: 'Julia de Araújo', role: 'admin', password: 'Jes0us2team9a', status: 'ativo', tipo_usuario: 'administrador' },
      { username: 'direcao', name: 'Direção Escolar', role: 'admin', password: 'Jes0us2team9a', status: 'ativo', tipo_usuario: 'administrador' }
    ];

    admins.forEach(admin => {
      const existingIdx = users.findIndex(u => u.username.toLowerCase() === admin.username.toLowerCase());
      if (existingIdx === -1) {
        users.push(admin);
        modified = true;
      }
    });

    // Garante compatibilidade normalizando contas sem o campo tipo_usuario
    users.forEach(u => {
      if (!u.tipo_usuario) {
        u.tipo_usuario = u.role === 'admin' ? 'administrador' : 'aluno';
        modified = true;
      }
    });

    // Criptografa dinamicamente as senhas na inicialização caso ainda não estejam em hash (hash tem 64 caracteres)
    if (typeof sha256 !== 'undefined') {
      users.forEach(u => {
        if (u.password && u.password.length < 64) {
          u.password = sha256(u.password);
          modified = true;
        }
      });
    }

    if (modified) {
      console.log("migrateUserData: Salvando alterações de migração de usuários...");
      DB.set('users', users);
    }
  } catch (err) {
    console.error("Erro na migração de usuários:", err);
  }
}
migrateUserData();

// Migração segura para garantir que as enquetes usem o formato de objeto para votedUsers
function migratePollsVotedUsers() {
  try {
    const polls = DB.get('polls', SEED_POLLS);
    let modified = false;

    polls.forEach(poll => {
      if (!poll.votedUsers) {
        poll.votedUsers = {};
        modified = true;
      } else if (Array.isArray(poll.votedUsers)) {
        const obj = {};
        poll.votedUsers.forEach(u => {
          const firstOptId = poll.options && poll.options[0] ? poll.options[0].id : 'opt_legacy';
          obj[u] = firstOptId;
        });
        poll.votedUsers = obj;
        modified = true;
      }
    });

    if (modified) {
      DB.set('polls', polls);
    }
  } catch (err) {
    console.error("Erro na migração de enquetes:", err);
  }
}
migratePollsVotedUsers();

// Migração segura para garantir que todas as manifestações existentes tenham o campo 'turma'
function migrateManifestationsTurma() {
  try {
    const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
    let modified = false;
    manifestations.forEach(m => {
      if (m.turma === undefined) {
        m.turma = '3º Ano A';
        modified = true;
      }
    });
    if (modified) {
      DB.set('manifestations', manifestations);
    }
  } catch (err) {
    console.error("Erro na migração de turmas das manifestações:", err);
  }
}
migrateManifestationsTurma();

// Migração segura para garantir que todas as manifestações tenham a lista de comentários
function migrateManifestationsComments() {
  try {
    const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
    let modified = false;
    manifestations.forEach(m => {
      if (!m.comments) {
        m.comments = [];
        modified = true;
      } else {
        m.comments.forEach(c => {
          if (!c.likedBy) {
            c.likedBy = [];
            modified = true;
          }
        });
      }
    });
    if (modified) {
      DB.set('manifestations', manifestations);
    }
  } catch (err) {
    console.error("Erro na migração de comentários das manifestações:", err);
  }
}
migrateManifestationsComments();

// --- VARIÁVEIS DE ESTADO DA SESSÃO ---
let currentUser = JSON.parse(localStorage.getItem('inovando_session')) || null;
let currentView = currentUser ? 'home' : 'login';
let userToDelete = null;
let theme = localStorage.getItem('inovando_theme') || 'light';
let cadastroUserSearch = '';
let cadastroPreSearch = '';

// Sincroniza os dados da sessão atual com o banco de dados para refletir mudanças de cargos imediatamente
syncCurrentUserSession();

// Elementos Globais
document.documentElement.setAttribute('data-theme', theme);

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  safeCreateIcons();

  // Remove após 3 segundos
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// --- CONTROLE DE TEMA (LIGHT/DARK) ---
function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('inovando_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  
  const sunIcon = document.querySelector('.theme-sun');
  const moonIcon = document.querySelector('.theme-moon');
  
  if (sunIcon && moonIcon) {
    if (theme === 'dark') {
      sunIcon.classList.remove('active');
      moonIcon.classList.add('active');
    } else {
      sunIcon.classList.add('active');
      moonIcon.classList.remove('active');
    }
  }

  showToast(`Modo ${theme === 'dark' ? 'Escuro' : 'Claro'} ativado!`);
}

// --- FORMATAÇÃO DE DATA ---
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('pt-BR', options);
}

// --- NAVEGAÇÃO E ROTEAMENTO ---
function navigateTo(view) {
  const isAdmin = currentUser && currentUser.role === 'admin';
  if (!currentUser && view !== 'login' && view !== 'cadastro') {
    currentView = 'login';
  } else if (currentUser && (view === 'admin' || view === 'cadastro_manager') && !isAdmin) {
    currentView = 'home';
  } else {
    currentView = view;
  }
  renderApp();
}

// --- LÓGICA DE LOGIN ---
function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username').value.trim();
  const passwordInput = document.getElementById('login-password').value;
  const typeInput = document.getElementById('login-type').value;

  const users = DB.get('users', SEED_USERS);
  const hashedPassword = typeof sha256 !== 'undefined' ? sha256(passwordInput) : passwordInput;
  const user = users.find(u => 
    (u.username.toLowerCase() === usernameInput.toLowerCase() || u.name.toLowerCase() === usernameInput.toLowerCase()) && 
    u.password === hashedPassword
  );

  if (user) {
    if (user.status === 'bloqueado') {
      showToast('Sua conta está bloqueada pela administração.', 'error');
      return;
    }

    // Normaliza tipo_usuario caso ainda não tenha (compatibilidade)
    const userType = user.tipo_usuario || (user.role === 'admin' ? 'administrador' : 'aluno');
    
    // Se não for administrador, valida se o tipo de login coincide com o cadastro
    if (userType !== 'administrador' && userType !== typeInput) {
      showToast('Usuário ou senha incorretos.', 'error');
      return;
    }

    user.lastAccess = new Date().toISOString();
    DB.set('users', users);

    currentUser = {
      username: user.username,
      name: user.name,
      role: user.role,
      tipo_usuario: userType,
      turma: user.turma || '',
      profilePic: user.profilePic || null
    };
    localStorage.setItem('inovando_session', JSON.stringify(currentUser));
    currentView = 'home';
    showToast(`Bem-vindo, ${user.name}!`);
    renderApp();
  } else {
    showToast('Usuário ou senha incorretos.', 'error');
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('inovando_session');
  currentView = 'login';
  showToast('Sessão encerrada com sucesso.');
  renderApp();
}

// --- LÓGICA DE OUVIDORIA (MANIFESTAÇÕES) ---
let currentCategoryFilter = 'all';
let currentStatusFilter = 'all';
let searchQuery = '';

function submitSugestao(e) {
  e.preventDefault();
  const title = document.getElementById('sugestao-subject').value.trim();
  const subcategory = document.getElementById('sugestao-category').value;
  const turma = document.getElementById('sugestao-class').value.trim();
  const description = document.getElementById('sugestao-desc').value.trim();

  if (!title || !description || !turma) {
    showToast('Por favor, preencha todos os campos.', 'error');
    return;
  }

  saveManifestation({
    category: 'sugestao',
    title,
    subcategory,
    turma,
    description,
    author: currentUser.name,
    authorUsername: currentUser.username
  });
}

function submitReclamacao(e) {
  e.preventDefault();
  const title = document.getElementById('reclamacao-subject').value.trim();
  const location = document.getElementById('reclamacao-location').value.trim();
  const turma = document.getElementById('reclamacao-class').value.trim();
  const description = document.getElementById('reclamacao-desc').value.trim();
  const isAnonymous = document.getElementById('reclamacao-anon').checked;

  if (!title || !location || !description || !turma) {
    showToast('Por favor, preencha todos os campos.', 'error');
    return;
  }

  saveManifestation({
    category: 'reclamacao',
    title,
    location,
    turma,
    description,
    author: isAnonymous ? 'Anônimo' : currentUser.name,
    authorUsername: currentUser.username
  });
}

function submitElogio(e) {
  e.preventDefault();
  const recipient = document.getElementById('elogio-recipient').value.trim();
  const title = document.getElementById('elogio-subject').value.trim();
  const turma = document.getElementById('elogio-class').value.trim();
  const description = document.getElementById('elogio-desc').value.trim();

  if (!recipient || !title || !description || !turma) {
    showToast('Por favor, preencha todos os campos.', 'error');
    return;
  }

  saveManifestation({
    category: 'elogio',
    recipient,
    title,
    turma,
    description,
    author: currentUser.name,
    authorUsername: currentUser.username
  });
}

function saveManifestation(data) {
  const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
  const newManifestation = {
    id: 'man_' + Date.now(),
    date: new Date().toISOString(),
    status: 'pending',
    ...data
  };

  manifestations.unshift(newManifestation);
  DB.set('manifestations', manifestations);

  showToast('Sua participação foi registrada com sucesso. Obrigado por contribuir com a Escola Inove!', 'success');
  navigateTo('ouvidoria');
}

function updateManifestationStatus(id, newStatus) {
  const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
  const index = manifestations.findIndex(m => m.id === id);
  if (index !== -1) {
    manifestations[index].status = newStatus;
    DB.set('manifestations', manifestations);
    showToast('Status atualizado com sucesso!');
    renderOuvidoria();
  }
}

let openCommentSections = [];

function toggleCommentsSection(manifestationId) {
  const index = openCommentSections.indexOf(manifestationId);
  if (index === -1) {
    openCommentSections.push(manifestationId);
  } else {
    openCommentSections.splice(index, 1);
  }
  renderOuvidoria();
}

function submitComment(e, manifestationId) {
  try {
    e.preventDefault();
    if (!currentUser) {
      showToast('Você precisa estar logado para comentar.', 'error');
      return;
    }

    const input = document.getElementById(`comment-input-${manifestationId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;

    const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
    const item = manifestations.find(m => m.id === manifestationId);
    if (item) {
      if (!item.comments) item.comments = [];
      
      const newComment = {
        id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        author: currentUser.name,
        authorUsername: currentUser.username,
        date: new Date().toISOString(),
        text: text,
        likedBy: []
      };

      item.comments.push(newComment);
      DB.set('manifestations', manifestations);
      
      input.value = '';
      showToast('Comentário enviado!');
      renderOuvidoria();
    }
  } catch (err) {
    console.error("submitComment Error:", err);
    showToast('Erro ao enviar comentário.', 'error');
  }
}

function toggleLikeComment(manifestationId, commentId) {
  try {
    if (!currentUser) {
      showToast('Você precisa estar logado para curtir comentários.', 'error');
      return;
    }

    const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
    const item = manifestations.find(m => m.id === manifestationId);
    if (item && item.comments) {
      const comment = item.comments.find(c => c.id === commentId);
      if (comment) {
        if (!comment.likedBy) comment.likedBy = [];
        
        const userIndex = comment.likedBy.indexOf(currentUser.username);
        if (userIndex === -1) {
          comment.likedBy.push(currentUser.username);
        } else {
          comment.likedBy.splice(userIndex, 1);
        }

        DB.set('manifestations', manifestations);
        renderOuvidoria();
      }
    }
  } catch (err) {
    console.error("toggleLikeComment Error:", err);
  }
}

function deleteComment(manifestationId, commentId) {
  try {
    if (currentUser.role !== 'admin') {
      showToast('Apenas administradores podem excluir comentários.', 'error');
      return;
    }

    if (!confirm('Você tem certeza que deseja excluir este comentário?')) {
      return;
    }

    const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
    const item = manifestations.find(m => m.id === manifestationId);
    if (item && item.comments) {
      item.comments = item.comments.filter(c => c.id !== commentId);
      DB.set('manifestations', manifestations);
      showToast('Comentário excluído com sucesso.');
      renderOuvidoria();
    }
  } catch (err) {
    console.error("deleteComment Error:", err);
    showToast('Erro ao excluir comentário.', 'error');
  }
}

function openManifestationModal(id) {
  try {
    const modal = document.getElementById('manifestation-modal');
    const form = document.getElementById('manifestation-form');
    const titleInput = document.getElementById('manifestation-title');
    const categorySelect = document.getElementById('manifestation-category');
    const statusSelect = document.getElementById('manifestation-status');
    const descInput = document.getElementById('manifestation-description');

    if (!modal || !form || !titleInput || !categorySelect || !statusSelect || !descInput) {
      console.error("openManifestationModal: Elementos do DOM não foram encontrados!");
      return;
    }

    const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
    const item = manifestations.find(m => m.id === id);

    if (item) {
      form.setAttribute('data-id', id);
      titleInput.value = item.title;
      categorySelect.value = item.category;
      statusSelect.value = item.status;
      descInput.value = item.description;

      const classInput = document.getElementById('manifestation-class');
      if (classInput) {
        const legacyOption = classInput.querySelector('.legacy-option');
        if (legacyOption) {
          legacyOption.remove();
        }
        const exists = Array.from(classInput.options).some(opt => opt.value === item.turma);
        if (!exists && item.turma) {
          const opt = document.createElement('option');
          opt.value = item.turma;
          opt.textContent = item.turma;
          opt.className = 'legacy-option';
          classInput.appendChild(opt);
        }
        classInput.value = item.turma || '';
      }

      let subvalue = '';
      if (item.category === 'sugestao') subvalue = item.subcategory || '';
      else if (item.category === 'reclamacao') subvalue = item.location || '';
      else if (item.category === 'elogio') subvalue = item.recipient || '';
      
      adjustManifestationFormFields(item.category, subvalue);
    }

    modal.classList.add('active');
  } catch (err) {
    console.error("openManifestationModal Error:", err);
  }
}

function closeManifestationModal() {
  try {
    const modal = document.getElementById('manifestation-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  } catch (err) {
    console.error("closeManifestationModal Error:", err);
  }
}

function adjustManifestationFormFields(selectedCategory = null, subvalue = '') {
  try {
    const category = selectedCategory || document.getElementById('manifestation-category').value;
    const container = document.getElementById('manifestation-context-fields');
    if (!container) return;

    if (category === 'sugestao') {
      container.innerHTML = `
        <div class="form-group" style="margin-bottom: 20px;">
          <label for="manifestation-subcategory">Categoria da Sugestão</label>
          <div class="input-wrapper">
            <i data-lucide="tag" style="left: 16px;"></i>
            <select id="manifestation-subcategory" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;">
              <option value="Infraestrutura" ${subvalue === 'Infraestrutura' ? 'selected' : ''}>Infraestrutura</option>
              <option value="Pedagógico" ${subvalue === 'Pedagógico' ? 'selected' : ''}>Pedagógico</option>
              <option value="Eventos/Projetos" ${subvalue === 'Eventos/Projetos' ? 'selected' : ''}>Eventos / Projetos</option>
              <option value="Alimentação" ${subvalue === 'Alimentação' ? 'selected' : ''}>Alimentação</option>
              <option value="Outros" ${subvalue === 'Outros' ? 'selected' : ''}>Outros</option>
            </select>
          </div>
        </div>
      `;
    } else if (category === 'reclamacao') {
      container.innerHTML = `
        <div class="form-group" style="margin-bottom: 20px;">
          <label for="manifestation-location">Local do Problema</label>
          <div class="input-wrapper">
            <i data-lucide="map-pin"></i>
            <input type="text" id="manifestation-location" value="${subvalue}" placeholder="Ex: Sala 202, Refeitório" required>
          </div>
        </div>
      `;
    } else if (category === 'elogio') {
      container.innerHTML = `
        <div class="form-group" style="margin-bottom: 20px;">
          <label for="manifestation-recipient">Pessoa ou Setor Elogiado</label>
          <div class="input-wrapper">
            <i data-lucide="user"></i>
            <input type="text" id="manifestation-recipient" value="${subvalue}" placeholder="Ex: Prof. Carlos de História" required>
          </div>
        </div>
      `;
    }

    safeCreateIcons();
  } catch (err) {
    console.error("adjustManifestationFormFields Error:", err);
  }
}

function saveManifestationEdit(e) {
  try {
    e.preventDefault();
    const id = e.target.getAttribute('data-id');
    const title = document.getElementById('manifestation-title').value.trim();
    const category = document.getElementById('manifestation-category').value;
    const status = document.getElementById('manifestation-status').value;
    const classInput = document.getElementById('manifestation-class');
    const turma = classInput ? classInput.value.trim() : '';
    const description = document.getElementById('manifestation-description').value.trim();

    const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
    const index = manifestations.findIndex(m => m.id === id);

    if (index !== -1) {
      const item = manifestations[index];
      item.title = title;
      item.category = category;
      item.status = status;
      item.turma = turma;
      item.description = description;

      // Limpar campos contextuais antigos
      delete item.subcategory;
      delete item.location;
      delete item.recipient;

      if (category === 'sugestao') {
        const subInput = document.getElementById('manifestation-subcategory');
        item.subcategory = subInput ? subInput.value : 'Outros';
      } else if (category === 'reclamacao') {
        const locInput = document.getElementById('manifestation-location');
        item.location = locInput ? locInput.value.trim() : '';
      } else if (category === 'elogio') {
        const recInput = document.getElementById('manifestation-recipient');
        item.recipient = recInput ? recInput.value.trim() : '';
      }

      DB.set('manifestations', manifestations);
      showToast('Manifestação atualizada com sucesso!');
      closeManifestationModal();
      renderOuvidoria();
    }
  } catch (err) {
    console.error("saveManifestationEdit Error:", err);
    showToast('Erro ao atualizar manifestação.', 'error');
  }
}

function deleteManifestation(id) {
  try {
    const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
    const filtered = manifestations.filter(m => m.id !== id);
    DB.set('manifestations', filtered);
    showToast('Manifestação excluída com sucesso.');
    renderOuvidoria();
  } catch (err) {
    console.error("deleteManifestation Error:", err);
    showToast('Erro ao excluir manifestação.', 'error');
  }
}

// --- LÓGICA DE VOTO NAS ENQUETES ---
function handleVoteSubmit(pollId) {
  const selectedRadio = document.querySelector(`input[name="poll_${pollId}"]:checked`);
  if (!selectedRadio) {
    showToast('Selecione uma opção antes de votar.', 'error');
    return;
  }
  
  const optionId = selectedRadio.value;
  voteInPoll(pollId, optionId);
}

function voteInPoll(pollId, optionId) {
  try {
    const polls = DB.get('polls', SEED_POLLS);
    const poll = polls.find(p => p.id === pollId);

    if (!poll) return;

    if (!currentUser || !currentUser.username) {
      showToast('Você precisa estar logado para votar.', 'error');
      return;
    }

    if (!poll.votedUsers || Array.isArray(poll.votedUsers)) {
      poll.votedUsers = {};
    }

    if (poll.votedUsers[currentUser.username] !== undefined) {
      showToast('Você já participou desta enquete.', 'error');
      return;
    }

    const option = (poll.options || []).find(o => o.id === optionId);
    if (option) {
      option.votes += 1;
      poll.votedUsers[currentUser.username] = {
        optionId: optionId,
        timestamp: new Date().toISOString()
      };
      DB.set('polls', polls);
      showToast('Seu voto foi registrado!');
      if (currentView === 'home') renderHome();
      else renderEnquetes();
    }
  } catch (err) {
    console.error("voteInPoll Error:", err);
    showToast('Erro ao registrar voto.', 'error');
  }
}

function changeVote(pollId) {
  try {
    const polls = DB.get('polls', SEED_POLLS);
    const poll = polls.find(p => p.id === pollId);

    if (!poll) return;

    if (!currentUser || !currentUser.username) {
      showToast('Você precisa estar logado.', 'error');
      return;
    }

    if (!poll.votedUsers || Array.isArray(poll.votedUsers)) {
      poll.votedUsers = {};
    }

    const userVote = poll.votedUsers[currentUser.username];
    if (userVote) {
      const optionId = typeof userVote === 'object' ? userVote.optionId : userVote;
      const option = (poll.options || []).find(o => o.id === optionId);
      if (option && option.votes > 0) {
        option.votes -= 1;
      }
      delete poll.votedUsers[currentUser.username];
      DB.set('polls', polls);
      showToast('Seu voto foi retirado. Escolha outra opção!');
      if (currentView === 'home') renderHome();
      else renderEnquetes();
    }
  } catch (err) {
    console.error("changeVote Error:", err);
    showToast('Erro ao alterar voto.', 'error');
  }
}

function openPollModal(pollId = null) {
  try {
    const modal = document.getElementById('poll-modal');
    const titleEl = document.getElementById('poll-modal-title');
    const form = document.getElementById('poll-form');
    const questionInput = document.getElementById('poll-question');
    const daysLeftInput = document.getElementById('poll-days-left');
    const optionsContainer = document.getElementById('poll-options-container');

    if (!modal || !titleEl || !form || !questionInput || !daysLeftInput || !optionsContainer) {
      console.error("openPollModal: One or more DOM elements were not found!", {modal, titleEl, form, questionInput, daysLeftInput, optionsContainer});
      alert("Erro ao abrir enquetes: elementos da página não carregados.");
      return;
    }

    optionsContainer.innerHTML = '';

    if (pollId) {
      titleEl.textContent = 'Editar Enquete';
      const polls = DB.get('polls', SEED_POLLS);
      const poll = polls.find(p => p.id === pollId);
      
      if (poll) {
        form.setAttribute('data-id', pollId);
        questionInput.value = poll.question;
        daysLeftInput.value = poll.daysLeft !== undefined ? poll.daysLeft : 7;
        
        (poll.options || []).forEach(opt => {
          addPollOptionRow(opt.text, opt.id);
        });
      }
    } else {
      titleEl.textContent = 'Criar Nova Enquete';
      form.removeAttribute('data-id');
      questionInput.value = '';
      daysLeftInput.value = 7;
      addPollOptionRow();
      addPollOptionRow();
    }

    modal.classList.add('active');
  } catch (err) {
    console.error("openPollModal Error:", err);
    alert("Erro ao abrir tela de enquete: " + err.message);
  }
}

function hasPollModalChanges() {
  const form = document.getElementById('poll-form');
  if (!form) return false;
  
  const questionInput = document.getElementById('poll-question');
  const questionVal = questionInput ? questionInput.value.trim() : '';
  
  const optionsContainer = document.getElementById('poll-options-container');
  const optionInputs = optionsContainer ? optionsContainer.querySelectorAll('input[type="text"]') : [];
  const currentOptions = Array.from(optionInputs).map(inp => inp.value.trim());

  const pollId = form.getAttribute('data-id');
  if (pollId) {
    // Edit mode
    const polls = DB.get('polls', SEED_POLLS);
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return false;

    // Check if question changed
    if (questionVal !== (poll.question || '').trim()) {
      return true;
    }
    
    // Check options
    const originalOptions = (poll.options || []).map(opt => (opt.text || '').trim());
    if (currentOptions.length !== originalOptions.length) {
      return true;
    }
    for (let i = 0; i < currentOptions.length; i++) {
      if (currentOptions[i] !== originalOptions[i]) {
        return true;
      }
    }
    return false;
  } else {
    // Creation mode
    if (questionVal !== '') {
      return true;
    }
    for (let i = 0; i < currentOptions.length; i++) {
      if (currentOptions[i] !== '') {
        return true;
      }
    }
    return false;
  }
}

function confirmClosePollModal(onConfirm) {
  let confirmModal = document.getElementById('confirm-modal');
  if (confirmModal) return;

  confirmModal = document.createElement('div');
  confirmModal.id = 'confirm-modal';
  confirmModal.className = 'modal-overlay active';
  confirmModal.style.zIndex = '2100';
  
  confirmModal.innerHTML = `
    <div class="modal-card" style="max-width: 400px; padding: 25px; text-align: center;">
      <div class="modal-header" style="border-bottom: none; padding-bottom: 0; justify-content: center;">
        <h3 class="modal-title" style="font-size: 18px; color: var(--primary);"><i data-lucide="alert-triangle"></i> Atenção</h3>
      </div>
      <div style="font-size: 14px; color: var(--text-secondary); margin: 10px 0 20px 0; line-height: 1.5;">
        Você possui alterações não salvas. Deseja realmente sair?
      </div>
      <div class="modal-actions" style="display: flex; gap: 10px; justify-content: center; flex-direction: column;">
        <button id="btn-continue-editing" class="btn" style="width: 100%;">Continuar Editando</button>
        <button id="btn-discard-changes" class="btn btn-secondary" style="width: 100%; border-color: #ef4444; color: #ef4444; box-shadow: none;">Sair sem Salvar</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmModal);
  safeCreateIcons();

  const cleanup = () => {
    confirmModal.classList.remove('active');
    setTimeout(() => {
      if (confirmModal.parentNode) {
        confirmModal.parentNode.removeChild(confirmModal);
      }
    }, 400);
  };

  document.getElementById('btn-continue-editing').addEventListener('click', () => {
    cleanup();
  });

  document.getElementById('btn-discard-changes').addEventListener('click', () => {
    cleanup();
    onConfirm();
  });
}

function closePollModal(ignoreUnsavedChanges = false) {
  try {
    const modal = document.getElementById('poll-modal');
    if (!modal) return;

    if (!ignoreUnsavedChanges && hasPollModalChanges()) {
      confirmClosePollModal(() => {
        modal.classList.remove('active');
      });
    } else {
      modal.classList.remove('active');
    }
  } catch (err) {
    console.error("closePollModal Error:", err);
  }
}

function addPollOptionRow(text = '', id = '') {
  try {
    const container = document.getElementById('poll-options-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'input-wrapper form-group';
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.marginBottom = '10px';
    
    row.innerHTML = `
      <input type="text" placeholder="Opção de resposta" value="${text}" style="padding-left: 15px; flex-grow: 1;" data-opt-id="${id}">
      <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="width: 44px; padding: 0; box-shadow: none; border-color: var(--primary); color: var(--primary);">
        <i data-lucide="trash-2"></i>
      </button>
    `;
    container.appendChild(row);
    safeCreateIcons();
  } catch (err) {
    console.error("addPollOptionRow Error:", err);
  }
}

function savePoll(e) {
  try {
    e.preventDefault();
    const pollId = e.target.getAttribute('data-id');
    const question = document.getElementById('poll-question').value.trim();
    const daysLeft = parseInt(document.getElementById('poll-days-left').value) || 7;
    const optionInputs = document.querySelectorAll('#poll-options-container input');

    const polls = DB.get('polls', SEED_POLLS);
    const options = [];

    optionInputs.forEach((input, index) => {
      const text = input.value.trim();
      const existingId = input.getAttribute('data-opt-id') || input.dataset.optId;
      if (text) {
        options.push({
          id: existingId || `opt_${Date.now()}_${index}`,
          text: text,
          votes: 0
        });
      }
    });

    if (options.length < 2) {
      showToast('A enquete precisa de no mínimo 2 opções preenchidas.', 'error');
      return;
    }

    if (pollId) {
      const index = polls.findIndex(p => p.id === pollId);
      if (index !== -1) {
        const oldPoll = polls[index];
        options.forEach(newOpt => {
          const oldOpt = (oldPoll.options || []).find(o => o.id === newOpt.id);
          if (oldOpt) {
            newOpt.votes = oldOpt.votes;
          }
        });
        
        polls[index].question = question;
        polls[index].options = options;
        polls[index].daysLeft = daysLeft;
        DB.set('polls', polls);
        logAuditAction('Editou enquete', question);
        showToast('Enquete atualizada!');
      }
    } else {
      const newPoll = {
        id: 'poll_' + Date.now(),
        question,
        options,
        votedUsers: {},
        active: true,
        daysLeft: daysLeft
      };
      polls.unshift(newPoll);
      DB.set('polls', polls);
      logAuditAction('Criou enquete', question);
      showToast('Enquete publicada!');
    }

    closePollModal(true);
    renderEnquetes();
  } catch (err) {
    console.error("savePoll Error:", err);
    alert("Erro ao salvar enquete: " + err.message);
  }
}

function togglePollStatus(pollId) {
  const polls = DB.get('polls', SEED_POLLS);
  const poll = polls.find(p => p.id === pollId);
  if (poll) {
    poll.active = !poll.active;
    DB.set('polls', polls);
    logAuditAction(poll.active ? 'Ativou enquete' : 'Pausou enquete', poll.question);
    showToast(`Enquete ${poll.active ? 'reativada' : 'encerrada'}.`);
    renderEnquetes();
  }
}

// --- LOGICA DE COMPARTILHAMENTO MODAL ---
function openShareModal() {
  const modal = document.getElementById('share-modal');
  modal.classList.add('active');
  
  setTimeout(() => {
    const container = document.getElementById('modal-qr-container');
    if (container && typeof QRCode !== 'undefined') {
      container.innerHTML = '';
      new QRCode(container, {
        text: window.location.href || 'https://ouvidoria.escolainove.com.br',
        width: 160,
        height: 160,
        colorDark: '#0b0f19',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }, 100);
}

function closeShareModal() {
  document.getElementById('share-modal').classList.remove('active');
}

// --- LOGICA DE USUÁRIOS (ADMIN) ---
function openUserModal() {
  const modal = document.getElementById('user-modal');
  document.getElementById('user-username').value = '';
  document.getElementById('user-name').value = '';
  document.getElementById('user-role').value = 'aluno';
  document.getElementById('user-password').value = '';
  modal.classList.add('active');
}

function closeUserModal() {
  document.getElementById('user-modal').classList.remove('active');
}

function saveUser(e) {
  e.preventDefault();
  const username = document.getElementById('user-username').value.trim().toLowerCase();
  const name = document.getElementById('user-name').value.trim();
  const selectedType = document.getElementById('user-role').value;
  const password = document.getElementById('user-password').value;

  if (!username || !name || !password) {
    showToast('Todos os campos são obrigatórios.', 'error');
    return;
  }

  const users = DB.get('users', SEED_USERS);

  if (users.some(u => u.username.toLowerCase() === username)) {
    showToast('Este usuário escolar já existe.', 'error');
    return;
  }

  const hashedPassword = typeof sha256 !== 'undefined' ? sha256(password) : password;

  users.push({
    username,
    name,
    role: 'aluno',
    tipo_usuario: selectedType,
    password: hashedPassword,
    turma: selectedType === 'aluno' ? '' : 'Não sou aluno',
    status: 'ativo',
    created_at: new Date().toISOString()
  });

  DB.set('users', users);
  
  closeUserModal();
  showToast('Novo usuário cadastrado!');
  
  if (currentView === 'admin' || currentView === 'cadastro_manager') {
    renderCadastroManager();
  }
}

function openDeleteUserModal(username, name) {
  userToDelete = username;
  const infoEl = document.getElementById('delete-user-info');
  if (infoEl) {
    infoEl.innerHTML = `Usuário: <strong>${name}</strong> (Matrícula/Login: ${username})`;
  }
  const modal = document.getElementById('delete-user-modal');
  if (modal) {
    modal.classList.add('active');
  }
  safeCreateIcons();
}

function closeDeleteUserModal() {
  userToDelete = null;
  const modal = document.getElementById('delete-user-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function confirmDeleteUser() {
  if (!userToDelete) return;

  if (userToDelete === currentUser.username) {
    showToast('Você não pode remover a si mesmo!', 'error');
    closeDeleteUserModal();
    return;
  }

  const users = DB.get('users', SEED_USERS);
  const user = users.find(u => u.username === userToDelete);
  const name = user ? user.name : userToDelete;

  const filtered = users.filter(u => u.username !== userToDelete);

  if (users.length === filtered.length) {
    showToast('Usuário não encontrado.', 'error');
  } else {
    DB.set('users', filtered);
    logAuditAction('Excluiu usuário', `Usuário: ${name} (${userToDelete})`);
    showToast('Usuário removido com sucesso!');
  }

  closeDeleteUserModal();
  if (currentView === 'cadastro_manager') {
    renderCadastroManager();
  } else {
    renderAdmin();
  }
}

function getUserAvatarHtml(user) {
  if (user && user.profilePic) {
    return `<img src="${user.profilePic}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" loading="lazy" />`;
  }
  if (!user || !user.name) return '';
  return user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
}

function triggerProfilePicUpload() {
  const fileInput = document.getElementById('profile-pic-input');
  if (fileInput) fileInput.click();
}

function uploadProfilePic(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Por favor, selecione uma imagem válida.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64Image = e.target.result;
    
    const users = DB.get('users', SEED_USERS);
    const user = users.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
    if (user) {
      user.profilePic = base64Image;
      DB.set('users', users);
    }
    
    currentUser.profilePic = base64Image;
    localStorage.setItem('inovando_session', JSON.stringify(currentUser));
    
    showToast('Foto de perfil atualizada!');
    renderApp();
  };
  
  reader.onerror = function () {
    showToast('Erro ao ler o arquivo.', 'error');
  };
  
  reader.readAsDataURL(file);
}

function removeProfilePic(event) {
  event.stopPropagation();
  
  const users = DB.get('users', SEED_USERS);
  const user = users.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
  if (user) {
    delete user.profilePic;
    DB.set('users', users);
  }
  
  delete currentUser.profilePic;
  localStorage.setItem('inovando_session', JSON.stringify(currentUser));
  
  showToast('Foto de perfil removida.');
  renderApp();
}

// --- RENDERIZADORES DE VIEW ---

let renderAppTimeout = null;
function renderApp() {
  if (renderAppTimeout) {
    clearTimeout(renderAppTimeout);
  }
  renderAppTimeout = setTimeout(() => {
    renderAppDirect();
  }, 30);
}

function renderAppDirect() {
  const rootEl = document.getElementById('root');

  if (currentView === 'cadastro') {
    renderCadastro();
    return;
  }
  
  // LOGIN - ATUALIZADO COM O LOGOTIPO VETORIAL DA ORELHA E SLOGAN SUBSTITUINDO O "I"
  if (currentView === 'login') {
    rootEl.innerHTML = `
      <div class="login-container">
        <div class="login-card">
          <div class="logo-header">
            <!-- Substituição do antigo "I" pelo Logotipo Vetorial Oficial em um Badge Branco Premium -->
            <div class="login-logo-badge">
              ${getLogoHtml('login-logo-img')}
            </div>
            <div class="logo-title" style="margin-top: 5px;">Ouvidoria <span>Inovando</span></div>
            <div class="logo-subtitle" style="margin-bottom: 5px;">Escola Inove</div>
            <!-- Inclusão do Slogan na Tela de Login -->
            <p class="login-slogan-text">"Sua voz transforma nossa escola."</p>
          </div>
          
          <form class="login-form" onsubmit="handleLogin(event)">
            <div class="form-group">
              <label for="login-username">Login / Matrícula</label>
              <div class="input-wrapper">
                <i data-lucide="user"></i>
                <input type="text" id="login-username" placeholder="Digite seu login" required autofocus>
              </div>
            </div>

            <div class="form-group">
              <label for="login-type">Tipo de Usuário</label>
              <div class="input-wrapper">
                <i data-lucide="users" style="left: 16px; top: 50%; transform: translateY(-50%); z-index: 10;"></i>
                <select id="login-type" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;" required>
                  <option value="aluno" selected>Aluno</option>
                  <option value="professor">Professor</option>
                  <option value="funcionario">Funcionário</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="login-password">Senha</label>
              <div class="input-wrapper">
                <i data-lucide="lock"></i>
                <input type="password" id="login-password" placeholder="Digite sua senha" required>
              </div>
            </div>
            
            <button type="submit" class="btn">
              <span>Entrar</span>
              <i data-lucide="arrow-right"></i>
            </button>

            <div style="text-align: center; margin-top: 15px;">
              <a onclick="navigateTo('cadastro')" style="color: var(--text-secondary); font-size: 13px; text-decoration: underline; cursor: pointer;">
                Não tem uma conta? Cadastre-se aqui
              </a>
            </div>
          </form>
        </div>
      </div>
    `;
    safeCreateIcons();
    return;
  }

  // APP LOGADO
  if (!currentUser) {
    navigateTo('login');
    return;
  }
  const isAdmin = currentUser.role === 'admin';
  
  rootEl.innerHTML = `
    <header class="app-header">
      <div class="header-logo-group">
        ${getLogoHtml('header-logo-svg')}
        <div class="logo-text-and-pillars">
          <div class="logo-title-row">
            <h1>Ouvidoria</h1>
          </div>
          <div class="logo-inovando-container">
            <span class="logo-line"></span>
            <span class="logo-dot"></span>
            <span class="logo-inovando-text">INOVANDO</span>
            <span class="logo-dot"></span>
            <span class="logo-line"></span>
          </div>
          
          <div class="logo-pillars">
            <div class="logo-pillar-item">
              <i data-lucide="target"></i>
              <span>Foco em Você</span>
            </div>
            <div class="logo-pillar-item">
              <i data-lucide="message-square"></i>
              <span>Escuta Ativa</span>
            </div>
            <div class="logo-pillar-item">
              <i data-lucide="lightbulb"></i>
              <span>Soluções Inteligentes</span>
            </div>
            <div class="logo-pillar-item">
              <i data-lucide="trending-up"></i>
              <span>Transformando Opiniões em Resultados</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Seletor de Tema -->
      <div class="theme-toggle-capsule" onclick="toggleTheme()" title="Alternar Modo Claro/Escuro">
        <i data-lucide="sun" class="theme-sun ${theme === 'light' ? 'active' : ''}"></i>
        <i data-lucide="moon" class="theme-moon ${theme === 'dark' ? 'active' : ''}"></i>
        <div class="theme-toggle-slider-knob"></div>
      </div>
    </header>

    <div class="app-container">
      <!-- SIDEBAR -->
      <aside class="app-sidebar">
        <ul class="sidebar-menu">
          <li>
            <a class="menu-item-link ${currentView === 'home' ? 'active' : ''}" onclick="navigateTo('home')">
              <i data-lucide="home"></i>
              <span>Início</span>
            </a>
          </li>
          <li>
            <a class="menu-item-link ${currentView === 'ouvidoria' ? 'active' : ''}" onclick="navigateTo('ouvidoria')">
              <i data-lucide="message-square"></i>
              <span>Ouvidoria</span>
            </a>
          </li>
          <li>
            <a class="menu-item-link ${currentView === 'enquetes' ? 'active' : ''}" onclick="navigateTo('enquetes')">
              <i data-lucide="vote"></i>
              <span>Enquetes</span>
            </a>
          </li>
          ${isAdmin ? `
            <li>
              <a class="menu-item-link ${currentView === 'admin' ? 'active' : ''}" onclick="navigateTo('admin')">
                <i data-lucide="shield-alert"></i>
                <span>Painel Admin</span>
              </a>
            </li>
            <li>
              <a class="menu-item-link ${currentView === 'cadastro_manager' ? 'active' : ''}" onclick="navigateTo('cadastro_manager')">
                <i data-lucide="users-round"></i>
                <span>Gerenciar Cadastros</span>
              </a>
            </li>
          ` : ''}
          <li>
            <a class="menu-item-link ${currentView === 'settings' ? 'active' : ''}" onclick="navigateTo('settings')">
              <i data-lucide="settings"></i>
              <span>Configurações</span>
            </a>
          </li>
        </ul>
        
        <div class="sidebar-footer-group">
          <!-- Logo Institucional Inove Escola na Sidebar -->
          <div class="sidebar-inst-logo">
            <h2>INO<span>V</span>E</h2>
            <span class="sub">Escola</span>
          </div>

          <div class="sidebar-profile-box">
            <div class="avatar" style="overflow: hidden; display: flex; justify-content: center; align-items: center;">${getUserAvatarHtml(currentUser)}</div>
            <div class="user-info">
              <span class="user-name" title="${currentUser.name}">${currentUser.name}</span>
              <span class="user-role">${{ 'aluno': 'Aluno', 'professor': 'Professor', 'funcionario': 'Funcionário', 'administrador': 'Administrador' }[currentUser.tipo_usuario] || (currentUser.role === 'admin' ? 'Administrador' : 'Aluno')}</span>
            </div>
          </div>
          <a class="menu-item-link" onclick="handleLogout()" style="color: var(--primary); border-color: var(--border-color); background-color: transparent;">
            <i data-lucide="log-out"></i>
            <span>Sair</span>
          </a>
        </div>
      </aside>
      
      <!-- ÁREA DE CONTEÚDO PRINCIPAL -->
      <main class="main-content" id="main-content-area">
        <!-- O conteúdo da view será renderizado aqui -->
      </main>
    </div>
  `;

  // Renderiza a view interna correspondente
  switch (currentView) {
    case 'home':
      renderHome();
      break;
    case 'ouvidoria':
      renderOuvidoria();
      break;
    case 'enquetes':
      renderEnquetes();
      break;
    case 'admin':
      if (isAdmin) renderAdmin();
      else navigateTo('home');
      break;
    case 'cadastro_manager':
      if (isAdmin) renderCadastroManager();
      else navigateTo('home');
      break;
    case 'settings':
      renderSettings();
      break;
    case 'sugestao':
      renderSugestao();
      break;
    case 'reclamacao':
      renderReclamacao();
      break;
    case 'elogio':
      renderElogio();
      break;
    default:
      renderHome();
  }

  safeCreateIcons();
}

function renderHome() {
  const container = document.getElementById('main-content-area');
  const polls = DB.get('polls', SEED_POLLS);

  container.innerHTML = `
    <!-- Bloco de Boas-vindas -->
    <section class="welcome-section-box">
      <div class="welcome-info-area">
        <h2>Bem-vindo ao Ouvidoria Inovando</h2>
        <p class="slogan">Este é o espaço onde sua voz transforma nossa escola.</p>
        <p class="desc">Participe, colabore e ajude a construir um ambiente cada vez melhor para todos!</p>
      </div>
      <div class="welcome-logo-graphic">
        ${getLogoHtml('welcome-logo-svg')}
      </div>
    </section>

    <!-- Cards Principais (Formato Horizontal) -->
    <section class="cards-row-layout">
      <!-- Nova Sugestão -->
      <div class="horizontal-action-card" onclick="navigateTo('sugestao')" style="cursor: pointer;">
        <div class="card-left-group">
          <svg viewBox="0 0 24 24" fill="none" stroke="#E53E3E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.1.7.7 1.3 1.5 1.5 2.4" fill="#FEFCBF" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
          <div class="card-text-details">
            <h3>Nova Sugestão</h3>
            <p>Compartilhe suas ideias e sugestões para melhorar a escola.</p>
          </div>
        </div>
        <button class="card-arrow-btn" onclick="event.stopPropagation(); navigateTo('sugestao')">
          <i data-lucide="arrow-right"></i>
        </button>
      </div>

      <!-- Nova Reclamação -->
      <div class="horizontal-action-card" onclick="navigateTo('reclamacao')" style="cursor: pointer;">
        <div class="card-left-group">
          <svg viewBox="0 0 24 24" fill="none" stroke="#E53E3E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" fill="#FEEBC8" />
            <path d="M2 10h3l7-5v14l-7-5H2z" fill="#FED7D7" />
            <path d="M22 10c0-1.6-.8-3-2-4v8c1.2-1 2-2.4 2-4z" />
          </svg>
          <div class="card-text-details">
            <h3>Nova Reclamação</h3>
            <p>Informe algo que precisa ser melhorado.</p>
          </div>
        </div>
        <button class="card-arrow-btn" onclick="event.stopPropagation(); navigateTo('reclamacao')">
          <i data-lucide="arrow-right"></i>
        </button>
      </div>

      <!-- Novo Elogio -->
      <div class="horizontal-action-card" onclick="navigateTo('elogio')" style="cursor: pointer;">
        <div class="card-left-group">
          <svg viewBox="0 0 24 24" fill="none" stroke="#E53E3E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="#FED7D7" />
          </svg>
          <div class="card-text-details">
            <h3>Novo Elogio</h3>
            <p>Reconheça atitudes e ações que merecem destaque.</p>
          </div>
        </div>
        <button class="card-arrow-btn" onclick="event.stopPropagation(); navigateTo('elogio')">
          <i data-lucide="arrow-right"></i>
        </button>
      </div>
    </section>

    <!-- Enquetes Ativas Section -->
    <section>
      <div class="section-title-row">
        <h3>Enquetes Ativas</h3>
        <a class="section-link-red" onclick="navigateTo('enquetes')">Ver todas <i data-lucide="chevron-right"></i></a>
      </div>

      <div class="polls-columns-grid">
        ${polls.slice(0, 3).map(poll => {
          const totalVotes = (poll.options || []).reduce((sum, opt) => sum + opt.votes, 0);
          const hasVoted = currentUser && poll.votedUsers && poll.votedUsers[currentUser.username] !== undefined;

          return `
            <div class="poll-vertical-card">
              <h4>${poll.question}</h4>
              
              <div class="poll-meta-row">
                <div class="poll-meta-item">
                  <i data-lucide="users" style="width:14px; height:14px;"></i>
                  <span>${totalVotes} votos</span>
                </div>
                <div class="poll-meta-item red-date">
                  <i data-lucide="calendar" style="width:14px; height:14px;"></i>
                  <span>Encerra em ${poll.daysLeft || 7} dias</span>
                </div>
              </div>

              <div class="poll-options-list">
                ${(poll.options || []).map(opt => {
                  const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  
                  if (hasVoted || !poll.active) {
                    const userVote = poll.votedUsers ? poll.votedUsers[currentUser.username] : null;
                    const userVotedOptionId = userVote && typeof userVote === 'object' ? userVote.optionId : userVote;
                    const userVotedForThis = hasVoted && userVotedOptionId === opt.id;
                    return `
                      <div class="poll-option-row">
                        <div class="poll-option-results-header">
                          <span>${opt.text} ${userVotedForThis ? '<strong style="color:var(--primary); font-size:10px;">(Meu Voto)</strong>' : ''}</span>
                          <span>${percentage}%</span>
                        </div>
                        <div class="poll-bar-container">
                          <div class="poll-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                      </div>
                    `;
                  } else {
                    return `
                      <div class="poll-option-row">
                        <label class="poll-option-lbl">
                          <input type="radio" name="poll_${poll.id}" value="${opt.id}">
                          <span>${opt.text}</span>
                        </label>
                      </div>
                    `;
                  }
                }).join('')}
              </div>

              ${(!hasVoted && poll.active) ? `
                <button class="btn-poll-votar" onclick="handleVoteSubmit('${poll.id}')">Votar</button>
              ` : `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                  <button class="btn-poll-votar" disabled style="background-color: var(--border-color); color: var(--text-secondary); border-color: var(--border-color); flex-grow: 1;">Voto Registrado</button>
                  ${(poll.active) ? `
                    <button class="btn btn-secondary" onclick="changeVote('${poll.id}')" style="width:auto; padding: 10px 15px; font-size: 13px; border-radius: 10px; display: inline-flex; align-items: center; gap: 8px; border-color: var(--primary); color: var(--primary); height: 44px; margin-top: 0; box-shadow: none;">
                      <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i> Alterar Voto
                    </button>
                  ` : ''}
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </section>

    <!-- Botão de Rodapé para QR Code -->
    <div class="footer-center-btn-row">
      <button class="btn-share-footer" onclick="openShareModal()">
        <i data-lucide="qr-code"></i>
        <span>Compartilhar via QR Code</span>
      </button>
    </div>
  `;
  safeCreateIcons();
}

function renderSugestao() {
  const container = document.getElementById('main-content-area');
  container.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px 0;">
      <div class="welcome-section-box" style="padding: 25px 30px; margin-bottom: 25px; gap: 20px; align-items: center;">
        <div class="welcome-info-area">
          <h2 style="font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
            <i data-lucide="lightbulb" style="color: var(--primary); width: 28px; height: 28px;"></i>
            Nova Sugestão
          </h2>
          <p class="desc" style="margin-top: 5px;">Compartilhe suas ideias e sugestões para melhorar a nossa escola.</p>
        </div>
        <button class="btn btn-secondary" onclick="navigateTo('home')" style="width: auto; padding: 10px 18px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px;">
          <i data-lucide="arrow-left"></i> Voltar
        </button>
      </div>

      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 30px; box-shadow: var(--card-shadow);">
        <form onsubmit="submitSugestao(event)">
          <div class="form-group" style="margin-bottom: 20px;">
            <label for="sugestao-subject">Assunto da Sugestão</label>
            <div class="input-wrapper">
              <i data-lucide="heading"></i>
              <input type="text" id="sugestao-subject" placeholder="Ex: Ajustar horário da biblioteca, Melhorar a cantina" required>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="sugestao-category">Categoria</label>
            <div class="input-wrapper">
              <i data-lucide="tag" style="left: 16px;"></i>
              <select id="sugestao-category" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;">
                <option value="Infraestrutura">Infraestrutura</option>
                <option value="Pedagógico">Pedagógico</option>
                <option value="Eventos/Projetos">Eventos / Projetos</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="sugestao-class">Turma</label>
            <div class="input-wrapper">
              <i data-lucide="graduation-cap" style="left: 16px;"></i>
              <select id="sugestao-class" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;" required>
                ${TURMAS_OPTIONS_HTML}
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 25px;">
            <label for="sugestao-desc">Descrição Detalhada</label>
            <textarea id="sugestao-desc" placeholder="Descreva sua sugestão de forma clara e detalhada. Como isso ajudará a comunidade escolar?" required style="min-height: 120px; padding-left: 16px;"></textarea>
          </div>

          <button type="submit" class="btn">
            <i data-lucide="send"></i>
            <span>Enviar Sugestão</span>
          </button>
        </form>
      </div>
    </div>
  `;
  if (currentUser && currentUser.turma) {
    const classEl = document.getElementById('sugestao-class');
    if (classEl) classEl.value = currentUser.turma;
  }
  safeCreateIcons();
}

function renderReclamacao() {
  const container = document.getElementById('main-content-area');
  container.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px 0;">
      <div class="welcome-section-box" style="padding: 25px 30px; margin-bottom: 25px; gap: 20px; align-items: center;">
        <div class="welcome-info-area">
          <h2 style="font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
            <i data-lucide="alert-triangle" style="color: var(--primary); width: 28px; height: 28px;"></i>
            Nova Reclamação
          </h2>
          <p class="desc" style="margin-top: 5px;">Informe algo que precisa ser melhorado ou ajustado.</p>
        </div>
        <button class="btn btn-secondary" onclick="navigateTo('home')" style="width: auto; padding: 10px 18px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px;">
          <i data-lucide="arrow-left"></i> Voltar
        </button>
      </div>

      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 30px; box-shadow: var(--card-shadow);">
        <form onsubmit="submitReclamacao(event)">
          <div class="form-group" style="margin-bottom: 20px;">
            <label for="reclamacao-subject">Assunto da Reclamação</label>
            <div class="input-wrapper">
              <i data-lucide="heading"></i>
              <input type="text" id="reclamacao-subject" placeholder="Ex: Ar condicionado quebrado, Vazamento de água" required>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="reclamacao-location">Local do Problema</label>
            <div class="input-wrapper">
              <i data-lucide="map-pin"></i>
              <input type="text" id="reclamacao-location" placeholder="Ex: Sala 202, Refeitório, Banheiro Masculino" required>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="reclamacao-class">Turma</label>
            <div class="input-wrapper">
              <i data-lucide="graduation-cap" style="left: 16px;"></i>
              <select id="reclamacao-class" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;" required>
                ${TURMAS_OPTIONS_HTML}
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="reclamacao-desc">Descrição Detalhada</label>
            <textarea id="reclamacao-desc" placeholder="Descreva o problema observado de forma clara. Diga o que ocorreu e o que precisa ser corrigido." required style="min-height: 120px; padding-left: 16px;"></textarea>
          </div>

          <div class="toggle-switch-container" style="margin-bottom: 25px;">
            <div class="switch-label-group">
              <span class="switch-title">Enviar Anonimamente</span>
              <span class="switch-desc">Seu nome não será exibido na manifestação</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="reclamacao-anon">
              <span class="slider"></span>
            </label>
          </div>

          <button type="submit" class="btn">
            <i data-lucide="send"></i>
            <span>Registrar Reclamação</span>
          </button>
        </form>
      </div>
    </div>
  `;
  if (currentUser && currentUser.turma) {
    const classEl = document.getElementById('reclamacao-class');
    if (classEl) classEl.value = currentUser.turma;
  }
  safeCreateIcons();
}

function adjustElogioRecipientField() {
  const destType = document.getElementById('elogio-dest-type').value;
  const wrapper = document.getElementById('elogio-recipient-wrapper');
  if (!wrapper) return;

  const users = DB.get('users', SEED_USERS);

  if (destType === 'professor') {
    const professors = users.filter(u => u.tipo_usuario === 'professor');
    if (professors.length === 0) {
      wrapper.innerHTML = `
        <label for="elogio-recipient">Selecione o Professor</label>
        <div class="input-wrapper">
          <i data-lucide="user" style="left: 16px; top: 50%; transform: translateY(-50%); z-index: 10;"></i>
          <select id="elogio-recipient" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;" required>
            <option value="" disabled selected>Nenhum professor cadastrado no sistema</option>
          </select>
        </div>
      `;
    } else {
      const optionsHtml = professors.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
      wrapper.innerHTML = `
        <label for="elogio-recipient">Selecione o Professor</label>
        <div class="input-wrapper">
          <i data-lucide="user" style="left: 16px; top: 50%; transform: translateY(-50%); z-index: 10;"></i>
          <select id="elogio-recipient" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;" required>
            <option value="" disabled selected>Selecione um professor...</option>
            ${optionsHtml}
          </select>
        </div>
      `;
    }
  } else if (destType === 'funcionario') {
    const staff = users.filter(u => u.tipo_usuario === 'funcionario');
    if (staff.length === 0) {
      wrapper.innerHTML = `
        <label for="elogio-recipient">Selecione o Funcionário</label>
        <div class="input-wrapper">
          <i data-lucide="user" style="left: 16px; top: 50%; transform: translateY(-50%); z-index: 10;"></i>
          <select id="elogio-recipient" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;" required>
            <option value="" disabled selected>Nenhum funcionário cadastrado no sistema</option>
          </select>
        </div>
      `;
    } else {
      const optionsHtml = staff.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
      wrapper.innerHTML = `
        <label for="elogio-recipient">Selecione o Funcionário</label>
        <div class="input-wrapper">
          <i data-lucide="user" style="left: 16px; top: 50%; transform: translateY(-50%); z-index: 10;"></i>
          <select id="elogio-recipient" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;" required>
            <option value="" disabled selected>Selecione um funcionário...</option>
            ${optionsHtml}
          </select>
        </div>
      `;
    }
  } else {
    // Setor / Outros
    wrapper.innerHTML = `
      <label for="elogio-recipient">Nome do Setor Elogiado</label>
      <div class="input-wrapper">
        <i data-lucide="user"></i>
        <input type="text" id="elogio-recipient" placeholder="Ex: Equipe de Limpeza, Cantina, Secretaria" required>
      </div>
    `;
  }
  
  safeCreateIcons();
}

function renderElogio() {
  const container = document.getElementById('main-content-area');
  container.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px 0;">
      <div class="welcome-section-box" style="padding: 25px 30px; margin-bottom: 25px; gap: 20px; align-items: center;">
        <div class="welcome-info-area">
          <h2 style="font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
            <i data-lucide="heart" style="color: var(--primary); width: 28px; height: 28px;"></i>
            Novo Elogio
          </h2>
          <p class="desc" style="margin-top: 5px;">Reconheça atitudes e ações de professores, funcionários ou setores da escola.</p>
        </div>
        <button class="btn btn-secondary" onclick="navigateTo('home')" style="width: auto; padding: 10px 18px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px;">
          <i data-lucide="arrow-left"></i> Voltar
        </button>
      </div>

      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 30px; box-shadow: var(--card-shadow);">
        <form onsubmit="submitElogio(event)">
          <div class="form-group" style="margin-bottom: 20px;">
            <label for="elogio-dest-type">Tipo de Destinatário</label>
            <div class="input-wrapper">
              <i data-lucide="tag" style="left: 16px; top: 50%; transform: translateY(-50%); z-index: 10;"></i>
              <select id="elogio-dest-type" class="filter-select" onchange="adjustElogioRecipientField()" style="width: 100%; height: 50px; padding-left: 44px;" required>
                <option value="professor" selected>Professor</option>
                <option value="funcionario">Funcionário</option>
                <option value="setor">Setor / Outros</option>
              </select>
            </div>
          </div>

          <div class="form-group" id="elogio-recipient-wrapper" style="margin-bottom: 20px;">
            <!-- Inserido dinamicamente via adjustElogioRecipientField() -->
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="elogio-subject">Motivo do Elogio</label>
            <div class="input-wrapper">
              <i data-lucide="award"></i>
              <input type="text" id="elogio-subject" placeholder="Ex: Excelente suporte no projeto de feira de ciências" required>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="elogio-class">Turma</label>
            <div class="input-wrapper">
              <i data-lucide="graduation-cap" style="left: 16px; top: 50%; transform: translateY(-50%); z-index: 10;"></i>
              <select id="elogio-class" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;" required>
                ${TURMAS_OPTIONS_HTML}
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 25px;">
            <label for="elogio-desc">Descrição do Elogio</label>
            <textarea id="elogio-desc" placeholder="Escreva seu agradecimento ou reconhecimento detalhado..." required style="min-height: 120px; padding-left: 16px;"></textarea>
          </div>

          <button type="submit" class="btn">
            <i data-lucide="send"></i>
            <span>Enviar Elogio</span>
          </button>
        </form>
      </div>
    </div>
  `;
  adjustElogioRecipientField();
  if (currentUser && currentUser.turma) {
    const classEl = document.getElementById('elogio-class');
    if (classEl) classEl.value = currentUser.turma;
  }
  safeCreateIcons();
}

function renderManifestationsListHtml(filteredItems, isAdmin) {
  if (filteredItems.length === 0) {
    return `
      <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; color: var(--text-secondary);">
        <i data-lucide="folder-open" style="font-size: 48px; margin-bottom: 15px; color: var(--primary);"></i>
        <h3>Nenhuma manifestação encontrada</h3>
      </div>
    `;
  }

  return filteredItems.map(item => {
    const catBadge = item.category === 'sugestao' ? 'Sugestão' : item.category === 'reclamacao' ? 'Reclamação' : 'Elogio';
    let statusBadge = 'Pendente';
    if (item.status === 'analysis') statusBadge = 'Em Análise';
    if (item.status === 'resolved') statusBadge = 'Resolvido';

    const comments = item.comments || [];
    const sortedComments = [...comments].sort((a, b) => (b.likedBy || []).length - (a.likedBy || []).length);
    const isCommentsOpen = openCommentSections.includes(item.id);

    return `
      <article class="manifestation-item" style="display: flex; flex-direction: column; gap: 15px;">
        <div class="manifestation-card-body">
          <div class="manifestation-content">
            <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
              <span class="badge ${item.category}">${catBadge}</span>
              <span class="badge status-${item.status}">${statusBadge}</span>
            </div>
            <h3>${item.title}</h3>
            <p style="margin-bottom: 15px;">${item.description}</p>
            
            <div class="manifestation-meta">
              <span class="meta-item"><i data-lucide="user"></i> Autor: ${item.author}</span>
              <span class="meta-item"><i data-lucide="calendar"></i> ${formatDate(item.date)}</span>
              ${item.turma ? `<span class="meta-item"><i data-lucide="graduation-cap"></i> Turma: ${item.turma}</span>` : ''}
              ${item.subcategory ? `<span class="meta-item"><i data-lucide="tag"></i> Categoria: ${item.subcategory}</span>` : ''}
              ${item.location ? `<span class="meta-item"><i data-lucide="map-pin"></i> Local: ${item.location}</span>` : ''}
              ${item.recipient ? `<span class="meta-item"><i data-lucide="award"></i> Elogiado: ${item.recipient}</span>` : ''}
              
              <button class="meta-item comment-toggle-btn" onclick="toggleCommentsSection('${item.id}')" style="background: none; border: none; cursor: pointer; color: var(--primary); display: inline-flex; align-items: center; gap: 4px; padding: 0; outline: none; font-weight: 700;">
                <i data-lucide="message-circle" style="width: 14px; height: 14px;"></i> 
                <span>Comentários (${comments.length})</span>
              </button>
            </div>

            ${isAdmin ? `
              <div class="admin-manifestation-controls" style="display:flex; gap:8px; border-top:1.5px dashed var(--border-color); padding-top:15px; margin-top:15px;">
                <button class="btn btn-secondary" onclick="openManifestationModal('${item.id}')" style="padding: 8px 16px; font-size: 12px; width:auto; border-radius: 10px; display:inline-flex; align-items:center; gap:6px;">
                  <i data-lucide="edit" style="width:14px; height:14px;"></i> Editar
                </button>
                <button class="btn" style="background: var(--primary-dark); padding: 8px 16px; font-size: 12px; width:auto; border-radius: 10px; display:inline-flex; align-items:center; gap:6px;" onclick="deleteManifestation('${item.id}')">
                  <i data-lucide="trash-2" style="width:14px; height:14px;"></i> Excluir
                </button>
              </div>
            ` : ''}
          </div>

          ${isAdmin ? `
            <div class="manifestation-actions">
              <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Mudar Status</label>
              <select class="filter-select" onchange="updateManifestationStatus('${item.id}', this.value)" style="padding: 6px 12px; font-size: 12px;">
                <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pendente</option>
                <option value="analysis" ${item.status === 'analysis' ? 'selected' : ''}>Em Análise</option>
                <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Resolvido</option>
              </select>
            </div>
          ` : `
            ${item.authorUsername === currentUser.username ? `
              <div style="font-size: 12px; color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                <i data-lucide="check-circle"></i> Meu Envio
              </div>
            ` : ''}
          `}
        </div>

        <!-- Seção de Comentários Expandida -->
        <div class="comments-container" style="display: ${isCommentsOpen ? 'block' : 'none'}; border-top: 1px solid var(--border-color); padding-top: 15px;">
          <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <i data-lucide="message-square" style="width: 15px; height: 15px; color: var(--primary);"></i>
            Discussão (${comments.length})
          </h4>

          <!-- Lista de Comentários -->
          <div class="comments-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; max-height: 280px; overflow-y: auto; padding-right: 5px;">
            ${sortedComments.length === 0 ? `
              <p style="color: var(--text-secondary); font-size: 12px; font-style: italic; text-align: center; padding: 10px 0;">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </p>
            ` : sortedComments.map((c, idx) => {
              const hasLiked = currentUser && c.likedBy && c.likedBy.includes(currentUser.username);
              const likesCount = c.likedBy ? c.likedBy.length : 0;
              const isTopComment = likesCount > 0 && idx === 0;

              return `
                <div class="comment-item ${isTopComment ? 'top-comment' : ''}" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: start; gap: 15px;">
                  <div style="flex-grow: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                      <span style="font-weight: 700; font-size: 12px; color: var(--text-main);">${c.author}</span>
                      <span style="font-size: 10px; color: var(--text-secondary);">${formatDate(c.date)}</span>
                      ${isTopComment ? `
                        <span class="badge" style="background: rgba(214, 158, 46, 0.1); color: #D69E2E; font-size: 8px; padding: 1px 4px; border: 1px solid rgba(214, 158, 46, 0.2); text-transform: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 2px;">
                          <i data-lucide="crown" style="width: 10px; height: 10px;"></i>Destaque da Direção
                        </span>
                      ` : ''}
                    </div>
                    <p style="font-size: 12.5px; line-height: 1.4; color: var(--text-main); margin: 0;">${c.text}</p>
                  </div>

                  <div style="display: flex; align-items: center; gap: 10px;">
                    ${isAdmin ? `
                      <button class="comment-delete-btn" onclick="deleteComment('${item.id}', '${c.id}')" title="Excluir comentário" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; padding: 2px; outline: none; transition: color 0.2s;">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                      </button>
                    ` : ''}
                    <button class="comment-like-btn" onclick="toggleLikeComment('${item.id}', '${c.id}')" style="background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0; outline: none;">
                      <i data-lucide="heart" style="width: 14px; height: 14px; transition: transform 0.2s; ${hasLiked ? 'fill: var(--primary); color: var(--primary);' : 'color: var(--text-secondary);'}" class="heart-icon"></i>
                      <span style="font-size: 10px; font-weight: 700; color: ${hasLiked ? 'var(--primary)' : 'var(--text-secondary)'};">${likesCount}</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Novo Comentário Form -->
          <form onsubmit="submitComment(event, '${item.id}')" style="display: flex; gap: 10px; align-items: center;">
            <input type="text" id="comment-input-${item.id}" placeholder="Escreva um comentário..." required style="flex-grow: 1; padding: 8px 14px; background: rgba(0,0,0,0.15); border: 1px solid var(--border-color); border-radius: 8px; outline: none; font-size: 12px; color: var(--text-main);">
            <button type="submit" class="btn" style="width: auto; padding: 8px 14px; font-size: 12px; height: 34px; display: inline-flex; align-items: center; gap: 4px; border-radius: 8px;">
              <i data-lucide="send" style="width: 12px; height: 12px;"></i>
            </button>
          </form>
        </div>
      </article>
    `;
  }).join('');
}

function renderOuvidoria() {
  const container = document.getElementById('main-content-area');
  const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
  const isAdmin = currentUser.role === 'admin';

  const filteredItems = manifestations.filter(item => {
    const matchCategory = currentCategoryFilter === 'all' || item.category === currentCategoryFilter;
    const matchStatus = currentStatusFilter === 'all' || item.status === currentStatusFilter;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isOwnerOrAdmin = isAdmin || item.authorUsername === currentUser.username || item.author === 'Anônimo';
    return matchCategory && matchStatus && matchSearch && isOwnerOrAdmin;
  });

  const listContainer = document.getElementById('manifestations-list-container');
  if (listContainer) {
    listContainer.innerHTML = renderManifestationsListHtml(filteredItems, isAdmin);
    safeCreateIcons();
    return;
  }

  container.innerHTML = `
    <div class="top-bar" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:20px; margin-bottom:25px;">
      <div class="page-title">
        <h1 style="font-size:26px; font-weight:800; letter-spacing:-0.5px;">Manifestações da Ouvidoria</h1>
        <p style="font-size:14px; color:var(--text-secondary); margin-top:4px;">Acompanhe ou registre novos envios da comunidade escolar</p>
      </div>
      ${!isAdmin ? `
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-secondary" style="width:auto; padding:10px 16px; font-size:12px; border-color:var(--primary); color:var(--primary); display:inline-flex; align-items:center; gap:6px;" onclick="navigateTo('sugestao')">
            <i data-lucide="lightbulb" style="width:14px; height:14px;"></i> Nova Sugestão
          </button>
          <button class="btn btn-secondary" style="width:auto; padding:10px 16px; font-size:12px; border-color:var(--primary); color:var(--primary); display:inline-flex; align-items:center; gap:6px;" onclick="navigateTo('reclamacao')">
            <i data-lucide="alert-triangle" style="width:14px; height:14px;"></i> Nova Reclamação
          </button>
          <button class="btn btn-secondary" style="width:auto; padding:10px 16px; font-size:12px; border-color:var(--primary); color:var(--primary); display:inline-flex; align-items:center; gap:6px;" onclick="navigateTo('elogio')">
            <i data-lucide="smile" style="width:14px; height:14px;"></i> Novo Elogio
          </button>
        </div>
      ` : ''}
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 4px;">Categoria</label>
          <select class="filter-select" onchange="currentCategoryFilter = this.value; renderOuvidoria()">
            <option value="all" ${currentCategoryFilter === 'all' ? 'selected' : ''}>Todas</option>
            <option value="sugestao" ${currentCategoryFilter === 'sugestao' ? 'selected' : ''}>Sugestões</option>
            <option value="reclamacao" ${currentCategoryFilter === 'reclamacao' ? 'selected' : ''}>Reclamações</option>
            <option value="elogio" ${currentCategoryFilter === 'elogio' ? 'selected' : ''}>Elogios</option>
          </select>
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 4px;">Status</label>
          <select class="filter-select" onchange="currentStatusFilter = this.value; renderOuvidoria()">
            <option value="all" ${currentStatusFilter === 'all' ? 'selected' : ''}>Todos</option>
            <option value="pending" ${currentStatusFilter === 'pending' ? 'selected' : ''}>Pendente</option>
            <option value="analysis" ${currentStatusFilter === 'analysis' ? 'selected' : ''}>Em Análise</option>
            <option value="resolved" ${currentStatusFilter === 'resolved' ? 'selected' : ''}>Resolvido</option>
          </select>
        </div>
      </div>

      <div class="search-input-wrapper">
        <i data-lucide="search"></i>
        <input type="text" placeholder="Buscar..." value="${searchQuery}" oninput="searchQuery = this.value; renderOuvidoria()">
      </div>
    </div>

    <div id="manifestations-list-container" class="manifestations-list">
      ${renderManifestationsListHtml(filteredItems, isAdmin)}
    </div>
  `;
  safeCreateIcons();
}

function renderEnquetes() {
  const container = document.getElementById('main-content-area');
  const polls = DB.get('polls', SEED_POLLS);
  const isAdmin = currentUser.role === 'admin';

  container.innerHTML = `
    <div class="top-bar" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:20px; margin-bottom:25px;">
      <div class="page-title">
        <h1 style="font-size:26px; font-weight:800; letter-spacing:-0.5px;">Enquetes Escolares</h1>
        <p style="font-size:14px; color:var(--text-secondary); margin-top:4px;">Participe das decisões votando ou propondo novas pautas</p>
      </div>
      ${isAdmin ? `
        <button class="btn" style="width:auto; padding:12px 24px;" onclick="openPollModal()">
          <i data-lucide="plus-circle"></i> Nova Enquete
        </button>
      ` : ''}
    </div>

    <div class="polls-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:24px;">
      ${polls.length === 0 ? `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; color: var(--text-secondary);">
          <i data-lucide="vote" style="font-size: 48px; margin-bottom: 15px; color: var(--primary);"></i>
          <h3>Nenhuma enquete cadastrada</h3>
        </div>
      ` : polls.map(poll => {
        const totalVotes = (poll.options || []).reduce((sum, opt) => sum + opt.votes, 0);
        const hasVoted = currentUser && poll.votedUsers && poll.votedUsers[currentUser.username] !== undefined;

        return `
          <div class="poll-vertical-card" style="min-height: auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
              <span class="badge ${poll.active ? 'status-resolved' : 'status-pending'}" style="font-size: 9px;">
                ${poll.active ? 'Ativa' : 'Encerrada'}
              </span>
              <span style="font-size: 11px; color: var(--text-secondary); font-weight: 700;">Encerra em ${poll.daysLeft || 7} dias</span>
            </div>
            <h4 style="min-height: auto; margin-bottom: 15px;">${poll.question}</h4>
            
            <div class="poll-options-list">
              ${(poll.options || []).map(opt => {
                const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;

                if (hasVoted || !poll.active) {
                  const userVote = poll.votedUsers ? poll.votedUsers[currentUser.username] : null;
                  const userVotedOptionId = userVote && typeof userVote === 'object' ? userVote.optionId : userVote;
                  const userVotedForThis = hasVoted && userVotedOptionId === opt.id;
                  return `
                    <div class="poll-option-row">
                      <div class="poll-option-results-header" style="font-size:12px;">
                        <span>${opt.text} ${userVotedForThis ? '<strong style="color:var(--primary); font-size:10px;">(Meu Voto)</strong>' : ''}</span>
                        <span>${opt.votes} votos (${percentage}%)</span>
                      </div>
                      <div class="poll-bar-container" style="height:6px;">
                        <div class="poll-bar-fill" style="width: ${percentage}%"></div>
                      </div>
                    </div>
                  `;
                } else {
                  return `
                    <div class="poll-option-row">
                      <label class="poll-option-lbl">
                        <input type="radio" name="poll_${poll.id}" value="${opt.id}">
                        <span>${opt.text}</span>
                      </label>
                    </div>
                  `;
                }
              }).join('')}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:15px; margin-top:10px;">
              <span style="font-size: 11px; color: var(--text-secondary); font-weight: 700;"><i data-lucide="users" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${totalVotes} votos</span>
              ${(!hasVoted && poll.active) ? `
                <button class="btn-poll-votar" onclick="handleVoteSubmit('${poll.id}')" style="width:auto; padding: 6px 16px; font-size:12px;">Votar</button>
              ` : `
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="color: var(--elogio); font-size:12px; font-weight:700;"><i data-lucide="check-circle" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Voto Registrado</span>
                  ${(poll.active) ? `
                    <button class="btn btn-secondary" onclick="changeVote('${poll.id}')" style="width:auto; padding: 4px 10px; font-size: 11px; height: 26px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; border-color: var(--primary); color: var(--primary); box-shadow: none;">
                      <i data-lucide="rotate-ccw" style="width: 12px; height: 12px;"></i> Alterar Voto
                    </button>
                  ` : ''}
                </div>
              `}
            </div>

            ${isAdmin ? `
              <div class="admin-poll-controls" style="display:flex; gap:8px; margin-top:15px; border-top:1.5px dashed var(--border-color); padding-top:15px; flex-wrap:wrap;">
                <button class="btn btn-secondary" onclick="openPollModal('${poll.id}')" style="padding: 8px 12px; font-size: 11px; width:auto;">
                  <i data-lucide="edit"></i> Editar
                </button>
                <button class="btn btn-secondary" onclick="togglePollStatus('${poll.id}')" style="padding: 8px 12px; font-size: 11px; width:auto;">
                  <i data-lucide="${poll.active ? 'pause-circle' : 'play-circle'}"></i> ${poll.active ? 'Pausar' : 'Ativar'}
                </button>
                <button class="btn btn-secondary" onclick="resetPollVotes('${poll.id}')" style="padding: 8px 12px; font-size: 11px; width:auto; border-color: var(--reclamacao); color: var(--reclamacao);">
                  <i data-lucide="rotate-ccw"></i> Reiniciar
                </button>
                <button class="btn" style="background: var(--primary-dark); padding: 8px 12px; font-size: 11px; width:auto;" onclick="deletePoll('${poll.id}')">
                  <i data-lucide="trash-2"></i> Excluir
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
  safeCreateIcons();
}

function renderAdmin() {
  const container = document.getElementById('main-content-area');
  
  const users = DB.get('users', SEED_USERS);
  const manifestations = DB.get('manifestations', SEED_MANIFESTATIONS);
  const polls = DB.get('polls', SEED_POLLS);

  const totalUsers = users.length;
  const totalVotes = polls.reduce((sum, p) => sum + (p.options || []).reduce((s, o) => s + o.votes, 0), 0);
  const totalSugestao = manifestations.filter(m => m.category === 'sugestao').length;
  const totalReclamacao = manifestations.filter(m => m.category === 'reclamacao').length;
  const totalElogio = manifestations.filter(m => m.category === 'elogio').length;

  container.innerHTML = `
    <div class="top-bar" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:20px; margin-bottom:25px;">
      <div class="page-title">
        <h1 style="font-size:26px; font-weight:800; letter-spacing:-0.5px;">Painel Administrativo</h1>
        <p style="font-size:14px; color:var(--text-secondary); margin-top:4px;">Estatísticas gerais da ouvidoria, gestão de usuários e controle de enquetes</p>
      </div>
      <button class="btn" style="width:auto; padding:12px 24px;" onclick="openUserModal()">
        <i data-lucide="user-plus"></i> Novo Usuário
      </button>
    </div>

    <!-- KPIs -->
    <section class="admin-stats-grid">
      <div class="kpi-card">
        <div class="kpi-icon purple">
          <i data-lucide="users"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-value">${totalUsers}</span>
          <span class="kpi-label">Usuários</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon red">
          <i data-lucide="vote"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-value">${totalVotes}</span>
          <span class="kpi-label">Total Votos</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon blue">
          <i data-lucide="lightbulb"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-value">${totalSugestao}</span>
          <span class="kpi-label">Sugestões</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon orange">
          <i data-lucide="alert-triangle"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-value">${totalReclamacao}</span>
          <span class="kpi-label">Reclamações</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon green">
          <i data-lucide="smile"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-value">${totalElogio}</span>
          <span class="kpi-label">Elogios</span>
        </div>
      </div>
    </section>

    <!-- Gráficos -->
    <section class="charts-container">
      <div class="chart-card">
        <h3>Distribuição de Manifestações</h3>
        <div class="chart-svg-wrapper">
          <svg width="200" height="200" viewBox="0 0 200 200" id="donut-svg"></svg>
          <div class="svg-donut-center">
            <span class="svg-donut-val" id="donut-center-total">0</span>
            <span class="svg-donut-lbl">Envios</span>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color" style="background: var(--sugestao)"></div>
            <span>Sugestões (${totalSugestao})</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: var(--reclamacao)"></div>
            <span>Reclamações (${totalReclamacao})</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: var(--elogio)"></div>
            <span>Elogios (${totalElogio})</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>Engajamento na Principal Enquete</h3>
        <div class="bar-chart-container" id="bar-chart-list"></div>
      </div>
    </section>

    <!-- Tabela de Gerenciamento de Usuários -->
    <section class="users-table-card">
      <div class="table-header">
        <h3>Lista de Usuários Cadastrados</h3>
        <span style="font-size: 13px; color: var(--text-secondary);">Gerenciamento de contas escolares autorizadas</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Matrícula/Login</th>
              <th>Nome Completo</th>
              <th>Cargo/Função</th>
              <th>Senha de Acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              const isSelf = u.username === currentUser.username;
              return `
              <tr>
                <td style="font-weight: 700;">${u.username}</td>
                <td>${u.name}</td>
                <td>
                  <span class="badge ${u.role === 'admin' ? 'reclamacao' : 'sugestao'}" style="font-size: 9px;">
                    ${u.role === 'admin' ? 'Administrador' : 'Aluno'}
                  </span>
                </td>
                <td style="font-family: monospace;">${u.password}</td>
                <td>
                  ${isSelf ? `
                    <span style="font-size: 12px; color: var(--text-secondary); font-style: italic; display: inline-flex; align-items: center; gap: 4px;">
                      <i data-lucide="user" style="width: 14px; height: 14px;"></i> Conta Atual
                    </span>
                  ` : `
                    <div style="display: flex; gap: 6px; align-items: center;">
                      <select onchange="changeUserRole('${u.username}', this.value)" style="height: 30px; font-size: 11px; padding: 0 8px; width: 130px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                        <option value="aluno" ${u.role === 'aluno' ? 'selected' : ''}>Aluno</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
                      </select>
                      <button class="btn btn-secondary btn-danger" style="padding: 6px 12px; font-size: 12px; width: auto; display: inline-flex; align-items: center; gap: 4px;" onclick="openDeleteUserModal('${u.username}', '${u.name.replace(/'/g, "\\'")}')">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Excluir
                      </button>
                    </div>
                  `}
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  setTimeout(() => {
    drawDonutChart(totalSugestao, totalReclamacao, totalElogio);
    drawBarChart(polls);
  }, 100);

  safeCreateIcons();
}

function drawDonutChart(sug, rec, elo) {
  const total = sug + rec + elo;
  document.getElementById('donut-center-total').textContent = total;

  const svg = document.getElementById('donut-svg');
  if (!svg) return;

  if (total === 0) {
    svg.innerHTML = `<circle cx="100" cy="100" r="70" fill="none" stroke="var(--border-color)" stroke-width="20" />`;
    return;
  }

  const pSug = sug / total;
  const pRec = rec / total;
  const pElo = elo / total;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  
  let offset = 0;
  const drawSegment = (percentage, color) => {
    const strokeDash = percentage * circumference;
    const strokeSpace = circumference - strokeDash;
    const strokeOffset = circumference - offset;
    offset += strokeDash;

    return `
      <circle cx="100" cy="100" r="${radius}" 
        fill="none" 
        stroke="${color}" 
        stroke-width="22" 
        stroke-dasharray="${strokeDash} ${strokeSpace}" 
        stroke-dashoffset="${strokeOffset}"
        transform="rotate(-90 100 100)"
        style="transition: stroke-dashoffset 0.8s ease;"
      />
    `;
  };

  let html = '';
  if (sug > 0) html += drawSegment(pSug, 'var(--sugestao)');
  if (rec > 0) html += drawSegment(pRec, 'var(--reclamacao)');
  if (elo > 0) html += drawSegment(pElo, 'var(--elogio)');
  svg.innerHTML = html;
}

function drawBarChart(polls) {
  const container = document.getElementById('bar-chart-list');
  if (!container) return;

  if (polls.length === 0) {
    container.innerHTML = `<p style="color:var(--text-secondary); text-align:center;">Nenhuma enquete ativa.</p>`;
    return;
  }

  const mainPoll = polls[0];
  const options = mainPoll.options || [];
  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  container.innerHTML = `
    <div style="font-weight: 700; font-size: 13px; margin-bottom: 10px; color: var(--primary);">
      ${mainPoll.question}
    </div>
    ${options.map(opt => {
      const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
      return `
        <div class="bar-row">
          <div class="bar-row-header">
            <span class="bar-row-title">${opt.text}</span>
            <span>${opt.votes} votos (${percentage}%)</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: 0%;"></div>
          </div>
        </div>
      `;
    }).join('')}
  `;

  setTimeout(() => {
    const fills = container.querySelectorAll('.bar-fill');
    options.forEach((opt, idx) => {
      const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
      if (fills[idx]) {
        fills[idx].style.width = `${percentage}%`;
        const colors = ['#E53E3E', '#3182CE', '#38A169', '#805AD5'];
        fills[idx].style.backgroundColor = colors[idx % colors.length];
      }
    });
  }, 100);
}

function deletePoll(pollId) {
  if (confirm('Tem certeza que deseja excluir esta enquete permanentemente?')) {
    const polls = DB.get('polls', SEED_POLLS);
    const poll = polls.find(p => p.id === pollId);
    const question = poll ? poll.question : pollId;
    const filtered = polls.filter(p => p.id !== pollId);
    DB.set('polls', filtered);
    logAuditAction('Excluiu enquete', question);
    showToast('Enquete excluída.');
    renderEnquetes();
  }
}

function resetPollVotes(pollId) {
  try {
    const polls = DB.get('polls', SEED_POLLS);
    const poll = polls.find(p => p.id === pollId);
    if (poll) {
      (poll.options || []).forEach(opt => opt.votes = 0);
      poll.votedUsers = {};
      DB.set('polls', polls);
      logAuditAction('Reiniciou votos de enquete', poll.question);
      showToast('Votos da enquete reiniciados!');
      renderEnquetes();
    }
  } catch (err) {
    console.error("resetPollVotes Error:", err);
    showToast('Erro ao reiniciar votos.', 'error');
  }
}

function renderSettings() {
  const container = document.getElementById('main-content-area');
  
  container.innerHTML = `
    <div class="top-bar" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:20px; margin-bottom:25px;">
      <div class="page-title">
        <h1 style="font-size:26px; font-weight:800; letter-spacing:-0.5px;">Configurações</h1>
        <p style="font-size:14px; color:var(--text-secondary); margin-top:4px;">Preferências do sistema e detalhes de segurança da conta</p>
      </div>
    </div>

    <div class="settings-grid">
      <div class="settings-card">
        <h3>Meu Perfil</h3>
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px;">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div class="profile-avatar-container" onclick="triggerProfilePicUpload()">
              <div class="avatar" style="width: 70px; height: 70px; font-size: 26px; border-radius: 50%; border-width: 3px; overflow: hidden; display: flex; justify-content: center; align-items: center;">
                ${getUserAvatarHtml(currentUser)}
              </div>
              <div class="avatar-edit-overlay">
                <i data-lucide="camera" style="width: 20px; height: 20px;"></i>
              </div>
              <input type="file" id="profile-pic-input" accept="image/*" onchange="uploadProfilePic(event)" style="display: none;">
            </div>
            ${currentUser.profilePic ? `
              <button class="btn-link" onclick="removeProfilePic(event)" style="color: var(--primary); font-size: 11px; margin-top: 8px; background: none; border: none; cursor: pointer; text-decoration: underline; padding: 0; outline: none;">
                Remover foto
              </button>
            ` : ''}
          </div>
          <div>
            <h4 style="font-size: 18px; font-weight: 700;">${currentUser.name}</h4>
            <p style="color: var(--text-secondary); font-size: 13px;">Login: <strong style="color: var(--text-main); font-family: monospace;">${currentUser.username}</strong></p>
            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
              <div>
                <span class="badge ${currentUser.role === 'admin' ? 'reclamacao' : 'sugestao'}" style="display: inline-block;">
                  Tipo: ${{ 'aluno': 'Aluno', 'professor': 'Professor', 'funcionario': 'Funcionário', 'administrador': 'Administrador' }[currentUser.tipo_usuario] || (currentUser.role === 'admin' ? 'Administrador' : 'Aluno')}
                </span>
              </div>
              <p style="color: var(--text-secondary); font-size: 13px; margin-top: 2px;">
                Turma: <strong style="color: var(--text-main);">${currentUser.tipo_usuario === 'aluno' ? (currentUser.turma || 'Não vinculada') : 'Não sou aluno'}</strong>
              </p>
            </div>
            <button class="btn btn-secondary" onclick="handleLogout()" style="margin-top: 12px; font-size: 12px; padding: 6px 12px; width: auto; display: flex; align-items: center; gap: 6px; border-color: var(--primary); color: var(--primary); background: transparent;">
              <i data-lucide="log-out" style="width: 14px; height: 14px;"></i> Sair da Conta
            </button>
          </div>
        </div>
        
        <div style="padding-top: 20px; border-top: 1px solid var(--border-color);">
          <h5 style="font-weight: 700; margin-bottom: 8px;">Permissões de Acesso</h5>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--text-secondary);">
            ${currentUser.role === 'admin' ? `
              <li style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="color:var(--elogio); width:16px;"></i> Criar, editar e excluir enquetes</li>
              <li style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="color:var(--elogio); width:16px;"></i> Cadastrar usuários e gerenciar permissões</li>
              <li style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="color:var(--elogio); width:16px;"></i> Visualizar estatísticas do dashboard</li>
              <li style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="color:var(--elogio); width:16px;"></i> Atualizar status das manifestações</li>
            ` : `
              <li style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="color:var(--elogio); width:16px;"></i> Enviar sugestões, reclamações e elogios</li>
              <li style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="color:var(--elogio); width:16px;"></i> Participar de enquetes ativas da escola</li>
              <li style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="color:var(--elogio); width:16px;"></i> Acompanhar suas próprias manifestações</li>
            `}
          </ul>
        </div>
      </div>

      <div class="settings-card">
        <h3>Preferências do Sistema</h3>
        
        <div style="display:flex; flex-direction:column; gap:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="font-weight: 700; font-size: 15px;">Tema Visual</h4>
              <p style="color: var(--text-secondary); font-size: 12px;">Alternar entre modo claro e escuro</p>
            </div>
            <button class="btn btn-secondary" onclick="toggleTheme()" style="width: auto; padding: 8px 16px;">
              <i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}"></i>
              <span>${theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h3>Salvar e Carregar Dados (Backup)</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 20px; line-height: 1.5;">
          Como a plataforma roda localmente no navegador, suas enquetes e manifestações podem ser apagadas pelo histórico ou cache. Use as opções abaixo para baixar as alterações em um arquivo ou restaurá-las a qualquer momento.
        </p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn" onclick="exportSiteBackup()" style="width: auto; padding: 10px 20px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px;">
            <i data-lucide="download"></i> Exportar Backup (Salvar)
          </button>
          <button class="btn btn-secondary" onclick="triggerImportBackup()" style="width: auto; padding: 10px 20px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px;">
            <i data-lucide="upload"></i> Importar Backup (Carregar)
          </button>
          <input type="file" id="import-backup-input" accept=".json" onchange="importSiteBackup(event)" style="display: none;">
        </div>
      </div>

      ${currentUser.role === 'admin' ? `
      <div class="settings-card">
        <h3>Logotipo da Plataforma</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 20px;">
          Como administrador, você pode alterar a imagem do logotipo principal exibido na tela de login, no cabeçalho e na página inicial.
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
            <div style="width: 80px; height: 80px; background: #FFFFFF; border: 1.5px solid var(--border-color); border-radius: 12px; display: flex; justify-content: center; align-items: center; padding: 8px; box-shadow: var(--card-shadow); overflow: hidden;">
              ${getLogoHtml('preview-logo-img')}
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; flex-grow: 1;">
              <label class="btn" style="width: auto; padding: 10px 20px; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                <i data-lucide="upload"></i> Escolher Imagem
                <input type="file" id="custom-logo-input" accept="image/*" onchange="uploadCustomLogo(event)" style="display: none;">
              </label>
              <button class="btn btn-secondary" onclick="restoreDefaultLogo()" style="width: auto; padding: 10px 20px; font-size: 13px; border-color: var(--primary); color: var(--primary); display: inline-flex; align-items: center; gap: 8px;">
                <i data-lucide="rotate-ccw"></i> Restaurar Padrão
              </button>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      ${getFirebaseSettingsCardHtml()}

    </div>
  `;
  safeCreateIcons();
}

function getFirebaseSettingsCardHtml() {
  if (currentUser.role !== 'admin') return '';
  
  return `
    <div class="settings-card">
      <h3>Banco de Dados Central (Sincronização)</h3>
      <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 15px; line-height: 1.5;">
        Conecte a Ouvidoria a um banco de dados centralizado no Firebase para que enquetes e sugestões sejam compartilhadas e sincronizadas em tempo real em todos os celulares, tablets e computadores.
      </p>
      
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; font-size: 14px;">
        <strong>Status da Conexão:</strong>
        <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: ${
          firebaseConnState === 'connected' ? 'var(--elogio)' : 
          firebaseConnState === 'connecting' ? '#d69e2e' : 
          firebaseConnState === 'error' ? 'var(--reclamacao)' : 
          'var(--text-secondary)'
        }">
          <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${
            firebaseConnState === 'connected' ? 'var(--elogio)' : 
            firebaseConnState === 'connecting' ? '#d69e2e' : 
            firebaseConnState === 'error' ? 'var(--reclamacao)' : 
            'var(--text-secondary)'
          }; display: inline-block;"></span>
          ${
            firebaseConnState === 'connected' ? 'Conectado (Centralizado)' : 
            firebaseConnState === 'connecting' ? 'Conectando...' : 
            firebaseConnState === 'error' ? 'Erro na Conexão' : 
            'Modo Offline (Local)'
          }
        </span>
      </div>

      <form onsubmit="saveFirebaseConfig(event)" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label for="firebase-db-url" style="font-size: 12px; font-weight: 700;">URL do Firebase Realtime Database</label>
          <div class="input-wrapper">
            <i data-lucide="database"></i>
            <input type="url" id="firebase-db-url" value="${firebaseURL}" placeholder="https://seu-projeto-default-rtdb.firebaseio.com" required style="padding-left: 44px;">
          </div>
        </div>
        <button type="submit" class="btn" style="width: auto; padding: 10px 20px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px;">
          <i data-lucide="link"></i> Conectar Banco Central
        </button>
      </form>

      ${firebaseURL ? `
        <button class="btn btn-secondary" onclick="disconnectFirebase()" style="width: auto; padding: 8px 16px; font-size: 12px; color: var(--reclamacao); border-color: var(--reclamacao); background: transparent; display: block; margin-bottom: 15px;">
          Desconectar Banco Central
        </button>
      ` : ''}

      ${firebaseConnState === 'error' && firebaseURL ? `
        <div style="margin-top: 15px; padding: 10px 15px; background: rgba(229, 62, 62, 0.1); border-left: 4px solid var(--reclamacao); border-radius: 4px; font-size: 12px; color: var(--text-main); line-height: 1.4;">
          Não foi possível conectar ao Firebase. Verifique se a URL está correta e se a base de dados possui regras de leitura/escrita públicas no Firebase Console (Modo de Teste).
        </div>
      ` : ''}

      ${firebaseEnabled ? `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--border-color);">
          <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">Sincronizar Dados Locais</h4>
          <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 12px; line-height: 1.4;">
            Se você possui dados locais neste dispositivo e deseja enviá-los para o banco de dados central (sobrescrevendo o banco remoto), use o botão abaixo.
          </p>
          <button class="btn btn-secondary" onclick="syncLocalDataToCentral()" style="width: auto; padding: 8px 16px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
            <i data-lucide="arrow-up-circle"></i> Enviar Dados Locais para o Banco Central
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function saveFirebaseConfig(e) {
  try {
    e.preventDefault();
    const urlInput = document.getElementById('firebase-db-url');
    if (!urlInput) return;
    
    let url = urlInput.value.trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    
    localStorage.setItem('inovando_firebase_url', url);
    firebaseURL = url;
    
    showToast("Configurações salvas. Conectando...", "success");
    setTimeout(() => {
      location.reload();
    }, 1500);
  } catch (err) {
    console.error("saveFirebaseConfig Error:", err);
    showToast("Erro ao salvar configuração.", "error");
  }
}

function disconnectFirebase() {
  try {
    if (!confirm("Tem certeza que deseja desconectar do banco central? O site voltará a operar no modo local offline.")) {
      return;
    }
    
    localStorage.removeItem('inovando_firebase_url');
    firebaseURL = '';
    firebaseEnabled = false;
    dbRef = null;
    
    showToast("Desconectado com sucesso. Recarregando...", "success");
    setTimeout(() => {
      location.reload();
    }, 1500);
  } catch (err) {
    console.error("disconnectFirebase Error:", err);
  }
}

function syncLocalDataToCentral() {
  try {
    if (!firebaseEnabled || !dbRef) {
      showToast("Não conectado ao banco central.", "error");
      return;
    }
    
    if (!confirm("ATENÇÃO: Isso enviará TODOS os dados salvos localmente neste computador (enquetes, sugestões e usuários) para o banco de dados central, substituindo qualquer dado existente lá. Deseja prosseguir?")) {
      return;
    }
    
    showToast("Enviando dados locais para a nuvem...", "info");
    
    dbRef.set({
      users: LOCAL_CACHE.users,
      manifestations: LOCAL_CACHE.manifestations,
      polls: LOCAL_CACHE.polls,
      logo: LOCAL_CACHE.logo || null,
      theme: LOCAL_CACHE.theme
    }).then(() => {
      showToast("Sincronização completa! Todos os dados locais estão na nuvem.", "success");
    }).catch(err => {
      console.error("syncLocalDataToCentral Error:", err);
      showToast("Erro ao enviar dados para a nuvem.", "error");
    });
  } catch (err) {
    console.error("syncLocalDataToCentral Error:", err);
  }
}

// --- FUNÇÕES DE BACKUP DE DADOS ---
function exportSiteBackup() {
  try {
    const backupData = {
      users: DB.get('users', SEED_USERS),
      manifestations: DB.get('manifestations', SEED_MANIFESTATIONS),
      polls: DB.get('polls', SEED_POLLS),
      customLogo: localStorage.getItem('inovando_custom_logo') || '',
      theme: localStorage.getItem('inovando_theme') || 'light'
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_ouvidoria_inovando_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Backup do site exportado com sucesso!');
  } catch (err) {
    console.error("exportSiteBackup Error:", err);
    showToast('Erro ao exportar backup.', 'error');
  }
}

function triggerImportBackup() {
  const fileInput = document.getElementById('import-backup-input');
  if (fileInput) fileInput.click();
}

function importSiteBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const backupData = JSON.parse(e.target.result);
      
      if (!backupData.users || !backupData.manifestations || !backupData.polls) {
        showToast('Arquivo de backup inválido ou corrompido.', 'error');
        return;
      }

      DB.set('users', backupData.users);
      DB.set('manifestations', backupData.manifestations);
      DB.set('polls', backupData.polls);
      
      if (backupData.customLogo) {
        localStorage.setItem('inovando_custom_logo', backupData.customLogo);
      } else {
        localStorage.removeItem('inovando_custom_logo');
      }

      if (backupData.theme) {
        localStorage.setItem('inovando_theme', backupData.theme);
      }

      showToast('Dados restaurados com sucesso! Recarregando...');
      setTimeout(() => {
        location.reload();
      }, 1500);
    } catch (err) {
      console.error("importSiteBackup Error:", err);
      showToast('Erro ao ler ou processar o arquivo de backup.', 'error');
    }
  };
  
  reader.onerror = function () {
    showToast('Erro ao ler o arquivo.', 'error');
  };
  
  reader.readAsText(file);
}

// --- FUNÇÕES DE COMPARTILHAMENTO ---
function copyAppUrl() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link da Ouvidoria copiado!');
  }).catch(() => {
    showToast('Erro ao copiar link.', 'error');
  });
}

function shareApp() {
  if (navigator.share) {
    navigator.share({
      title: 'Ouvidoria Inovando - Escola Inove',
      text: 'Participe da Ouvidoria Inovando e ajude a transformar nossa escola!',
      url: window.location.href
    }).then(() => {
      showToast('Compartilhado com sucesso!');
    }).catch(err => {
      console.log('Erro ao compartilhar:', err);
    });
  } else {
    copyAppUrl();
  }
}

// --- NOVAS FUNÇÕES DO SISTEMA DE CADASTRO E CONTROLE DE ACESSO ---

function renderCadastro() {
  const rootEl = document.getElementById('root');
  rootEl.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="logo-header">
          <div class="login-logo-badge">
            ${getLogoHtml('login-logo-img')}
          </div>
          <div class="logo-title" style="margin-top: 5px;">Ouvidoria <span>Inovando</span></div>
          <div class="logo-subtitle" style="margin-bottom: 5px;">Criar Nova Conta</div>
          <p class="login-slogan-text">"Sua voz transforma nossa escola."</p>
        </div>
        
        <form class="login-form" onsubmit="handleCadastro(event)">
          <div class="form-group">
            <label for="cadastro-name">Nome Completo</label>
            <div class="input-wrapper">
              <i data-lucide="user"></i>
              <input type="text" id="cadastro-name" placeholder="Digite seu nome completo" required autofocus>
            </div>
          </div>

          <div class="form-group">
            <label for="cadastro-type">Tipo de Usuário</label>
            <div class="input-wrapper">
              <i data-lucide="users" style="left: 16px; top: 50%; transform: translateY(-50%); z-index: 10;"></i>
              <select id="cadastro-type" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;" onchange="adjustCadastroFields()" required>
                <option value="aluno" selected>Aluno</option>
                <option value="professor">Professor</option>
                <option value="funcionario">Funcionário</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="cadastro-class">Turma</label>
            <div class="input-wrapper">
              <i data-lucide="graduation-cap" style="left: 16px; top: 50%; transform: translateY(-50%); z-index: 10;"></i>
              <select id="cadastro-class" class="filter-select" style="width: 100%; height: 50px; padding-left: 44px;" required>
                ${TURMAS_OPTIONS_HTML}
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="cadastro-password">Senha</label>
            <div class="input-wrapper">
              <i data-lucide="lock"></i>
              <input type="password" id="cadastro-password" placeholder="Digite a senha desejada" required>
            </div>
          </div>
          
          <button type="submit" class="btn">
            <span>Cadastrar</span>
            <i data-lucide="user-plus"></i>
          </button>
          
          <div style="text-align: center; margin-top: 15px;">
            <a onclick="navigateTo('login')" style="color: var(--text-secondary); font-size: 13px; text-decoration: underline; cursor: pointer;">
              Já tem uma conta? Faça Login
            </a>
          </div>
        </form>
      </div>
    </div>
  `;
  safeCreateIcons();
}

function adjustCadastroFields() {
  const typeSelect = document.getElementById('cadastro-type');
  const classSelect = document.getElementById('cadastro-class');
  if (!typeSelect || !classSelect) return;

  if (typeSelect.value !== 'aluno') {
    classSelect.value = 'Não sou aluno';
  } else {
    classSelect.value = '';
  }
}

function handleCadastro(e) {
  e.preventDefault();
  const nomeInput = document.getElementById('cadastro-name').value.trim();
  const typeInput = document.getElementById('cadastro-type').value;
  const turmaInput = document.getElementById('cadastro-class').value;
  const passwordInput = document.getElementById('cadastro-password').value;

  if (!nomeInput || !typeInput || !turmaInput || !passwordInput) {
    showToast('Por favor, preencha todos os campos.', 'error');
    return;
  }

  const users = DB.get('users', SEED_USERS);

  // Validação de nome duplicado (case-insensitive)
  const nameExists = users.some(u => 
    u.name.toLowerCase() === nomeInput.toLowerCase() || 
    u.username.toLowerCase() === nomeInput.toLowerCase()
  );
  if (nameExists) {
    showToast('Este nome já está cadastrado. Por favor, utilize outro ou faça login.', 'error');
    return;
  }

  const hashedPassword = typeof sha256 !== 'undefined' ? sha256(passwordInput) : passwordInput;
  const newStudent = {
    username: nomeInput, // O nome completo passa a ser a identificação
    name: nomeInput,
    role: 'aluno',
    tipo_usuario: typeInput,
    password: hashedPassword,
    turma: turmaInput,
    status: 'ativo',
    created_at: new Date().toISOString()
  };

  users.push(newStudent);
  DB.set('users', users);

  showToast(`Cadastro realizado com sucesso! Selecione seu tipo correspondente e faça login.`, 'success');
  navigateTo('login');
}

function renderUserRowsHtml(filteredUsers) {
  if (filteredUsers.length === 0) {
    return `
      <tr>
        <td colspan="10" style="text-align: center; color: var(--text-secondary); padding: 30px;">Nenhum usuário cadastrado correspondente encontrado.</td>
      </tr>
    `;
  }

  return filteredUsers.map(u => {
    const isSelf = u.username === currentUser.username;
    const dateCadastro = u.created_at ? formatDate(u.created_at) : 'Dados Semente';
    const dateLastAccess = u.lastAccess ? formatDate(u.lastAccess) : 'Nunca';
    const countVotes = getUserVotesCount(u.username);
    const isBlocked = u.status === 'bloqueado';
    const escapedName = (u.name || '').replace(new RegExp("'", "g"), "\\'");

    const typeUser = u.tipo_usuario || (u.role === 'admin' ? 'administrador' : 'aluno');
    const typeLabelMap = {
      'aluno': 'Aluno',
      'professor': 'Professor',
      'funcionario': 'Funcionário',
      'administrador': 'Administrador'
    };
    const typeClassMap = {
      'aluno': 'sugestao',
      'professor': 'elogio',
      'funcionario': 'status-pending',
      'administrador': 'reclamacao'
    };
    const typeLabel = typeLabelMap[typeUser] || 'Aluno';
    const typeClass = typeClassMap[typeUser] || 'sugestao';

    return `
      <tr>
        <td style="font-weight: 700;">${u.username}</td>
        <td>${u.name}</td>
        <td>${u.turma || 'N/A'}</td>
        <td>
          <span class="badge ${typeClass}" style="font-size: 9px;">
            ${typeLabel}
          </span>
        </td>
        <td>${dateCadastro}</td>
        <td>${dateLastAccess}</td>
        <td style="text-align: center; font-weight: 700;">${countVotes}</td>
        <td>
          <span class="badge ${isBlocked ? 'status-pending' : 'status-resolved'}" style="font-size: 9px;">
            ${isBlocked ? 'Bloqueada' : 'Ativa'}
          </span>
        </td>
        <td>
          ${(typeUser === 'administrador' || isSelf) ? `
            <select disabled style="height: 30px; font-size: 11px; padding: 0 8px; width: 130px; background: rgba(255,255,255,0.05); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 6px; cursor: not-allowed;">
              <option value="administrador" selected>Administrador</option>
            </select>
          ` : `
            <select onchange="changeUserRole('${u.username}', this.value)" style="height: 30px; font-size: 11px; padding: 0 8px; width: 130px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
              <option value="aluno" ${typeUser === 'aluno' ? 'selected' : ''}>Aluno</option>
              <option value="professor" ${typeUser === 'professor' ? 'selected' : ''}>Professor</option>
              <option value="funcionario" ${typeUser === 'funcionario' ? 'selected' : ''}>Funcionário</option>
            </select>
          `}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            ${isSelf ? `
              <span style="font-size: 11px; color: var(--text-secondary); font-style: italic;">Sua Conta</span>
            ` : `
              <button class="btn btn-secondary" onclick="toggleUserBlockStatus('${u.username}')" style="padding: 6px 10px; font-size: 11px; width: auto; border-color: ${isBlocked ? 'var(--elogio)' : 'var(--reclamacao)'}; color: ${isBlocked ? 'var(--elogio)' : 'var(--reclamacao)'}; display: inline-flex; align-items: center; gap: 4px; background: transparent; height: 30px;">
                <i data-lucide="${isBlocked ? 'unlock' : 'lock'}"></i> ${isBlocked ? 'Desbloquear' : 'Bloquear'}
              </button>
              <button class="btn btn-secondary" onclick="openResetPasswordModal('${u.username}', '${escapedName}')" style="padding: 6px 10px; font-size: 11px; width: auto; display: inline-flex; align-items: center; gap: 4px; height: 30px;">
                <i data-lucide="key-round"></i> Senha
              </button>
              <button class="btn btn-secondary btn-danger" onclick="openDeleteUserModal('${u.username}', '${escapedName}')" style="padding: 6px 10px; font-size: 11px; width: auto; display: inline-flex; align-items: center; gap: 4px; height: 30px;">
                <i data-lucide="trash-2"></i> Excluir
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderCadastroManager() {
  const container = document.getElementById('main-content-area');
  if (!container) return;

  // Heal/Restore missing users from other collections
  healUserDatabase();

  const users = DB.get('users', SEED_USERS);
  const logs = DB.get('audit_logs', []);
  const polls = DB.get('polls', SEED_POLLS);

  // Calcular estatísticas
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status !== 'bloqueado').length;
  const blockedUsers = users.filter(u => u.status === 'bloqueado').length;
  const totalVotes = polls.reduce((sum, poll) => sum + Object.keys(poll.votedUsers || {}).length, 0);

  // Filtrar usuários
  const filteredUsers = users.filter(u => {
    const term = cadastroUserSearch.toLowerCase();
    return (u.name || '').toLowerCase().includes(term) ||
           (u.username || '').toLowerCase().includes(term) ||
           (u.turma || '').toLowerCase().includes(term);
  });

  const tbody = document.getElementById('cadastro-manager-users-table-tbody');
  if (tbody) {
    tbody.innerHTML = renderUserRowsHtml(filteredUsers);
    safeCreateIcons();
    return;
  }

  container.innerHTML = `
    <div class="top-bar" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:20px; margin-bottom:25px; flex-wrap: wrap; gap: 15px;">
      <div class="page-title">
        <h1 style="font-size:26px; font-weight:800; letter-spacing:-0.5px;">Gerenciamento de Cadastros</h1>
        <p style="font-size:14px; color:var(--text-secondary); margin-top:4px;">Controle de acessos, contas ativas e log de auditoria</p>
      </div>
    </div>

    <!-- KPIs do Painel de Cadastro -->
    <section class="admin-stats-grid" style="margin-bottom: 25px;">
      <div class="kpi-card">
        <div class="kpi-icon purple">
          <i data-lucide="users"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-value">${totalUsers}</span>
          <span class="kpi-label">Usuários Ativos</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">
          <i data-lucide="user-check"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-value">${activeUsers}</span>
          <span class="kpi-label">Contas Ativas</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon orange">
          <i data-lucide="user-x"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-value">${blockedUsers}</span>
          <span class="kpi-label">Contas Bloqueadas</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon blue">
          <i data-lucide="vote"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-value">${totalVotes}</span>
          <span class="kpi-label">Votos Realizados</span>
        </div>
      </div>
    </section>

    <!-- SEÇÕES INTERNAS -->
    <div style="display: flex; flex-direction: column; gap: 30px;">
      
      <!-- Seção: Usuários Cadastrados -->
      <section class="users-table-card">
        <div class="table-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; padding: 20px;">
          <div>
            <h3>Usuários Cadastrados no Sistema</h3>
            <span style="font-size: 13px; color: var(--text-secondary);">Alunos e administradores que ativaram suas contas</span>
          </div>
          <div class="search-input-wrapper" style="margin: 0; max-width: 300px;">
            <i data-lucide="search"></i>
            <input type="text" id="cadastro-user-search-input" placeholder="Buscar usuário por nome, login..." value="${cadastroUserSearch}" oninput="cadastroUserSearch = this.value; renderCadastroManager()">
          </div>
        </div>
        
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Login / Matrícula</th>
                <th>Nome Completo</th>
                <th>Turma</th>
                <th>Cargo</th>
                <th>Criado em</th>
                <th>Último Acesso</th>
                <th>Qtd Votos</th>
                <th>Status</th>
                <th>Alterar Cargo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="cadastro-manager-users-table-tbody">
              ${renderUserRowsHtml(filteredUsers)}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Seção: Histórico de Auditoria -->
      <section class="users-table-card">
        <div class="table-header" style="padding: 20px;">
          <h3>Histórico de Auditoria Administrativa</h3>
          <span style="font-size: 13px; color: var(--text-secondary);">Registro detalhado das ações executadas por administradores do site</span>
        </div>
        <div class="table-wrapper" style="max-height: 400px; overflow-y: auto;">
          <table>
            <thead>
              <tr>
                <th>Administrador</th>
                <th>Ação Executada</th>
                <th>Item Afetado / Detalhes</th>
                <th>Data e Hora</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `
                <tr>
                  <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 30px;">Nenhuma ação de auditoria registrada ainda.</td>
                </tr>
              ` : logs.map(l => {
                return `
                  <tr>
                    <td style="font-weight: 700;">${l.adminName} (${l.adminUsername})</td>
                    <td style="color: var(--primary); font-weight: 700;">${l.action}</td>
                    <td>${l.targetItem}</td>
                    <td>${formatDate(l.timestamp)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  `;

  // Restaurar foco e seleção nos inputs de busca
  const activeId = document.activeElement ? document.activeElement.id : null;
  if (activeId) {
    const activeEl = document.getElementById(activeId);
    if (activeEl) {
      activeEl.focus();
      const valLength = activeEl.value ? activeEl.value.length : 0;
      activeEl.setSelectionRange(valLength, valLength);
    }
  }

  safeCreateIcons();
}

function getUserVotesCount(username) {
  try {
    const polls = DB.get('polls', SEED_POLLS);
    let count = 0;
    polls.forEach(poll => {
      if (poll.votedUsers && poll.votedUsers[username] !== undefined) {
        count++;
      }
    });
    return count;
  } catch (err) {
    console.error("getUserVotesCount Error:", err);
    return 0;
  }
}

function generateActivationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function openPreRegisterModal() {
  const modalDiv = document.createElement('div');
  modalDiv.id = 'pre-register-modal-container';
  modalDiv.className = 'modal-overlay active';
  modalDiv.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title"><i data-lucide="user-plus"></i> Pré-Cadastrar Aluno</h3>
        <button class="close-modal-btn" onclick="closePreRegisterModal()">&times;</button>
      </div>
      <form onsubmit="handlePreRegisterSubmit(event)">
        <div class="form-group">
          <label for="pre-matricula">Matrícula</label>
          <div class="input-wrapper">
            <i data-lucide="hash"></i>
            <input type="text" id="pre-matricula" placeholder="Ex: 2026006" required autofocus>
          </div>
        </div>

        <div class="form-group">
          <label for="pre-name">Nome Completo</label>
          <div class="input-wrapper">
            <i data-lucide="user"></i>
            <input type="text" id="pre-name" placeholder="Ex: João da Silva Santos" required>
          </div>
        </div>

        <div class="form-group">
          <label for="pre-class">Turma</label>
          <div class="input-wrapper">
            <i data-lucide="graduation-cap" style="left: 16px;"></i>
            <select id="pre-class" required>
              ${TURMAS_OPTIONS_HTML}
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closePreRegisterModal()">Cancelar</button>
          <button type="submit" class="btn">Pré-Cadastrar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modalDiv);
  safeCreateIcons();
}

function closePreRegisterModal() {
  const modal = document.getElementById('pre-register-modal-container');
  if (modal) modal.remove();
}

function handlePreRegisterSubmit(e) {
  e.preventDefault();
  const matricula = document.getElementById('pre-matricula').value.trim();
  const nome = document.getElementById('pre-name').value.trim();
  const turma = document.getElementById('pre-class').value;

  if (!matricula || !nome || !turma) {
    showToast('Todos os campos são obrigatórios.', 'error');
    return;
  }

  const preRegistered = DB.get('pre_registered', SEED_PRE_REGISTERED);

  if (preRegistered.some(p => p.matricula.toLowerCase() === matricula.toLowerCase())) {
    showToast('Esta matrícula já está pré-cadastrada.', 'error');
    return;
  }

  const code = generateActivationCode();
  const newPre = {
    matricula,
    nome,
    turma,
    codigoAtivacao: code,
    codigoStatus: 'pendente'
  };

  preRegistered.push(newPre);
  DB.set('pre_registered', preRegistered);

  logAuditAction('Pré-cadastrou aluno', `Matrícula: ${matricula}, Nome: ${nome}, Código: ${code}`);

  showToast(`Aluno pré-cadastrado! Código gerado: ${code}`, 'success');
  closePreRegisterModal();
  renderCadastroManager();
}

function openBulkPreRegisterModal() {
  const modalDiv = document.createElement('div');
  modalDiv.id = 'bulk-register-modal-container';
  modalDiv.className = 'modal-overlay active';
  modalDiv.innerHTML = `
    <div class="modal-card" style="max-width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title"><i data-lucide="file-spreadsheet"></i> Pré-Cadastro em Lote</h3>
        <button class="close-modal-btn" onclick="closeBulkPreRegisterModal()">&times;</button>
      </div>
      <form onsubmit="handleBulkPreRegisterSubmit(event)">
        <div class="form-group">
          <label for="bulk-class">Turma dos Alunos</label>
          <div class="input-wrapper">
            <i data-lucide="graduation-cap" style="left: 16px;"></i>
            <select id="bulk-class" required>
              ${TURMAS_OPTIONS_HTML}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="bulk-data">Lista de Alunos (Formato: MATRÍCULA;NOME COMPLETO)</label>
          <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">Insira um aluno por linha. Exemplo:<br><code style="font-family: monospace;">2026101;Maria Souza<br>2026102;Pedro Alves</code></p>
          <textarea id="bulk-data" placeholder="Insira a lista aqui..." required style="min-height: 150px; font-family: monospace; font-size: 12px;"></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeBulkPreRegisterModal()">Cancelar</button>
          <button type="submit" class="btn">Processar e Gerar Códigos</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modalDiv);
  safeCreateIcons();
}

function closeBulkPreRegisterModal() {
  const modal = document.getElementById('bulk-register-modal-container');
  if (modal) modal.remove();
}

function handleBulkPreRegisterSubmit(e) {
  e.preventDefault();
  const turma = document.getElementById('bulk-class').value;
  const rawText = document.getElementById('bulk-data').value.trim();

  if (!turma || !rawText) {
    showToast('Preencha a turma e insira a lista de alunos.', 'error');
    return;
  }

  const lines = rawText.split('\n');
  const preRegistered = DB.get('pre_registered', SEED_PRE_REGISTERED);
  let addedCount = 0;
  let skippedCount = 0;
  const generatedEntries = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(';');
    if (parts.length < 2) {
      skippedCount++;
      continue;
    }

    const matricula = parts[0].trim();
    const nome = parts[1].trim();

    if (!matricula || !nome) {
      skippedCount++;
      continue;
    }

    if (preRegistered.some(p => p.matricula.toLowerCase() === matricula.toLowerCase())) {
      skippedCount++;
      continue;
    }

    const code = generateActivationCode();
    const newEntry = {
      matricula,
      nome,
      turma,
      codigoAtivacao: code,
      codigoStatus: 'pendente'
    };

    preRegistered.push(newEntry);
    generatedEntries.push(`Matrícula: ${matricula} (${code})`);
    addedCount++;
  }

  if (addedCount > 0) {
    DB.set('pre_registered', preRegistered);
    logAuditAction('Pré-cadastrou em lote', `${addedCount} alunos na turma ${turma}: ${generatedEntries.slice(0, 5).join(', ')}${generatedEntries.length > 5 ? '...' : ''}`);
    showToast(`${addedCount} alunos cadastrados com sucesso! ${skippedCount} linhas ignoradas/duplicadas.`, 'success');
  } else {
    showToast('Nenhum aluno foi cadastrado. Verifique a formatação ou se já existem.', 'error');
  }

  closeBulkPreRegisterModal();
  renderCadastroManager();
}

function toggleUserBlockStatus(username) {
  try {
    const users = DB.get('users', SEED_USERS);
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      const isBlocked = user.status === 'bloqueado';
      user.status = isBlocked ? 'ativo' : 'bloqueado';
      DB.set('users', users);
      
      const action = isBlocked ? 'Desbloqueou conta' : 'Bloqueou conta';
      logAuditAction(action, `Usuário: ${user.name} (${username})`);
      showToast(`Conta de ${user.name} foi ${isBlocked ? 'desbloqueada' : 'bloqueada'} com sucesso.`);
      renderCadastroManager();
    }
  } catch (err) {
    console.error("toggleUserBlockStatus Error:", err);
  }
}

function changeUserRole(username, newType) {
  try {
    const users = DB.get('users', SEED_USERS);
    const userIdx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (userIdx === -1) {
      showToast('Usuário não encontrado.', 'error');
      return;
    }

    const user = users[userIdx];
    const oldType = user.tipo_usuario || (user.role === 'admin' ? 'administrador' : 'aluno');

    if (oldType === newType) return; // Nenhuma alteração real

    if (oldType === 'administrador') {
      showToast('Não é permitido alterar o cargo de um administrador de sistema.', 'error');
      if (currentView === 'cadastro_manager') renderCadastroManager();
      else if (currentView === 'admin') renderAdmin();
      return;
    }

    const labelMap = {
      'aluno': 'Aluno',
      'professor': 'Professor',
      'funcionario': 'Funcionário',
      'administrador': 'Administrador'
    };
    const oldTypeLabel = labelMap[oldType] || 'Aluno';
    const newTypeLabel = labelMap[newType] || 'Aluno';

    if (!confirm(`Tem certeza que deseja alterar o cargo deste usuário?\nDe: ${oldTypeLabel} -> Para: ${newTypeLabel}`)) {
      // Re-renderiza para desfazer a alteração visual no seletor do DOM
      if (currentView === 'cadastro_manager') renderCadastroManager();
      else if (currentView === 'admin') renderAdmin();
      return;
    }

    user.tipo_usuario = newType;
    user.role = 'aluno'; // Todos os novos tipos não-admins têm role 'aluno'

    if (newType === 'professor' || newType === 'funcionario') {
      user.turma = 'Não sou aluno';
    } else if (newType === 'aluno' && user.turma === 'Não sou aluno') {
      user.turma = '';
    }

    // Se o usuário promovido/rebaixado for o usuário da sessão atual, atualiza a sessão
    if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
      currentUser.tipo_usuario = newType;
      currentUser.role = 'aluno';
      currentUser.turma = user.turma;
      localStorage.setItem('inovando_session', JSON.stringify(currentUser));
    }

    DB.set('users', users);
    logAuditAction('Alterou cargo de usuário', `Usuário: ${user.name} (${user.username}) | Cargo antigo: ${oldTypeLabel} -> Novo: ${newTypeLabel}`);
    showToast(`Cargo de ${user.name} alterado para ${newTypeLabel}!`);

    // Recarrega a visualização atual
    if (currentView === 'cadastro_manager') {
      renderCadastroManager();
    } else if (currentView === 'admin') {
      renderAdmin();
    } else {
      renderApp();
    }
  } catch (err) {
    console.error("changeUserRole Error:", err);
    showToast('Erro ao alterar cargo do usuário.', 'error');
    if (currentView === 'cadastro_manager') renderCadastroManager();
    else if (currentView === 'admin') renderAdmin();
  }
}

function openResetPasswordModal(username, name) {
  const modalDiv = document.createElement('div');
  modalDiv.id = 'reset-password-modal-container';
  modalDiv.className = 'modal-overlay active';
  modalDiv.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title"><i data-lucide="key-round"></i> Redefinir Senha</h3>
        <button class="close-modal-btn" onclick="closeResetPasswordModal()">&times;</button>
      </div>
      <form onsubmit="handleResetPasswordSubmit(event, '${username}')">
        <div style="margin-bottom: 20px;">
          <p style="font-size: 14px; color: var(--text-secondary);">Redefinindo a senha de acesso para:</p>
          <p style="font-weight: 700; font-size: 16px; margin-top: 5px;">${name} (Matrícula/Login: ${username})</p>
        </div>

        <div class="form-group">
          <label for="reset-new-password">Nova Senha</label>
          <div class="input-wrapper">
            <i data-lucide="lock"></i>
            <input type="password" id="reset-new-password" placeholder="Digite a nova senha provisória" required autofocus>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeResetPasswordModal()">Cancelar</button>
          <button type="submit" class="btn">Redefinir Senha</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modalDiv);
  safeCreateIcons();
}

function closeResetPasswordModal() {
  const modal = document.getElementById('reset-password-modal-container');
  if (modal) modal.remove();
}

function handleResetPasswordSubmit(e, username) {
  e.preventDefault();
  const newPassword = document.getElementById('reset-new-password').value;

  if (!newPassword) {
    showToast('A senha não pode ser vazia.', 'error');
    return;
  }

  const users = DB.get('users', SEED_USERS);
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (user) {
    const hashedPassword = typeof sha256 !== 'undefined' ? sha256(newPassword) : newPassword;
    user.password = hashedPassword;
    DB.set('users', users);

    logAuditAction('Redefiniu senha', `Usuário: ${user.name} (${username})`);
    showToast(`Senha de ${user.name} redefinida com sucesso!`, 'success');
    closeResetPasswordModal();
    renderCadastroManager();
  } else {
    showToast('Usuário não encontrado.', 'error');
  }
}

function regenerateActivationCode(matricula) {
  try {
    const preRegistered = DB.get('pre_registered', SEED_PRE_REGISTERED);
    const item = preRegistered.find(p => p.matricula.toLowerCase() === matricula.toLowerCase());
    if (item) {
      if (item.codigoStatus !== 'pendente') {
        showToast('Não é possível regenerar o código de uma conta já ativada.', 'error');
        return;
      }

      const oldCode = item.codigoAtivacao;
      const newCode = generateActivationCode();
      item.codigoAtivacao = newCode;
      DB.set('pre_registered', preRegistered);

      logAuditAction('Regenerou código de ativação', `Aluno: ${item.nome} (${matricula}), Novo Código: ${newCode} (Antigo: ${oldCode})`);
      showToast(`Código de ativação regenerado: ${newCode}`, 'success');
      renderCadastroManager();
    }
  } catch (err) {
    console.error("regenerateActivationCode Error:", err);
  }
}

function deactivateAllUnusedCodes() {
  try {
    if (!confirm('Deseja desativar todos os códigos de ativação ainda pendentes? Alunos com estes códigos não conseguirão se cadastrar até que um novo código seja regenerado.')) {
      return;
    }

    const preRegistered = DB.get('pre_registered', SEED_PRE_REGISTERED);
    let count = 0;
    preRegistered.forEach(p => {
      if (p.codigoStatus === 'pendente') {
        p.codigoStatus = 'expirado';
        count++;
      }
    });

    if (count > 0) {
      DB.set('pre_registered', preRegistered);
      logAuditAction('Desativou códigos pendentes em lote', `${count} códigos de ativação foram marcados como expirados.`);
      showToast(`${count} códigos de ativação pendentes foram desativados.`, 'success');
      renderCadastroManager();
    } else {
      showToast('Nenhum código pendente para desativar.', 'info');
    }
  } catch (err) {
    console.error("deactivateAllUnusedCodes Error:", err);
  }
}

// --- CONFIGURAÇÃO INICIAL ---
window.addEventListener('DOMContentLoaded', () => {
  renderApp();
  
  window.addEventListener('click', (e) => {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
      if (e.target === overlay) {
        if (overlay.id === 'poll-modal') {
          // Do not close poll modal automatically on clicking outside
          return;
        }
        overlay.classList.remove('active');
      }
    });
  });

  window.addEventListener('online', () => {
    console.log("Navegador Online. Conectando ao banco central...");
    if (firebaseURL) {
      initFirebase();
    }
  });

  window.addEventListener('offline', () => {
    console.log("Navegador Offline. Operando em modo local.");
    firebaseEnabled = false;
    firebaseConnState = 'offline';
    showToast("Você está desconectado da internet. Operando no modo local.", "info");
    renderApp();
  });
});