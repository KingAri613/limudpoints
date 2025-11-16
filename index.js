/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const STORAGE_KEY = 'limudPointsData';
let currentUser = null;
let currentStudent = null;
let currentParent = null;
let currentClassId = null;
let classes = [];
let students = {};
let rewards = {};
let powerups = {};
let pointsHistory = {};
let reasons = {};
let embeds = {};
let users = {};
let bulkMode = false;
let selectedStudents = new Set();
let bulkAction = '';
let currentStudentId = '';
let currentRewardId = '';
let currentPowerUpId = '';
let currentReasonIndex = '';
let currentView = 'grid';
let currentUsernameToEdit = '';
let emojiPickerTarget = null;
let demoMode = false;
let historyCalendarDate = new Date();

let listViewSizeLevel = 0;
const LIST_VIEW_SIZE_MIN = -2;
const LIST_VIEW_SIZE_MAX = 2;
const sizeLevelMap = {
    "-2": "Smallest",
    "-1": "Small",
    "0": "Normal",
    "1": "Large",
    "2": "Largest"
};

const EMOJI_MAP = {
    '😀': ['grinning', 'face', 'smile', 'happy'],
    '😂': ['face', 'joy', 'tears', 'laugh'],
    '😍': ['heart', 'eyes', 'love', 'smile'],
    '🥳': ['partying', 'face', 'hat', 'horn'],
    '👍': ['thumbs', 'up', 'plus', 'one', 'like'],
    '🙏': ['folded', 'hands', 'please', 'thank you', 'pray'],
    '🚀': ['rocket', 'space', 'launch', 'fast'],
    '⭐': ['star', 'gold', 'award'],
    '🏆': ['trophy', 'gold', 'winner', 'prize'],
    '🥇': ['first', 'place', 'medal', 'gold'],
    '🎁': ['gift', 'present', 'box', 'birthday'],
    '🎉': ['party', 'popper', 'tada', 'celebration'],
    '💯': ['hundred', 'points', 'score', 'perfect'],
    '🔥': ['fire', 'hot', 'lit', 'popular'],
    '📚': ['books', 'study', 'library', 'reading'],
    '✏️': ['pencil', 'write', 'draw'],
    '💡': ['light', 'bulb', 'idea', 'thought'],
    '🍎': ['apple', 'fruit', 'teacher', 'school'],
    '🎯': ['target', 'bullseye', 'direct', 'hit', 'goal'],
    '✅': ['check', 'mark', 'button', 'green', 'done'],
    '✔️': ['check', 'mark', 'heavy', 'tick'],
    '➕': ['plus', 'math', 'add', 'increase'],
    '🙌': ['raising', 'hands', 'celebrate', 'hooray'],
    '👏': ['clapping', 'hands', 'applause', 'good job'],
    '💪': ['flexed', 'biceps', 'muscle', 'strong', 'power'],
    '🧠': ['brain', 'mind', 'smart', 'intelligent'],
    '👑': ['crown', 'king', 'queen', 'royal', 'leader']
};
const EMOJI_LIST = Object.keys(EMOJI_MAP);

