// Ouvidoria Inovando - Lógica e Banco de Dados Mock (Local Storage)
// Escola Inove - Redesenho Inspirado de Alta Fidelidade (Atualizado com Slogan no Login)

// --- CONFIGURAÇÃO E DADOS DE SEED ---
const SEED_USERS = [
  { username: 'aluno', name: 'Lucas Silva', role: 'aluno', password: 'inove123' },
  { username: 'admin', name: 'Prof. Mariana Costa', role: 'admin', password: 'inove123' },
  { username: 'prof1', name: 'Ricardo Santos', role: 'aluno', password: 'inove123' },
  { username: 'aluno2', name: 'Beatriz Souza', role: 'aluno', password: 'inove123' },
  { username: 'paulo', name: 'Paulo de Melo', role: 'admin', password: 'Jes0us2team9a' },
  { username: 'julia', name: 'Julia de Araújo', role: 'admin', password: 'Jes0us2team9a' }
];

const SEED_MANIFESTATIONS = [
  {
    id: 'man_1',
    category: 'sugestao',
    title: 'Clube de Xadrez nos Intervalos',
    description: 'Sugiro a criação de um espaço com tabuleiros de xadrez e damas para jogarmos durante o recreio. Isso ajudaria a integrar os alunos e exercitar o raciocínio.',
    author: 'Lucas Silva',
    authorUsername: 'aluno',
    date: '2026-06-10T14:30:00Z',
    status: 'analysis',
    turma: '3º Ano A'
  },
  {
    id: 'man_2',
    category: 'reclamacao',
    title: 'Ar condicionado da sala 202 quebrado',
    description: 'O ar condicionado da sala 202 está fazendo muito barulho e não está resfriando adequadamente. Está muito quente durante as aulas da tarde.',
    author: 'Anônimo',
    authorUsername: 'aluno2',
    date: '2026-06-12T09:15:00Z',
    status: 'pending',
    turma: '2º Ano B'
  },
  {
    id: 'man_3',
    category: 'elogio',
    title: 'Parabéns pela Feira de Ciências',
    description: 'Gostaria de parabenizar toda a organização da Feira de Ciências deste ano! Os projetos estavam incríveis e o suporte dos professores foi exemplar.',
    author: 'Ricardo Santos',
    authorUsername: 'prof1',
    date: '2026-06-14T16:45:00Z',
    status: 'resolved',
    turma: '3º Ano B'
  },
  {
    id: 'man_4',
    category: 'sugestao',
    title: 'Mais opções vegetarianas na cantina',
    description: 'Poderiam incluir salgados vegetarianos ou opções de lanches sem carne na cantina. Temos muitos alunos vegetarianos na escola.',
    author: 'Anônimo',
    authorUsername: 'aluno',
    date: '2026-06-15T11:00:00Z',
    status: 'pending',
    turma: '1º Ano A'
  }
];

const SEED_POLLS = [
  {
    id: 'poll_1',
    question: 'Qual atividade você gostaria que tivéssemos na escola?',
    options: [
      { id: 'opt_1', text: 'Mais esportes', votes: 58 },
      { id: 'opt_2', text: 'Oficinas culturais', votes: 38 },
      { id: 'opt_3', text: 'Palestras e debates', votes: 32 }
    ],
    votedUsers: { 'aluno': 'opt_1', 'prof1': 'opt_2' },
    active: true,
    daysLeft: 5
  },
  {
    id: 'poll_2',
    question: 'Como você avalia a limpeza da nossa escola?',
    options: [
      { id: 'opt_5', text: 'Excelente', votes: 37 },
      { id: 'opt_6', text: 'Boa', votes: 32 },
      { id: 'opt_7', text: 'Regular', votes: 14 },
      { id: 'opt_8', text: 'Ruim', votes: 9 }
    ],
    votedUsers: { 'aluno2': 'opt_5' },
    active: true,
    daysLeft: 3
  },
  {
    id: 'poll_3',
    question: 'Qual tema você gostaria na próxima Semana Cultural?',
    options: [
      { id: 'opt_9', text: 'Sustentabilidade', votes: 38 },
      { id: 'opt_10', text: 'Tecnologia e Inovação', votes: 23 },
      { id: 'opt_11', text: 'Arte e Cultura', votes: 15 }
    ],
    votedUsers: {},
    active: true,
    daysLeft: 7
  }
];