function saveData() {
  if (demoMode) return;
  const data = {
    users,
    classes,
    students,
    rewards,
    powerups,
    history: pointsHistory,
    reasons,
    embeds,
    currentUser: currentUser ? currentUser.username : null,
    currentStudent: currentStudent ? { studentId: currentStudent.id, classId: currentStudent.classId } : null,
    currentParent: currentParent ? { studentId: currentParent.id, classId: currentParent.classId } : null,
    currentClassId
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  try {
    const dataString = localStorage.getItem(STORAGE_KEY);
    if (!dataString) return;
    const data = JSON.parse(dataString);
    if (data) {
      users = data.users || {};
      classes = data.classes || [];
      students = data.students || {};
      rewards = data.rewards || {};
      powerups = data.powerups || {};
      pointsHistory = data.history || {};
      reasons = data.reasons || {};
      embeds = data.embeds || {};
      currentClassId = data.currentClassId;
      
      if (data.currentUser && users[data.currentUser]) {
        currentUser = users[data.currentUser];
      }
      if (data.currentStudent) {
          const { studentId, classId } = data.currentStudent;
          if (students[classId] && students[classId][studentId]) {
              currentStudent = { ...students[classId][studentId], classId };
          }
      }
       if (data.currentParent) {
          const { studentId, classId } = data.currentParent;
          if (students[classId] && students[classId][studentId]) {
              currentParent = { ...students[classId][studentId], classId };
          }
      }
    }
  } catch (error) {
    console.error("Failed to load data from localStorage", error);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function sanitizeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = 'notification show ' + type;
  setTimeout(() => {
    notification.classList.remove('show');
  }, 5000);
}

window.openModal = (modalId) => {
  document.getElementById(modalId)?.classList.add('active');
}

window.closeModal = (modalId) => {
  document.getElementById(modalId)?.classList.remove('active');
}

window.openAboutModal = () => {
    window.openModal('aboutModal');
}

window.toggleSidebar = () => {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
  document.getElementById('sidebarOverlay')?.classList.toggle('active');
}

window.toggleSidebarCollapse = () => {
  document.getElementById('sidebar')?.classList.toggle('collapsed');
  document.getElementById('mainContent')?.classList.toggle('collapsed');
}

window.showLogin = () => {
  document.getElementById('signupScreen').style.display = 'none';
  document.getElementById('studentLoginScreen').style.display = 'none';
  document.getElementById('parentLoginScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

window.showSignup = () => {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('studentLoginScreen').style.display = 'none';
  document.getElementById('parentLoginScreen').style.display = 'none';
  document.getElementById('signupScreen').style.display = 'flex';
}

window.showStudentLogin = () => {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('signupScreen').style.display = 'none';
    document.getElementById('parentLoginScreen').style.display = 'none';
    document.getElementById('studentLoginScreen').style.display = 'flex';
}

window.showParentLogin = () => {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('signupScreen').style.display = 'none';
    document.getElementById('studentLoginScreen').style.display = 'none';
    document.getElementById('parentLoginScreen').style.display = 'flex';
}

window.selectAccountType = (type) => {
  document.querySelectorAll('.account-type-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.account-type-btn[data-type="${type}"]`)?.classList.add('active');
}

function signup() {
  const type = document.querySelector('.account-type-btn.active').dataset.type;
  const username = document.getElementById('signupUsername').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const confirmPassword = document.getElementById('signupConfirmPassword').value.trim();
  const school = document.getElementById('signupSchool').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const photoFile = document.getElementById('signupPhoto').files?.[0];
  const error = document.getElementById('signupError');
  const success = document.getElementById('signupSuccess');
  error.style.display = 'none';
  success.style.display = 'none';

  if (!username || !password || !school || !email) {
    error.textContent = 'Please fill in all required fields';
    error.style.display = 'block';
    return;
  }
  if (password !== confirmPassword) {
    error.textContent = 'Passwords do not match';
    error.style.display = 'block';
    return;
  }
  if (users[username]) {
    error.textContent = 'Username already exists';
    error.style.display = 'block';
    return;
  }
  if (Object.values(users).some((u) => u.email === email)) {
    error.textContent = 'Email address is already in use';
    error.style.display = 'block';
    return;
  }

  const newUser = {username, password, type, school, email, createdAt: new Date().toISOString(), settings: { allowStudentPins: true, allowParentPins: true }};

  const finalizeSignup = () => {
      users[username] = newUser;
      if (!embeds[school]) {
        embeds[school] = [
          { id: generateId(), name: 'Wheel of Names', url: 'https://wheelofnames.com/' },
          { id: generateId(), name: 'Online Notepad', url: 'https://www.onlinenotepad.io/' },
          { id: generateId(), name: 'Gynzy Teacher Tools', url: 'https://teacher.gynzy.com/' },
          { id: generateId(), name: 'Classroom Seating Plan', url: 'https://thinklit.co.uk/classroom-seating-plan-generator/' }
        ];
      }
      saveData();
      success.textContent = 'Account created! Please sign in.';
      success.style.display = 'block';
      setTimeout(window.showLogin, 2000);
  };
  
  if (photoFile) {
    const reader = new FileReader();
    reader.onload = (e) => {
        newUser.photo = e.target?.result;
        finalizeSignup();
    };
    reader.readAsDataURL(photoFile);
  } else {
    finalizeSignup();
  }
}

function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const error = document.getElementById('loginError');
  error.style.display = 'none';
  if (!users[username] || users[username].password !== password) {
    error.textContent = 'Invalid username or password';
    error.style.display = 'block';
    return;
  }
  currentUser = users[username];
  currentStudent = null;
  currentParent = null;
  saveData();
  initializeApp();
}

function loginWithPIN() {
    const pin = document.getElementById('studentPin').value.trim().toUpperCase();
    const error = document.getElementById('studentLoginError');
    error.style.display = 'none';

    if (!/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(pin)) {
        error.textContent = 'Please enter a valid PIN in the format XXX-XXX.';
        error.style.display = 'block';
        return;
    }

    let foundStudent = null;
    let foundClassId = null;

    for (const classId in students) {
        for (const studentId in students[classId]) {
            if (students[classId][studentId].pin === pin) {
                foundStudent = students[classId][studentId];
                foundClassId = classId;
                break;
            }
        }
        if (foundStudent) break;
    }

    if (foundStudent && foundClassId) {
        currentStudent = { ...foundStudent, classId: foundClassId };
        currentUser = null;
        currentParent = null;
        saveData();
        initializeAppStudent();
    } else {
        error.textContent = 'Invalid PIN. Please try again.';
        error.style.display = 'block';
    }
}

function loginWithParentPIN() {
    const pin = document.getElementById('parentPin').value.trim().toUpperCase();
    const error = document.getElementById('parentLoginError');
    error.style.display = 'none';

    if (!/^P-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(pin)) {
        error.textContent = 'Please enter a valid PIN in the format P-XXX-XXX.';
        error.style.display = 'block';
        return;
    }

    let foundStudent = null;
    let foundClassId = null;

    for (const classId in students) {
        for (const studentId in students[classId]) {
            if (students[classId][studentId].parentPin === pin) {
                foundStudent = students[classId][studentId];
                foundClassId = classId;
                break;
            }
        }
        if (foundStudent) break;
    }

    if (foundStudent && foundClassId) {
        currentParent = { ...foundStudent, classId: foundClassId };
        currentUser = null;
        currentStudent = null;
        saveData();
        initializeAppParent();
    } else {
        error.textContent = 'Invalid PIN. Please try again.';
        error.style.display = 'block';
    }
}

window.logout = () => {
  if (demoMode) {
    // In demo mode, simply reload the page to exit without saving demo data.
    window.location.reload();
    return;
  }
  currentUser = null;
  currentStudent = null;
  currentParent = null;
  currentClassId = null;
  saveData(); // Save the logged-out state.
  window.location.hash = '';
  document.getElementById('appLayout')?.classList.remove('active');
  document.getElementById('studentPortalLayout')?.classList.remove('active');
  document.getElementById('parentPortalLayout')?.classList.remove('active');
  window.showLogin();
}

function initializeApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appLayout')?.classList.add('active');
  if (!currentUser) return;
  document.getElementById('sidebarUsername').textContent = currentUser.username;
  document.getElementById('sidebarSchool').textContent = currentUser.school;

  const avatarDiv = document.getElementById('sidebarUserAvatar');
  if (currentUser.photo) {
      avatarDiv.innerHTML = `<img src="${currentUser.photo}" alt="Profile Picture"/>`;
  } else {
      avatarDiv.innerHTML = currentUser.username.charAt(0).toUpperCase();
  }
  
  if(currentUser.settings?.offlineMode) {
      window.setupOfflineMode(true);
  }
  updateNavItems();
  router(); 
}

function initializeAppStudent() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('studentLoginScreen').style.display = 'none';
    document.getElementById('appLayout')?.classList.remove('active');
    document.getElementById('studentPortalLayout')?.classList.add('active');
    if (!currentStudent) return;
    document.getElementById('studentPortalName').textContent = currentStudent.name;
    document.getElementById('studentPortalPoints').textContent = `${currentStudent.points} pts`;
    currentClassId = currentStudent.classId;
    window.switchPortalView({ currentTarget: document.querySelector('#studentPortalTabs .modal-tab[data-view="leaderboard"]') });
}

function initializeAppParent() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('parentLoginScreen').style.display = 'none';
    document.getElementById('appLayout')?.classList.remove('active');
    document.getElementById('parentPortalLayout')?.classList.add('active');
    if (!currentParent) return;
    document.getElementById('parentPortalName').textContent = `Parent of ${currentParent.name}`;
    document.getElementById('parentPortalPoints').textContent = `${currentParent.points} pts`;
    currentClassId = currentParent.classId;
    const container = document.getElementById('parentPortalContent');
    container.innerHTML = '';
    const historyData = pointsHistory[currentClassId] || [];
    const studentHistory = historyData.filter(item => item.studentId === currentParent.id);
    renderHistoryView(studentHistory, container);
}

window.switchPortalView = (event) => {
    const targetView = (event.currentTarget).dataset.view;
    document.querySelectorAll('#studentPortalTabs .modal-tab').forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const contentArea = document.getElementById('studentPortalContent');
    contentArea.innerHTML = '';

    if (targetView === 'leaderboard') {
        contentArea.appendChild(renderLeaderboard());
    } else if (targetView === 'history') {
        const historyData = pointsHistory[currentClassId] || [];
        const studentHistory = historyData.filter(item => item.studentId === currentStudent.id);
        renderHistoryView(studentHistory, contentArea);
    }
}

// Router
function router() {
    if (!currentUser) return;
    const hash = window.location.hash.substring(2) || ''; // Remove #/
    let defaultView;

    if (currentUser.type === 'admin') {
        defaultView = 'admin-classes';
        document.getElementById('classSelector').style.display = 'none';
        document.querySelector('.topbar-right .btn-primary').style.display = 'none';
        document.querySelector('.topbar-left .btn-success').style.display = 'none';
    } else {
        defaultView = 'students';
        document.getElementById('classSelector').style.display = 'block';
        document.querySelector('.topbar-right .btn-primary').style.display = 'block';
        document.querySelector('.topbar-left .btn-success').style.display = 'block';
        updateClassSelector();
    }
    
    switchView(hash || defaultView);
}

function closeMobileSidebar() {
    if (window.innerWidth <= 1024 && document.getElementById('sidebar')?.classList.contains('mobile-open')) {
        window.toggleSidebar();
    }
}

function updateNavItems() {
  if (!currentUser) return;
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';

  if (currentUser.type === 'admin') {
    nav.innerHTML = `
      <div class="nav-section">
        <div class="nav-section-title">Admin</div>
        <a href="#/admin-classes" class="nav-item" data-view="admin-classes" onclick="closeMobileSidebar()">📚 Classes</a>
        <a href="#/admin-users" class="nav-item" data-view="admin-users" onclick="closeMobileSidebar()">👩‍🏫 Users</a>
        <a href="#/admin-embeds" class="nav-item" data-view="admin-embeds" onclick="closeMobileSidebar()">🖥️ Embeds</a>
      </div>
      <div class="nav-section">
        <div class="nav-section-title">General</div>
        <a href="#/settings" class="nav-item" data-view="settings" onclick="closeMobileSidebar()">⚙️ Settings</a>
      </div>
    `;
  } else {
    nav.innerHTML = `
      <div class="nav-section">
        <div class="nav-section-title">Class</div>
        <a href="#/students" class="nav-item" data-view="students" onclick="closeMobileSidebar()">👥 Students</a>
        <a href="#/leaderboard" class="nav-item" data-view="leaderboard" onclick="closeMobileSidebar()">🏆 Leaderboard</a>
        <a href="#/rewards" class="nav-item" data-view="rewards" onclick="closeMobileSidebar()">🎁 Rewards</a>
        <a href="#/powerups" class="nav-item" data-view="powerups" onclick="closeMobileSidebar()">⚡ Power Ups</a>
        <a href="#/history" class="nav-item" data-view="history" onclick="closeMobileSidebar()">📜 History</a>
      </div>
      <div class="nav-section">
        <div class="nav-section-title">General</div>
        <a href="#/settings" class="nav-item" data-view="settings" onclick="closeMobileSidebar()">⚙️ Settings</a>
        <a href="#/extras" class="nav-item" data-view="extras" onclick="closeMobileSidebar()">⭐ Extras</a>
      </div>
    `;
  }
}

function switchView(view) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeNavItem = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (activeNavItem) activeNavItem.classList.add('active');

  document.querySelectorAll('.page-view').forEach(d => d.style.display = 'none');
  const title = view.split('?')[0]; // handle query params if any
  document.getElementById('pageTitle').textContent = title.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  document.getElementById('searchInput').style.display = 'none';

  const viewId = `${title}View`;
  const viewElement = document.getElementById(viewId);
  if (viewElement) {
    viewElement.style.display = 'block';
  }
  
  if (!currentUser) return;

  if (currentUser.type === 'admin') {
    if (title === 'admin-classes') renderAdminClassesView();
    else if (title === 'admin-users') renderAdminUsersView();
    else if (title === 'admin-embeds') renderAdminEmbedsView();
    else if (title === 'settings') renderSettingsView();
  } else {
    if (currentClassId) {
        if(title === 'students') renderStudentsView();
        else if(title === 'leaderboard') renderLeaderboardView();
        else if(title === 'rewards') renderRewardsView();
        else if(title === 'history') renderHistoryView(pointsHistory[currentClassId] || [], document.getElementById('historyView'));
        else if(title === 'settings') renderSettingsView();
        else if(title === 'powerups') renderPowerUpsView();
    } else if (title === 'students') {
        document.getElementById('studentsGrid').innerHTML = `
            <div class="student-card add-student-card" onclick="window.openNewClassModal()">
                <div class="add-student-icon">➕</div>
                <div>Create Your First Class</div>
            </div>`;
        document.getElementById('studentsCompact').innerHTML = '';
        document.getElementById('studentListTable').querySelector('tbody').innerHTML = '';
    }
    
    if (title === 'extras') renderExtrasView();

    if (title === 'students') {
      document.getElementById('searchInput').style.display = 'block';
      document.getElementById('pageTitle').textContent = 'Students';
    }
  }

  if (title === 'leaderboard' && currentClassId) {
    triggerConfetti();
  }
  
  window.location.hash = `/${view}`;
}