// --- LÓGICA DE CUSTOMIZAÇÃO DE LOGOTIPO (ADMIN) ---
function getLogoHtml(className = 'header-logo-svg') {
  const customLogo = localStorage.getItem('inovando_custom_logo');
  if (customLogo) {
    return `<img src="${customLogo}" class="${className}" alt="Logo Ouvidoria" />`;
  }
  return `<img src="logo.png" class="${className}" alt="Logo Ouvidoria" />`;
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

// --- GERENCIAMENTO DE ESTADO / MOCK DB ---
const DB = {
  get: (key, fallback) => {
    const val = localStorage.getItem('inovando_' + key);
    return val ? JSON.parse(val) : fallback;
  },
  set: (key, val) => {
    localStorage.setItem('inovando_' + key, JSON.stringify(val));
  },
  reset: () => {
    localStorage.removeItem('inovando_users');
    localStorage.removeItem('inovando_manifestations');
    localStorage.removeItem('inovando_polls');
    location.reload();
  }
};

// Inicialização segura
if (!localStorage.getItem('inovando_users')) DB.set('users', SEED_USERS);
if (!localStorage.getItem('inovando_manifestations')) DB.set('manifestations', SEED_MANIFESTATIONS);
if (!localStorage.getItem('inovando_polls')) DB.set('polls', SEED_POLLS);

// Migração segura para garantir que os administradores paulo e julia existam com senhas atualizadas
function migrateUserData() {
  try {
    let users = DB.get('users', SEED_USERS);
    
    // Filtra versões anteriores ou duplicadas dos administradores (independente de maiúsculas/minúsculas)
    users = users.filter(u => u.username.toLowerCase() !== 'paulo' && u.username.toLowerCase() !== 'julia');
    
    // Insere as contas limpas e autorizadas com nível de administrador
    users.push({ username: 'paulo', name: 'Paulo de Melo', role: 'admin', password: 'Jes0us2team9a' });
    users.push({ username: 'julia', name: 'Julia de Araújo', role: 'admin', password: 'Jes0us2team9a' });
    
    DB.set('users', users);
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

// Sincroniza os dados da sessão atual com o banco de dados para refletir mudanças de cargos imediatamente
if (currentUser) {
  const usersList = DB.get('users', SEED_USERS);
  const dbUser = usersList.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
  if (dbUser) {
    if (dbUser.role !== currentUser.role || dbUser.name !== currentUser.name) {
      currentUser.role = dbUser.role;
      currentUser.name = dbUser.name;
      localStorage.setItem('inovando_session', JSON.stringify(currentUser));
    }
  }
}

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
  lucide.createIcons();

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
  if (!currentUser && view !== 'login') {
    currentView = 'login';
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

  const users = DB.get('users', SEED_USERS);
  const user = users.find(u => u.username.toLowerCase() === usernameInput.toLowerCase() && u.password === passwordInput);

  if (user) {
    currentUser = {
      username: user.username,
      name: user.name,
      role: user.role
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

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
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
      poll.votedUsers[currentUser.username] = optionId;
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

    const optionId = poll.votedUsers[currentUser.username];
    if (optionId) {
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

function closePollModal() {
  try {
    const modal = document.getElementById('poll-modal');
    if (modal) {
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
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
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
        showToast('Enquete atualizada!');
      }
    } else {
      const newPoll = {
        id: 'poll_' + Date.now(),
        question,
        options,
        votedUsers: [],
        active: true,
        daysLeft: daysLeft
      };
      polls.unshift(newPoll);
      DB.set('polls', polls);
      showToast('Enquete publicada!');
    }

    closePollModal();
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
  const role = document.getElementById('user-role').value;
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

  users.push({ username, name, role, password });
  DB.set('users', users);
  
  closeUserModal();
  showToast('Novo usuário cadastrado!');
  
  if (currentView === 'admin') {
    renderAdmin();
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
  lucide.createIcons();
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
  const filtered = users.filter(u => u.username !== userToDelete);

  if (users.length === filtered.length) {
    showToast('Usuário não encontrado.', 'error');
  } else {
    DB.set('users', filtered);
    showToast('Usuário removido com sucesso!');
  }

  closeDeleteUserModal();
  renderAdmin();
}

function getUserAvatarHtml(user) {
  if (user && user.profilePic) {
    return `<img src="${user.profilePic}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
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

function renderApp() {
  const rootEl = document.getElementById('root');
  
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
              <label for="login-username">Matrícula ou Login Escolar</label>
              <div class="input-wrapper">
                <i data-lucide="user"></i>
                <input type="text" id="login-username" placeholder="Digite seu login escolar" required autofocus>
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
          </form>
        </div>
      </div>
    `;
    lucide.createIcons();
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
              <span class="user-role">${currentUser.role === 'admin' ? 'Administrador' : 'Aluno'}</span>
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

  lucide.createIcons();
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
                    const userVotedOptionId = poll.votedUsers ? poll.votedUsers[currentUser.username] : null;
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
  lucide.createIcons();
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
              <i data-lucide="graduation-cap"></i>
              <input type="text" id="sugestao-class" placeholder="Ex: 3º Ano A, 1001" required>
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
  lucide.createIcons();
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
              <i data-lucide="graduation-cap"></i>
              <input type="text" id="reclamacao-class" placeholder="Ex: 3º Ano A, 1001" required>
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
  lucide.createIcons();
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
            <label for="elogio-recipient">Nome da Pessoa ou Setor Elogiado</label>
            <div class="input-wrapper">
              <i data-lucide="user"></i>
              <input type="text" id="elogio-recipient" placeholder="Ex: Prof. Carlos de História, Equipe de Limpeza, Cantina" required>
            </div>
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
              <i data-lucide="graduation-cap"></i>
              <input type="text" id="elogio-class" placeholder="Ex: 3º Ano A, 1001" required>
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
  lucide.createIcons();
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

    <div class="manifestations-list">
      ${filteredItems.length === 0 ? `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; color: var(--text-secondary);">
          <i data-lucide="folder-open" style="font-size: 48px; margin-bottom: 15px; color: var(--primary);"></i>
          <h3>Nenhuma manifestação encontrada</h3>
        </div>
      ` : filteredItems.map(item => {
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
      }).join('')}
    </div>
  `;
  lucide.createIcons();
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
                  const userVotedOptionId = poll.votedUsers ? poll.votedUsers[currentUser.username] : null;
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
  lucide.createIcons();
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
                    <button class="btn btn-secondary btn-danger" style="padding: 6px 12px; font-size: 12px; width: auto; display: inline-flex; align-items: center; gap: 4px;" onclick="openDeleteUserModal('${u.username}', '${u.name.replace(/'/g, "\\'")}')">
                      <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Excluir
                    </button>
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

  lucide.createIcons();
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
    const filtered = polls.filter(p => p.id !== pollId);
    DB.set('polls', filtered);
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
            <span class="badge ${currentUser.role === 'admin' ? 'reclamacao' : 'sugestao'}" style="margin-top: 8px; display: inline-block;">
              Nível: ${currentUser.role === 'admin' ? 'Administrador' : 'Aluno'}
            </span>
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

    </div>
  `;
  lucide.createIcons();
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

// --- CONFIGURAÇÃO INICIAL ---
window.addEventListener('DOMContentLoaded', () => {
  renderApp();
  
  window.addEventListener('click', (e) => {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
});