function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#1ab5f4", "#1495c7", "#ffc107", "#ffffff", "#059669"];
    let confetti = [];
    const confettiCount = 150;

    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            radius: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            speed: Math.random() * 3 + 2,
            wind: Math.random() * 2 - 1,
            opacity: 1
        });
    }

    let animationFrameId;

    function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confetti.forEach((piece, index) => {
            piece.y += piece.speed;
            piece.x += piece.wind;
            piece.rotation += piece.speed / 2;
            piece.opacity -= 0.005;

            if (piece.y > canvas.height || piece.opacity <= 0) {
                confetti.splice(index, 1);
            } else {
                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate(piece.rotation * Math.PI / 180);
                ctx.fillStyle = piece.color;
                ctx.globalAlpha = piece.opacity;
                ctx.fillRect(-piece.radius, -piece.radius / 2, piece.radius * 2, piece.radius);
                ctx.restore();
            }
        });

        if (confetti.length > 0) {
            animationFrameId = requestAnimationFrame(drawConfetti);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    drawConfetti();
    setTimeout(() => {
        cancelAnimationFrame(animationFrameId);
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 5000);
}

function updateClassSelector() {
  if (!currentUser) return;
  const selector = document.getElementById('classSelector');
  selector.innerHTML = '';
  const userClasses = classes.filter(c => c.teacherUsername === currentUser.username);
  userClasses.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls.id;
    option.textContent = cls.name;
    selector.appendChild(option);
  });
  if (userClasses.length > 0) {
    if (!currentClassId || !userClasses.some(c => c.id === currentClassId)) {
        currentClassId = userClasses[0].id;
    }
    selector.value = currentClassId;
  } else {
    currentClassId = null;
  }
  selector.onchange = () => {
    currentClassId = selector.value;
    saveData();
    switchView('students');
  };
}

window.openNewClassModal = () => {
  document.getElementById('newClassName').value = '';
  window.openModal('newClassModal');
}

window.addNewClass = () => {
  const className = document.getElementById('newClassName').value.trim();
  if (!className) {
    showNotification('Please enter class name', 'error');
    return;
  }
  if (!currentUser) return;
  const newClass = {
    id: generateId(),
    name: className,
    teacherUsername: currentUser.username
  };
  classes.push(newClass);
  currentClassId = newClass.id;
  saveData();
  updateClassSelector();
  switchView('students');
  window.closeModal('newClassModal');
  showNotification('Class created!', 'success');
}

function getPowerUpInfo(studentId) {
  if (!currentClassId || !students[currentClassId] || !students[currentClassId][studentId]) return null;
  const student = students[currentClassId][studentId];
  if (!student.powerUp) return null;
  const now = new Date();
  const end = new Date(student.powerUp.endDate);
  if (now > end) {
    delete student.powerUp;
    saveData();
    return null;
  }
  return student.powerUp;
}

function renderStudentsView() {
  if (!currentClassId) return;
  if (!students[currentClassId]) students[currentClassId] = {};
  if (!reasons[currentClassId]) reasons[currentClassId] = [];
  if (!pointsHistory[currentClassId]) pointsHistory[currentClassId] = [];
  updateReasonsList();
  const classStudents = Object.values(students[currentClassId]);
  
  const grid = document.getElementById('studentsGrid');
  const listTableBody = document.getElementById('studentListTable').querySelector('tbody');
  const compact = document.getElementById('studentsCompact');
  
  const addCardHTML = `
    <div class="student-card add-student-card" onclick="window.openAddStudentModal()">
      <div class="add-student-icon">➕</div>
      <div>Add New Student</div>
    </div>
  `;
  grid.innerHTML = addCardHTML;
  listTableBody.innerHTML = '';
  compact.innerHTML = '';

  // Grid & Compact & List Rendering
  classStudents.forEach(student => {
    const powerUpInfo = getPowerUpInfo(student.id);
    const powerUpBadge = powerUpInfo ? `<span class="power-up-badge">x${powerUpInfo.multiplier}</span>` : '';
    const selectedClass = selectedStudents.has(student.id) ? 'selected' : '';
    const avatar = student.photo ? `<img src="${student.photo}" alt="${sanitizeHTML(student.name)}"/>` : student.name.charAt(0).toUpperCase();
    const totalRewards = (student.pointsRewards || 0) + (student.instantRewards || 0);
    
    const gridItem = `
      <div class="student-card ${selectedClass}" onclick="${bulkMode ? `window.toggleStudentSelection('${student.id}')` : `window.openStudentPointsModal('${student.id}')`}">
        <div class="student-actions">
          <button class="btn btn-secondary" onclick="event.stopPropagation(); window.openEditStudentModal('${student.id}')">Edit</button>
        </div>
        <div class="student-avatar">${avatar}</div>
        <div class="student-name">${sanitizeHTML(student.name)}</div>
        <div class="student-points">${student.points} pts ${powerUpBadge}</div>
        <div class="student-rewards">${totalRewards} rewards claimed</div>
      </div>
    `;
    grid.insertAdjacentHTML('afterbegin', gridItem);

    const compactItem = `
      <div class="compact-student-item ${selectedClass}" onclick="${bulkMode ? `window.toggleStudentSelection('${student.id}')` : `window.openStudentPointsModal('${student.id}')`}">
        <div class="compact-avatar">${avatar}</div>
        <div class="compact-info"><div class="compact-name">${sanitizeHTML(student.name)}</div></div>
        <div class="compact-points">${student.points} pts ${powerUpBadge}</div>
      </div>
    `;
    compact.insertAdjacentHTML('beforeend', compactItem);

    const listItem = `
      <tr class="${selectedClass}" onclick="${bulkMode ? `window.toggleStudentSelection('${student.id}')` : `window.openStudentPointsModal('${student.id}')`}">
          <td data-label="Student"><div class="student-list-avatar-cell"><div class="student-list-avatar">${avatar}</div><span class="student-list-name">${sanitizeHTML(student.name)}</span></div></td>
          <td data-label="Points" class="student-list-points">${student.points} pts ${powerUpBadge}</td>
          <td data-label="Rewards" class="student-list-rewards">${totalRewards}</td>
          <td data-label="Actions"><div class="student-list-actions"><button class="btn btn-secondary" style="padding: 0.5rem;" onclick="event.stopPropagation(); window.openEditStudentModal('${student.id}')">Edit</button><button class="btn btn-success" style="padding: 0.5rem;" onclick="event.stopPropagation(); window.openStudentPointsModal('${student.id}')">+/-</button></div></td>
      </tr>
    `;
    listTableBody.innerHTML += listItem;
  });

  if (classStudents.length === 0) {
       listTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No students in this class yet.</td></tr>';
  }

  window.onSearchChange();
}

window.switchStudentView = (event, view) => {
  document.querySelectorAll('.view-option').forEach(opt => opt.classList.remove('active'));
  event.currentTarget.classList.add('active');
  const listControls = document.querySelector('.list-view-controls');
  const gridControls = document.querySelector('.grid-columns-selector');

  document.getElementById('studentsGrid').style.display = view === 'grid' ? 'grid' : 'none';
  document.getElementById('studentsList').style.display = view === 'list' ? 'block' : 'none';
  document.getElementById('studentsCompact').style.display = view === 'compact' ? 'grid' : 'none';
  
  listControls.style.display = view === 'list' ? 'flex' : 'none';
  gridControls.style.display = view === 'grid' ? 'flex' : 'none';

  if (view === 'list') updateListViewSize();
  currentView = view;
}

function updateListViewSize() {
    const table = document.getElementById('studentListTable');
    const display = document.getElementById('listSizeDisplay');
    const increaseBtn = document.getElementById('increaseListSizeBtn');
    const decreaseBtn = document.getElementById('decreaseListSizeBtn');

    table.dataset.sizeLevel = String(listViewSizeLevel);
    display.textContent = `View Size: ${sizeLevelMap[listViewSizeLevel]}`;
    
    increaseBtn.disabled = listViewSizeLevel >= LIST_VIEW_SIZE_MAX;
    decreaseBtn.disabled = listViewSizeLevel <= LIST_VIEW_SIZE_MIN;
}

function increaseListViewSize() {
    if (listViewSizeLevel < LIST_VIEW_SIZE_MAX) {
        listViewSizeLevel++;
        updateListViewSize();
    }
}

function decreaseListViewSize() {
    if (listViewSizeLevel > LIST_VIEW_SIZE_MIN) {
        listViewSizeLevel--;
        updateListViewSize();
    }
}

window.setGridColumns = (val) => {
  const grid = document.getElementById('studentsGrid');
  if (val === 'auto') {
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
  } else {
    grid.style.gridTemplateColumns = `repeat(${val}, minmax(0, 1fr))`;
  }
}

window.openAddStudentModal = () => {
  document.getElementById('studentName').value = '';
  document.getElementById('initialPoints').value = '0';
  document.getElementById('studentPhoto').value = '';
  document.getElementById('photoPreview').style.display = 'none';
  document.getElementById('photoPreview').querySelector('img').src = '';
  window.openModal('addStudentModal');
}

window.previewPhoto = (event, previewId) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      if (e.target?.result) {
        document.getElementById(previewId).querySelector('img').src = e.target.result;
      }
      document.getElementById(previewId).style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

window.addStudent = () => {
  const name = document.getElementById('studentName').value.trim();
  const initialPoints = parseInt(document.getElementById('initialPoints').value) || 0;
  const file = document.getElementById('studentPhoto').files?.[0];

  if (!name) {
    showNotification('Please enter student name', 'error');
    return;
  }

  const student = {
    id: generateId(),
    name,
    points: initialPoints,
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      student.photo = e.target?.result;
      finalizeAddStudent(student);
    };
    reader.readAsDataURL(file);
  } else {
    finalizeAddStudent(student);
  }
}

function finalizeAddStudent(student) {
  if (!currentClassId) return;
  if (!students[currentClassId]) students[currentClassId] = {};
  students[currentClassId][student.id] = student;
  saveData();
  renderStudentsView();
  window.closeModal('addStudentModal');
  showNotification('Student added!', 'success');
}

window.openAddMultipleModal = () => {
  document.getElementById('multipleNames').value = '';
  window.openModal('addMultipleModal');
}

window.addMultipleStudents = () => {
  if (!currentClassId) return;
  const names = document.getElementById('multipleNames').value.trim().split('\n').map(n => n.trim()).filter(n => n);
  names.forEach(name => {
    const student = { id: generateId(), name, points: 0 };
    students[currentClassId][student.id] = student;
  });
  saveData();
  renderStudentsView();
  window.closeModal('addMultipleModal');
  showNotification(`${names.length} students added!`, 'success');
}

window.onSearchChange = () => {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    document.querySelectorAll('.student-card:not(.add-student-card)').forEach(el => {
        const name = el.querySelector('.student-name')?.textContent?.toLowerCase() || '';
        el.style.display = name.includes(query) ? '' : 'none';
    });

    document.querySelectorAll('#studentListTable tbody tr').forEach(el => {
        const name = el.querySelector('.student-list-name')?.textContent?.toLowerCase() || '';
        el.style.display = name.includes(query) ? '' : 'none';
    });

    document.querySelectorAll('.compact-student-item').forEach(el => {
        const name = el.querySelector('.compact-name')?.textContent?.toLowerCase() || '';
        el.style.display = name.includes(query) ? '' : 'none';
    });
}

window.copyAllStudentNames = () => {
    if (!currentClassId) return;
    const classStudents = Object.values(students[currentClassId] || {});
    if (classStudents.length === 0) {
        showNotification('No students to copy.', 'info');
        return;
    }
    const studentNames = classStudents.map(s => s.name).join('\n');
    navigator.clipboard.writeText(studentNames).then(() => {
        showNotification('All student names copied to clipboard!', 'success');
    }, (err) => {
        showNotification('Failed to copy names.', 'error');
    });
}

// Bulk Actions Logic
window.enterBulkMode = () => {
  bulkMode = true;
  document.getElementById('bulkActions')?.classList.add('active');
  document.getElementById('selectedCount').textContent = '0 selected';
  selectedStudents.clear();
  renderStudentsView();
}

window.exitBulkMode = () => {
  bulkMode = false;
  document.getElementById('bulkActions')?.classList.remove('active');
  selectedStudents.clear();
  renderStudentsView();
}

window.toggleStudentSelection = (studentId) => {
  if (!bulkMode) return;
  if (selectedStudents.has(studentId)) {
    selectedStudents.delete(studentId);
  } else {
    selectedStudents.add(studentId);
  }
  document.getElementById('selectedCount').textContent = `${selectedStudents.size} selected`;
  renderStudentsView();
}

window.selectAllStudentsForBulk = () => {
    if (!currentClassId) return;
    const classStudents = Object.values(students[currentClassId] || {});
    classStudents.forEach(s => selectedStudents.add(s.id));
    document.getElementById('selectedCount').textContent = `${selectedStudents.size} selected`;
    renderStudentsView();
}

window.deselectAllStudentsForBulk = () => {
    selectedStudents.clear();
    document.getElementById('selectedCount').textContent = `0 selected`;
    renderStudentsView();
}

window.openBulkPointsModal = (action) => {
  bulkAction = action;
  document.getElementById('bulkModalTitle').textContent = action === 'add' ? 'Bulk Add Points' : 'Bulk Subtract Points';
  document.getElementById('bulkSummary').textContent = `Apply to ${selectedStudents.size} selected students`;
  document.getElementById('bulkReason').value = '';
  const amount = parseInt(document.getElementById('bulkPointAmount').value);
  document.getElementById('bulkModalTitle').textContent += ` (${action === 'add' ? '+' : '-'}${amount} pts)`;
  renderSavedReasons('bulkPointsSavedReasons', 'bulkReason');
  window.openModal('bulkPointsModal');
}

window.confirmBulkPoints = () => {
  const amount = parseInt(document.getElementById('bulkPointAmount').value);
  const reason = document.getElementById('bulkReason').value.trim();
  if (!amount) {
    showNotification('Please enter a point amount', 'error');
    return;
  }
  if (!currentClassId) return;
  const finalAmount = bulkAction === 'add' ? amount : -amount;
  selectedStudents.forEach(studentId => {
    const student = students[currentClassId][studentId];
    if (student) {
      const powerUpInfo = getPowerUpInfo(student.id);
      const pointsToAdd = powerUpInfo ? Math.round(finalAmount * powerUpInfo.multiplier) : finalAmount;
      student.points += pointsToAdd;
      pointsHistory[currentClassId].push({ studentId, studentName: student.name, points: pointsToAdd, reason: reason || 'Bulk action', timestamp: new Date().toISOString() });
    }
  });
  if (reason) saveReason(reason);
  saveData();
  window.exitBulkMode();
  window.closeModal('bulkPointsModal');
  showNotification('Points updated for selected students!', 'success');
}

// Student Points Logic
window.openStudentPointsModal = (studentId) => {
  currentStudentId = studentId;
  if (!currentClassId) return;
  const student = students[currentClassId][studentId];
  document.getElementById('studentModalTitle').textContent = `Change points for ${sanitizeHTML(student.name)}`;
  document.getElementById('pointsChange').value = '1';
  document.getElementById('pointsReason').value = '';
  renderSavedReasons('studentPointsSavedReasons', 'pointsReason');
  window.openModal('studentPointsModal');
}

window.updateStudentPoints = () => {
  if (!currentClassId) return;
  const student = students[currentClassId][currentStudentId];
  let change = parseInt(document.getElementById('pointsChange').value);
  const reason = document.getElementById('pointsReason').value.trim();
  if (isNaN(change)) {
    showNotification('Invalid point value', 'error');
    return;
  }
  const powerUpInfo = getPowerUpInfo(currentStudentId);
  const pointsToAdd = powerUpInfo ? Math.round(change * powerUpInfo.multiplier) : change;
  student.points += pointsToAdd;
  pointsHistory[currentClassId].push({ studentId: currentStudentId, studentName: student.name, points: pointsToAdd, reason: reason || 'No reason', timestamp: new Date().toISOString() });
  if (reason) saveReason(reason);
  saveData();
  renderStudentsView();
  window.closeModal('studentPointsModal');
  showNotification(`Points updated for ${student.name}!`, 'success');
}

// Student Edit/Delete Logic
window.openEditStudentModal = (studentId) => {
  currentStudentId = studentId;
  if (!currentClassId) return;
  const student = students[currentClassId][studentId];
  document.getElementById('editStudentName').value = student.name;
  document.getElementById('editStudentPhoto').value = '';
  const preview = document.getElementById('editPhotoPreview');
  const img = document.getElementById('editPreviewImg');
  if (student.photo) {
      img.src = student.photo;
      preview.style.display = 'block';
  } else {
      preview.style.display = 'none';
  }
  window.openModal('editStudentModal');
}

window.updateStudent = () => {
  if (!currentClassId) return;
  const name = document.getElementById('editStudentName').value.trim();
  const file = document.getElementById('editStudentPhoto').files?.[0];
  if (!name) {
    showNotification('Student name cannot be empty', 'error');
    return;
  }
  const student = students[currentClassId][currentStudentId];
  student.name = name;
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      student.photo = e.target?.result;
      saveData();
      renderStudentsView();
      window.closeModal('editStudentModal');
      showNotification('Student updated!', 'success');
    };
    reader.readAsDataURL(file);
  } else {
    saveData();
    renderStudentsView();
    window.closeModal('editStudentModal');
    showNotification('Student updated!', 'success');
  }
}

window.deleteStudent = () => {
  if (confirm('Are you sure you want to delete this student? This cannot be undone.')) {
    if (!currentClassId) return;
    delete students[currentClassId][currentStudentId];
    saveData();
    renderStudentsView();
    window.closeModal('editStudentModal');
    showNotification('Student deleted', 'warning');
  }
}

// Leaderboard Logic
function renderLeaderboardView() {
    const view = document.getElementById('leaderboardView');
    view.innerHTML = `
        <div class="podium-container" id="leaderboardPodium"></div>
        <div class="leaderboard-list" id="leaderboardList"></div>
    `;
    renderLeaderboard(view);
}

function renderLeaderboard(container) {
  if (!currentClassId && !currentStudent) return container || document.createElement('div');
  
  const aClassId = currentClassId || currentStudent.classId;
  if (!container) container = document.createElement('div');
  
  const classStudents = Object.values(students[aClassId] || {});
  const sortedStudents = classStudents.sort((a, b) => b.points - a.points);
  
  const podiumContainer = container.querySelector('#leaderboardPodium') || document.createElement('div');
  const listContainer = container.querySelector('#leaderboardList') || document.createElement('div');
  podiumContainer.className = 'podium-container';
  listContainer.className = 'leaderboard-list';
  podiumContainer.innerHTML = '';
  listContainer.innerHTML = '';

  if (sortedStudents.length === 0) {
    container.innerHTML = '<p>No students in this class yet.</p>';
    return container;
  }
  
  const podiumSpots = [sortedStudents[1], sortedStudents[0], sortedStudents[2]];
  const podiumOrder = [2, 1, 3];
  
  podiumOrder.forEach((rank, index) => {
      const student = podiumSpots[index];
      if (student) {
          const avatar = student.photo ? `<img src="${student.photo}" alt="${sanitizeHTML(student.name)}"/>` : student.name.charAt(0).toUpperCase();
          podiumContainer.innerHTML += `
              <div class="podium-step podium-${rank}">
                  <div class="podium-rank">${rank}</div>
                  <div class="podium-avatar">${avatar}</div>
                  <div class="podium-name">${sanitizeHTML(student.name)}</div>
                  <div class="podium-points">${student.points} pts</div>
              </div>
          `;
      } else {
         // Add a placeholder if there are fewer than 3 students
         podiumContainer.innerHTML += `<div class="podium-step" style="height: ${[80,100,60][index]}%; visibility: hidden;"></div>`
      }
  });


  sortedStudents.slice(3).forEach((student, index) => {
    const rank = index + 4;
    const avatar = student.photo ? `<img src="${student.photo}" alt="${sanitizeHTML(student.name)}"/>` : student.name.charAt(0).toUpperCase();
    listContainer.innerHTML += `
      <div class="leaderboard-item">
        <div class="leaderboard-rank">${rank}</div>
        <div class="leaderboard-avatar">${avatar}</div>
        <div class="leaderboard-name">${sanitizeHTML(student.name)}</div>
        <div class="leaderboard-points">${student.points} pts</div>
      </div>
    `;
  });
  return container;
}

// Rewards Logic
function renderRewardsView(targetContainer) {
  if (!currentClassId) return;
  if (!rewards[currentClassId]) rewards[currentClassId] = [];
  const classRewards = rewards[currentClassId];
  const grid = targetContainer || document.getElementById('rewardsGrid');
  grid.innerHTML = '';
  if (classRewards.length === 0) {
    grid.innerHTML = '<p>No rewards created for this class yet.</p>';
    return grid;
  }
  classRewards.forEach(reward => {
    const typeClass = reward.type === 'deduct' ? 'deduct-reward' : 'require-reward';
    const badgeClass = reward.type === 'deduct' ? 'deduct-badge' : 'require-badge';
    const icon = reward.icon || '🎁';

    grid.innerHTML += `
      <div class="reward-card ${typeClass}">
        <span class="reward-type-badge ${badgeClass}">${reward.type}</span>
        <div class="reward-header">
            <div><h3 class="reward-title">${icon} ${sanitizeHTML(reward.title)}</h3><p class="reward-points">${reward.points} pts</p></div>
        </div>
        <p class="reward-description">${sanitizeHTML(reward.description)}</p>
        <div class="reward-actions">
          ${ currentUser && currentUser.type === 'teacher' ? `<button class="btn btn-success" onclick="window.openClaimRewardModal('${reward.id}')">Claim</button><button class="btn btn-secondary" onclick="window.openEditRewardModal('${reward.id}')">Edit</button>` : ''}
        </div>
      </div>
    `;
  });
   return grid;
}

window.openCreateRewardModal = () => {
  document.getElementById('rewardTitle').value = '';
  document.getElementById('rewardDescription').value = '';
  document.getElementById('rewardPoints').value = '';
  document.getElementById('rewardIcon').value = '';
  document.querySelector('input[name="rewardType"][value="deduct"]').checked = true;
  window.openModal('createRewardModal');
}

window.createReward = () => {
  const title = document.getElementById('rewardTitle').value.trim();
  const description = document.getElementById('rewardDescription').value.trim();
  const points = parseInt(document.getElementById('rewardPoints').value);
  const type = document.querySelector('input[name="rewardType"]:checked').value;
  const icon = document.getElementById('rewardIcon').value.trim();

  if (!title || isNaN(points)) {
    showNotification('Title and points are required', 'error');
    return;
  }
  const reward = { id: generateId(), title, description, points, type, icon };
  if (!currentClassId) return;
  if (!rewards[currentClassId]) rewards[currentClassId] = [];
  rewards[currentClassId].push(reward);
  saveData();
  renderRewardsView();
  window.closeModal('createRewardModal');
  showNotification('Reward created!', 'success');
}

window.openEditRewardModal = (rewardId) => {
  currentRewardId = rewardId;
  if (!currentClassId) return;
  const reward = rewards[currentClassId].find(r => r.id === rewardId);
  document.getElementById('editRewardTitle').value = reward.title;
  document.getElementById('editRewardDescription').value = reward.description;
  document.getElementById('editRewardPoints').value = String(reward.points);
  document.getElementById('editRewardIcon').value = reward.icon;
  document.querySelector(`input[name="editRewardType"][value="${reward.type}"]`).checked = true;
  window.openModal('editRewardModal');
}

window.updateReward = () => {
  if (!currentClassId) return;
  const rewardIndex = rewards[currentClassId].findIndex(r => r.id === currentRewardId);
  const title = document.getElementById('editRewardTitle').value.trim();
  const description = document.getElementById('editRewardDescription').value.trim();
  const points = parseInt(document.getElementById('editRewardPoints').value);
  const type = document.querySelector('input[name="editRewardType"]:checked').value;
  const icon = document.getElementById('editRewardIcon').value.trim();
  
  if (!title || isNaN(points)) {
    showNotification('Title and points are required', 'error');
    return;
  }
  rewards[currentClassId][rewardIndex] = { ...rewards[currentClassId][rewardIndex], title, description, points, type, icon };
  saveData();
  renderRewardsView();
  window.closeModal('editRewardModal');
  showNotification('Reward updated', 'success');
}

window.deleteReward = () => {
  if (confirm('Are you sure you want to delete this reward?')) {
    if (!currentClassId) return;
    rewards[currentClassId] = rewards[currentClassId].filter(r => r.id !== currentRewardId);
    saveData();
    renderRewardsView();
    window.closeModal('editRewardModal');
    showNotification('Reward deleted', 'warning');
  }
}

window.openClaimRewardModal = (rewardId) => {
  currentRewardId = rewardId;
  if (!currentClassId) return;
  const reward = rewards[currentClassId].find(r => r.id === rewardId);
  const content = document.getElementById('claimRewardContent');
  const classStudents = Object.values(students[currentClassId] || {}).filter(s => s.points >= reward.points);
  
  if (classStudents.length === 0) {
    content.innerHTML = `<p>No students have enough points (${reward.points}) to claim "${sanitizeHTML(reward.title)}".</p>`;
  } else {
    content.innerHTML = `
      <p>Claiming: <strong>${sanitizeHTML(reward.title)}</strong> (${reward.points} pts)</p>
      <div class="action-buttons mb-4">
          <button id="selectAllBtn" class="btn btn-info" onclick="window.handleSelectAllToggle(this)">Select All</button>
      </div>
      <div class="selectable-student-grid">
        ${classStudents.map(s => {
            const avatar = s.photo ? `<img src="${s.photo}" alt="${sanitizeHTML(s.name)}"/>` : s.name.charAt(0).toUpperCase();
            return `
            <div class="selectable-student-card" data-student-id="${s.id}" onclick="window.toggleStudentSelectionInModal(this)">
                <div class="student-avatar">${avatar}</div>
                <div class="student-name">${sanitizeHTML(s.name)}<br>(${s.points} pts)</div>
            </div>
        `}).join('')}
      </div>
    `;
  }
  window.openModal('claimRewardModal');
}

window.toggleStudentSelectionInModal = (element) => {
    element.classList.toggle('selected');
}

window.handleSelectAllToggle = (button) => {
    const isSelectAll = button.textContent === 'Select All';
    document.querySelectorAll('.selectable-student-card').forEach(card => {
        if (isSelectAll) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    button.textContent = isSelectAll ? 'Deselect All' : 'Select All';
    button.className = isSelectAll ? 'btn btn-secondary' : 'btn btn-info';
};


window.confirmClaimReward = () => {
  if (!currentClassId) return;
  const selectedStudentIds = Array.from(document.querySelectorAll('#claimRewardContent .selectable-student-card.selected')).map(el => el.dataset.studentId);
  const reward = rewards[currentClassId].find(r => r.id === currentRewardId);

  if (selectedStudentIds.length === 0) {
    showNotification('Please select at least one student', 'error');
    return;
  }
  
  selectedStudentIds.forEach(id => {
    const student = students[currentClassId][id];
    if (reward.type === 'deduct') student.points -= reward.points;
    student.pointsRewards = (student.pointsRewards || 0) + 1;
    pointsHistory[currentClassId].push({ studentId: id, studentName: student.name, points: reward.type === 'deduct' ? -reward.points : 0, reason: `Claimed reward: ${reward.title}`, timestamp: new Date().toISOString() });
  });
  saveData();
  renderStudentsView();
  window.closeModal('claimRewardModal');
  showNotification('Reward claimed!', 'success');
}

// Power Ups Logic
function renderPowerUpsView(targetContainer) {
  if (!currentClassId) return;
  if (!powerups[currentClassId]) powerups[currentClassId] = [];
  const classPowerups = powerups[currentClassId];
  const grid = targetContainer || document.getElementById('powerupsGrid');
  grid.innerHTML = '';
  if (classPowerups.length === 0) {
    grid.innerHTML = '<p>No power ups created for this class yet.</p>';
    return grid;
  }
  classPowerups.forEach(powerup => {
    grid.innerHTML += `
      <div class="reward-card instant-reward">
        <span class="reward-type-badge instant-badge">POWER UP</span>
        <div class="reward-header"><div><h3 class="reward-title">⚡ ${sanitizeHTML(powerup.title)}</h3><p class="reward-points">${powerup.multiplier}x for ${powerup.duration} days</p></div></div>
        <p class="reward-description">${sanitizeHTML(powerup.description)}</p>
        <div class="reward-actions">
          ${ currentUser && currentUser.type === 'teacher' ? `<button class="btn btn-success" onclick="window.assignPowerUp('${powerup.id}')">Assign</button><button class="btn btn-secondary" onclick="window.openEditPowerUpModal('${powerup.id}')">Edit</button>` : ''}
        </div>
      </div>
    `;
  });
  return grid;
}

window.openCreatePowerUpModal = () => {
  document.getElementById('powerUpTitle').value = '';
  document.getElementById('powerUpDescription').value = '';
  document.getElementById('powerUpMultiplier').value = '1.5';
  document.getElementById('powerUpDuration').value = '7';
  window.openModal('createPowerUpModal');
}

window.createPowerUp = () => {
  const title = document.getElementById('powerUpTitle').value.trim();
  const description = document.getElementById('powerUpDescription').value.trim();
  const multiplier = parseFloat(document.getElementById('powerUpMultiplier').value);
  const duration = parseInt(document.getElementById('powerUpDuration').value);

  if (!title || isNaN(multiplier) || isNaN(duration)) {
    showNotification('All fields are required', 'error');
    return;
  }
  const powerup = { id: generateId(), title, description, multiplier, duration };
  if (!currentClassId) return;
  if (!powerups[currentClassId]) powerups[currentClassId] = [];
  powerups[currentClassId].push(powerup);
  saveData();
  renderPowerUpsView();
  window.closeModal('createPowerUpModal');
  showNotification('Power up created!', 'success');
}

window.openEditPowerUpModal = (powerupId) => {
  currentPowerUpId = powerupId;
  if (!currentClassId) return;
  const powerup = powerups[currentClassId].find(p => p.id === powerupId);
  document.getElementById('editPowerUpTitle').value = powerup.title;
  document.getElementById('editPowerUpDescription').value = powerup.description;
  document.getElementById('editPowerUpMultiplier').value = String(powerup.multiplier);
  document.getElementById('editPowerUpDuration').value = String(powerup.duration);
  window.openModal('editPowerUpModal');
}

window.updatePowerUp = () => {
    if (!currentClassId) return;
    const powerupIndex = powerups[currentClassId].findIndex(p => p.id === currentPowerUpId);
    const title = document.getElementById('editPowerUpTitle').value.trim();
    const description = document.getElementById('editPowerUpDescription').value.trim();
    const multiplier = parseFloat(document.getElementById('editPowerUpMultiplier').value);
    const duration = parseInt(document.getElementById('editPowerUpDuration').value);

    if (!title || isNaN(multiplier) || isNaN(duration)) {
        showNotification('All fields are required', 'error');
        return;
    }
    powerups[currentClassId][powerupIndex] = { ...powerups[currentClassId][powerupIndex], title, description, multiplier, duration };
    saveData();
    renderPowerUpsView();
    window.closeModal('editPowerUpModal');
    showNotification('Power up updated', 'success');
}

window.deletePowerUp = () => {
    if (confirm('Are you sure you want to delete this power up?')) {
        if (!currentClassId) return;
        powerups[currentClassId] = powerups[currentClassId].filter(p => p.id !== currentPowerUpId);
        saveData();
        renderPowerUpsView();
        window.closeModal('editPowerUpModal');
        showNotification('Power up deleted', 'warning');
    }
}

window.assignPowerUp = (powerupId) => {
  currentPowerUpId = powerupId;
  if (!currentClassId) return;
  const powerup = powerups[currentClassId].find(p => p.id === powerupId);
  const content = document.getElementById('claimRewardContent');
  const classStudents = Object.values(students[currentClassId] || {});

  content.innerHTML = `
    <p>Assigning Power Up: <strong>${sanitizeHTML(powerup.title)}</strong> (${powerup.multiplier}x for ${powerup.duration} days)</p>
    <div class="action-buttons mb-4">
          <button id="selectAllBtn" class="btn btn-info" onclick="window.handleSelectAllToggle(this)">Select All</button>
    </div>
    <div class="selectable-student-grid">
        ${classStudents.map(s => {
            const avatar = s.photo ? `<img src="${s.photo}" alt="${sanitizeHTML(s.name)}"/>` : s.name.charAt(0).toUpperCase();
            return `
            <div class="selectable-student-card" data-student-id="${s.id}" onclick="window.toggleStudentSelectionInModal(this)">
                <div class="student-avatar">${avatar}</div>
                <div class="student-name">${sanitizeHTML(s.name)}</div>
            </div>
        `}).join('')}
    </div>
  `;

  const modal = document.getElementById('claimRewardModal');
  modal.querySelector('.modal-title').textContent = 'Assign Power Up';
  modal.querySelector('.modal-footer .btn-primary').textContent = 'Assign';
  modal.querySelector('.modal-footer .btn-primary').onclick = window.confirmAssignPowerUp;
  window.openModal('claimRewardModal');
}

window.confirmAssignPowerUp = () => {
  if (!currentClassId) return;
  const selectedStudentIds = Array.from(document.querySelectorAll('#claimRewardContent .selectable-student-card.selected')).map(el => el.dataset.studentId);
  const powerup = powerups[currentClassId].find(p => p.id === currentPowerUpId);
  
  selectedStudentIds.forEach(id => {
    const student = students[currentClassId][id];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + powerup.duration);
    student.powerUp = { id: powerup.id, multiplier: powerup.multiplier, endDate: endDate.toISOString() };
  });
  saveData();
  renderStudentsView();
  window.closeModal('claimRewardModal');
  showNotification('Power up assigned!', 'success');
}

// History Logic
window.switchHistoryView = (event, view) => {
    event.currentTarget.parentElement.querySelector('.active')?.classList.remove('active');
    event.currentTarget.classList.add('active');
    const parent = event.currentTarget.closest('.page-view, .portal-main, .modal-tab-content');
    if (view === 'list') {
        parent.querySelector('#historyListContainer').style.display = 'block';
        parent.querySelector('#historyCalendarContainer').style.display = 'none';
    } else {
        parent.querySelector('#historyListContainer').style.display = 'none';
        parent.querySelector('#historyCalendarContainer').style.display = 'block';
    }
}

function renderHistoryView(historyData, container) {
  container.innerHTML = `
    <div class="content-header" style="justify-content: space-between;">
        <div class="view-toggle">
            <button class="view-option active" data-view="list" onclick="window.switchHistoryView(event, 'list')">List</button>
            <button class="view-option" data-view="calendar" onclick="window.switchHistoryView(event, 'calendar')">Calendar</button>
        </div>
        ${currentUser ? `<div class="action-buttons">
          <button class="btn btn-info" onclick="window.exportHistory()">Export History</button>
          <button class="btn btn-warning" onclick="window.clearHistory()">Clear History</button>
        </div>` : ''}
    </div>
    <div id="historyListContainer"></div>
    <div id="historyCalendarContainer" style="display: none;"></div>
  `;

  // Render List
  const listContainer = container.querySelector('#historyListContainer');
  listContainer.innerHTML = '';
  if (!historyData || historyData.length === 0) {
    listContainer.innerHTML = '<p>No point history yet.</p>';
  } else {
    [...historyData].reverse().forEach(item => {
      listContainer.innerHTML += `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">
          <span><strong>${sanitizeHTML(item.studentName)}:</strong> ${item.points > 0 ? '+' : ''}${item.points} pts for "${sanitizeHTML(item.reason)}"</span>
          <span style="color: var(--text-secondary); font-size: 0.875rem;">${new Date(item.timestamp).toLocaleString()}</span>
        </div>
      `;
    });
  }

  // Render Calendar
  container.querySelector('#historyCalendarContainer').appendChild(renderCalendar(historyData || []));
  
  return container;
}

function renderCalendar(historyData) {
    const container = document.createElement('div');
    container.className = 'calendar-container';
    
    const date = historyCalendarDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const historyByDay = {};
    historyData.forEach(item => {
        const d = new Date(item.timestamp).toDateString();
        if (!historyByDay[d]) historyByDay[d] = [];
        historyByDay[d].push(item);
    });
    
    container.innerHTML = `
        <div class="calendar-header">
            <button class="btn btn-secondary" id="prev-month">◄</button>
            <h3>${date.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <button class="btn btn-secondary" id="next-month">►</button>
        </div>
        <div class="calendar-grid">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<div class="calendar-day-header">${day}</div>`).join('')}
        </div>
    `;
    
    const grid = container.querySelector('.calendar-grid');
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="calendar-day other-month"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const fullDate = new Date(year, month, day);
        const dateString = fullDate.toDateString();
        const dayHistory = historyByDay[dateString];
        
        let dayClass = 'calendar-day';
        if (dayHistory) {
            dayClass += ' has-history';
            const allPositive = dayHistory.every(item => item.points >= 0);
            const allNegative = dayHistory.every(item => item.points <= 0);
            if (allPositive && !allNegative) { // Exclude days with only 0-point transactions
                dayClass += ' day-positive';
            } else if (allNegative && !allPositive) {
                dayClass += ' day-negative';
            } else {
                dayClass += ' day-mixed';
            }
        }

        const dayEl = document.createElement('div');
        dayEl.className = dayClass;
        dayEl.textContent = String(day);
        if (dayHistory) {
            dayEl.onclick = (e) => showDayHistoryPopup(e, dayHistory);
        }
        grid.appendChild(dayEl);
    }

    container.querySelector('#prev-month').onclick = () => { historyCalendarDate.setMonth(month - 1); container.replaceWith(renderCalendar(historyData)); };
    container.querySelector('#next-month').onclick = () => { historyCalendarDate.setMonth(month + 1); container.replaceWith(renderCalendar(historyData)); };

    return container;
}

function showDayHistoryPopup(event, dayHistory) {
    document.querySelector('.calendar-day-history-popup')?.remove();
    const popup = document.createElement('div');
    popup.className = 'calendar-day-history-popup';
    popup.style.top = `${event.pageY + 10}px`;
    popup.style.left = `${event.pageX + 10}px`;
    popup.innerHTML = `
        <h4>History for ${new Date(dayHistory[0].timestamp).toLocaleDateString()}</h4>
        <div style="max-height: 200px; overflow-y: auto; font-size: 0.875rem;">
            ${dayHistory.map(item => `
                <div style="border-bottom: 1px solid var(--border-color); padding: 0.25rem 0;">
                    <strong>${sanitizeHTML(item.studentName)}:</strong> ${item.points > 0 ? '+' : ''}${item.points} for "${sanitizeHTML(item.reason)}"
                </div>
            `).join('')}
        </div>
    `;
    document.body.appendChild(popup);
    document.body.addEventListener('click', () => popup.remove(), { once: true });
    event.stopPropagation();
}

window.exportHistory = () => {
  if (!currentClassId || (pointsHistory[currentClassId] || []).length === 0) {
    showNotification('No history to export.', 'info');
    return;
  }
  let csvContent = "data:text/csv;charset=utf-8,Timestamp,Student,Points,Reason\n";
  pointsHistory[currentClassId].forEach(item => {
    const row = [ new Date(item.timestamp).toISOString(), item.studentName, item.points, `"${item.reason.replace(/"/g, '""')}"` ].join(',');
    csvContent += row + "\r\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `history_${currentClassId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification('History exported!', 'success');
}

window.clearHistory = () => {
  if (confirm('Are you sure you want to clear all point history for this class? This cannot be undone.')) {
    if (!currentClassId) return;
    pointsHistory[currentClassId] = [];
    saveData();
    renderHistoryView(pointsHistory[currentClassId], document.getElementById('historyView'));
    showNotification('History cleared', 'warning');
  }
}

// Settings Logic
function renderSettingsView() {
    if (!currentUser) return;
    const view = document.getElementById('settingsView');
    view.innerHTML = `
        <div class="content-header">
            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600;">Settings</h2>
        </div>
        <div style="display: grid; gap: 2rem;" id="settingsContent"></div>
    `;
    const content = document.getElementById('settingsContent');
    
    if (currentUser.type === 'admin') {
        content.innerHTML = `
            <!-- Admin Profile Settings -->
            <div style="background: var(--surface); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow); border: 1px solid var(--border-color);">
                <h3 style="margin-bottom: 1.5rem;">Admin Profile</h3>
                <div class="form-group">
                    <label class="form-label">Profile Photo</label>
                    <div style="display:flex; align-items:center; gap:1rem;">
                       <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem;" id="settingsAvatar"></div>
                       <input type="file" class="file-upload" id="profilePhotoUpload" accept="image/*" onchange="window.updateProfilePicture(event)"/>
                       <button class="btn btn-secondary" onclick="document.getElementById('profilePhotoUpload').click()">Change Photo</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="adminUsernameInput">Username</label>
                    <input type="text" class="form-input" id="adminUsernameInput" value="${sanitizeHTML(currentUser.username)}">
                </div>
                <button class="btn btn-primary" onclick="window.updateAdminUsername()">Save Username</button>
            </div>
            <!-- Admin Password Settings -->
            <div style="background: var(--surface); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow); border: 1px solid var(--border-color);">
                <h3 style="margin-bottom: 1rem;">Change Password</h3>
                <button class="btn btn-secondary" onclick="window.openChangePasswordModal()">Change My Password</button>
            </div>
            <!-- Admin Danger Zone -->
            <div style="background: rgb(220 38 38 / 0.1); padding: 2rem; border-radius: 12px; border: 1px solid rgb(220 38 38 / 0.2);">
                <h3 style="margin-bottom: 1rem; color: var(--danger-color);">Danger Zone</h3>
                <p style="margin-bottom: 1rem;">Permanently delete your admin account. This action cannot be undone.</p>
                <button class="btn btn-danger" onclick="window.deleteAdminAccount()">Delete My Account</button>
            </div>
        `;
        const avatarDiv = document.getElementById('settingsAvatar');
        if (currentUser.photo) {
            avatarDiv.innerHTML = `<img src="${currentUser.photo}" alt="Profile Picture"/>`;
        } else {
            avatarDiv.innerHTML = currentUser.username.charAt(0).toUpperCase();
        }
    } else { // Teacher Settings
        const teacherSettings = users[currentUser.username]?.settings;
        const pinManagementAllowed = teacherSettings?.allowStudentPins || teacherSettings?.allowParentPins;

        content.innerHTML = `
            <div style="background: var(--surface); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow); border: 1px solid var(--border-color);">
                <h3 style="margin-bottom: 1.5rem;">My Profile</h3>
                <div class="form-group">
                     <label class="form-label">Profile Photo</label>
                     <div style="display:flex; align-items:center; gap:1rem;">
                        <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem;" id="settingsAvatar"></div>
                        <input type="file" class="file-upload" id="profilePhotoUpload" accept="image/*" onchange="window.updateProfilePicture(event)"/>
                        <button class="btn btn-secondary" onclick="document.getElementById('profilePhotoUpload').click()">Change Photo</button>
                     </div>
                 </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span>Username:</span><span style="font-weight: 600;">${currentUser.username}</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span>School:</span><span style="font-weight: 600;">${currentUser.school}</span></div>
                <button class="btn btn-secondary mt-4" onclick="window.openChangePasswordModal()">Change Password</button>
            </div>
            <div style="background: var(--surface); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow); border: 1px solid var(--border-color);">
              <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Class Settings</h3>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;"><span>Current Class:</span><span id="currentClassName" style="font-weight: 600;"></span></div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;"><span>Total Students:</span><span id="totalStudents" style="font-weight: 600;">0</span></div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"><span>Total Points Awarded:</span><span id="totalPoints" style="font-weight: 600;">0</span></div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;" id="offlineModeSetting">
                <label for="offlineModeToggle">Enable Offline Access</label>
                <label class="switch"><input type="checkbox" id="offlineModeToggle" onchange="window.setupOfflineMode(this.checked)"><span class="slider"></span></label>
              </div>
              <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                ${pinManagementAllowed ? `<button class="btn btn-info" onclick="window.manageStudentPins()">Manage Student PINs</button>` : ''}
                <button class="btn btn-warning" onclick="window.resetAllPoints()">Reset All Points</button>
                <button class="btn btn-info" onclick="window.backupClassData()">Backup Data</button>
              </div>
            </div>
            <div style="background: var(--surface); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow); border: 1px solid var(--border-color);">
              <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Saved Reasons</h3>
              <div id="savedReasonsList" style="display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
            </div>
            <div style="background: rgb(220 38 38 / 0.1); padding: 2rem; border-radius: 12px; border: 1px solid rgb(220 38 38 / 0.2);">
              <h3 style="margin-bottom: 1rem; color: var(--danger-color);">Danger Zone</h3>
              <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.875rem;">This action cannot be undone. This will permanently delete the current class and all student data.</p>
              <button class="btn btn-danger" onclick="window.deleteCurrentClass()">Delete Current Class</button>
            </div>
        `;
         const avatarDiv = document.getElementById('settingsAvatar');
        if (currentUser.photo) {
            avatarDiv.innerHTML = `<img src="${currentUser.photo}" alt="Profile Picture"/>`;
        } else {
            avatarDiv.innerHTML = currentUser.username.charAt(0).toUpperCase();
        }

        if (currentClassId) {
            const currentClass = classes.find(c => c.id === currentClassId);
            if (currentClass) {
                document.getElementById('currentClassName').textContent = currentClass.name;
                const classStudents = Object.values(students[currentClassId] || {});
                document.getElementById('totalStudents').textContent = String(classStudents.length);
                document.getElementById('totalPoints').textContent = String(classStudents.reduce((sum, s) => sum + s.points, 0));
            }
        }
        document.getElementById('offlineModeToggle').checked = currentUser.settings?.offlineMode || false;
        renderSavedReasonsList();
    }
}

window.openChangePasswordModal = () => {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    window.openModal('changePasswordModal');
}

window.changePassword = () => {
    if (!currentUser) return;
    const currentPass = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmNewPassword').value;

    if (currentUser.password !== currentPass) { showNotification('Current password is incorrect.', 'error'); return; }
    if (newPass !== confirmPass) { showNotification('New passwords do not match.', 'error'); return; }
    if (!newPass) { showNotification('New password cannot be empty.', 'error'); return; }

    currentUser.password = newPass;
    users[currentUser.username].password = newPass;
    saveData();
    window.closeModal('changePasswordModal');
    showNotification('Password changed successfully!', 'success');
}

window.resetAllPoints = () => {
  if (confirm('Are you sure you want to reset all points for all students in this class to 0? This cannot be undone.')) {
    if (!currentClassId) return;
    Object.values(students[currentClassId] || {}).forEach(s => s.points = 0);
    saveData();
    renderSettingsView();
    showNotification('All points have been reset.', 'warning');
  }
}

window.deleteCurrentClass = () => {
  if (confirm('Are you sure you want to permanently delete this class and all its data? THIS CANNOT BE UNDONE.')) {
    if (!currentClassId || !currentUser) return;
    delete students[currentClassId];
    delete rewards[currentClassId];
    delete pointsHistory[currentClassId];
    delete reasons[currentClassId];
    classes = classes.filter(c => c.id !== currentClassId);
    currentClassId = (classes.filter(c => c.teacherUsername === currentUser.username)[0] || {}).id || null;
    saveData();
    updateClassSelector();
    router();
    showNotification('Class deleted.', 'danger');
  }
}

window.backupClassData = () => {
    if (!currentClassId) return;
    const currentClass = classes.find(c => c.id === currentClassId);
    const backupData = {
        classInfo: currentClass, students: students[currentClassId] || {}, rewards: rewards[currentClassId] || [], powerups: powerups[currentClassId] || [], history: pointsHistory[currentClassId] || [], reasons: reasons[currentClassId] || [],
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `limud_points_backup_${backupData.classInfo.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showNotification('Backup created!', 'success');
}
