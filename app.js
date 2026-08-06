// 🟢 TU FUNCIÓN ORIGINAL EXACTA CON EL INDICE [0] AL FINAL
const getLocalDateString = (date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0]; 
};

const getTodayKey = () => getLocalDateString(new Date());

const getYesterdayKey = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
};

let state = {
  goal: parseInt(localStorage.getItem('water_goal')),
  history: JSON.parse(localStorage.getItem('water_history')) || {},
  streak: parseInt(localStorage.getItem('water_streak')) || 0,
  lastStreakUpdate: localStorage.getItem('water_last_streak_date') || '',
  lastDrinkTime: localStorage.getItem('water_last_drink_time') || ''
};

// META INTELIGENTE: Cambia según estación y respeta tus cambios
const month = new Date().getMonth();
const isSummerMonth = (month >= 4 && month <= 8); // Mayo a Septiembre

const lastSeasonType = localStorage.getItem('water_season_type') || '';
const currentSeasonType = isSummerMonth ? 'summer' : 'standard';

if (lastSeasonType !== currentSeasonType) {
  state.goal = isSummerMonth ? 2500 : 2000;
  localStorage.setItem('water_goal', state.goal);
  localStorage.setItem('water_season_type', currentSeasonType);
} else {
  state.goal = parseInt(localStorage.getItem('water_goal')) || (isSummerMonth ? 2500 : 2000);
}

// Inicializar el día de hoy si no existe
if (!state.history[getTodayKey()]) {
  state.history[getTodayKey()] = 0;
}

// LÓGICA DE RÁFAGA CORREGIDA
function checkStreak() {
  const today = getTodayKey();
  const yesterdayKey = getYesterdayKey();
  const todayWater = state.history[today] || 0;

  if (todayWater >= state.goal) {
    if (state.lastStreakUpdate !== today) {
      if (state.lastStreakUpdate === yesterdayKey || state.streak === 0) {
        state.streak++;
      } else {
        state.streak = 1; 
      }
      state.lastStreakUpdate = today;
      localStorage.setItem('water_streak', state.streak);
      localStorage.setItem('water_last_streak_date', state.lastStreakUpdate);
    }
  } else {
    if (state.lastStreakUpdate !== today && state.lastStreakUpdate !== yesterdayKey && state.streak > 0) {
      state.streak = 0;
      localStorage.setItem('water_streak', state.streak);
    }
  }
}

// LÓGICA DE TIEMPO TRANSCURRIDO (ÚLTIMA INGESTA)
function updateTimerDisplay() {
  const reminderEl = document.getElementById('timeReminder');
  if (!state.lastDrinkTime) {
    reminderEl.innerText = "Aún no has registrado agua hoy";
    reminderEl.classList.remove('alert');
    return;
  }

  const now = new Date().getTime();
  const diffMs = now - parseInt(state.lastDrinkTime);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) {
    reminderEl.innerText = "¡Acabas de beber agua!";
    reminderEl.classList.remove('alert');
  } else if (diffMins < 60) {
    reminderEl.innerText = `Última ingesta: hace ${diffMins} min`;
    reminderEl.classList.remove('alert');
  } else {
    reminderEl.innerText = `Última ingesta: hace ${diffHours}h y ${diffMins % 60}m`;
    if (diffMins >= 120) {
      reminderEl.innerText += " ⚠️ ¡Es hora de hidratarte!";
      reminderEl.classList.add('alert');
    } else {
      reminderEl.classList.remove('alert');
    }
  }
}

function updateGoal(val) {
  state.goal = parseInt(val) || 2000;
  localStorage.setItem('water_goal', state.goal);
  checkStreak();
  render();
}

// AGREGAR AGUA
function addWater(amount) {
  const today = getTodayKey();
  state.history[today] = (state.history[today] || 0) + amount;
  
  state.lastDrinkTime = new Date().getTime().toString();
  localStorage.setItem('water_last_drink_time', state.lastDrinkTime);
  
  // 🟢 VIBRACIÓN: 40 milisegundos (un toque sutil táctil muy agradable)
  if ('vibrate' in navigator) {
    navigator.vibrate(40);
  }
  
  checkStreak();
  saveAndRender();
}

function removeLastWater() {
  const today = getTodayKey();
  if ((state.history[today] || 0) >= 250) {
    state.history[today] -= 250;
  } else if ((state.history[today] || 0) > 0) {
    state.history[today] = 0;
  }
  
  // 🟢 VIBRACIÓN: Vibra 30ms, para 40ms, y vuelve a vibrar 30ms
  if ('vibrate' in navigator) {
    navigator.vibrate([30, 40, 30]);
  }
  
  const yesterdayKey = getYesterdayKey();
  if (state.history[today] < state.goal && state.lastStreakUpdate === today) {
    state.streak = Math.max(0, state.streak - 1);
    state.lastStreakUpdate = yesterdayKey; 
    localStorage.setItem('water_streak', state.streak);
    localStorage.setItem('water_last_streak_date', state.lastStreakUpdate);
  }

  checkStreak();
  saveAndRender();
}

function resetToday() {
  if(confirm('¿Seguro que quieres reiniciar el conteo de hoy?')) {
    state.history[getTodayKey()] = 0;
    state.lastDrinkTime = '';
    localStorage.removeItem('water_last_drink_time');
	
	// 🟢 VIBRACIÓN: Una vibración continua de 150ms para indicar un reseteo total
    if ('vibrate' in navigator) {
      navigator.vibrate(150);
    }
    
    if(state.lastStreakUpdate === getTodayKey()) {
      state.streak = Math.max(0, state.streak - 1);
      state.lastStreakUpdate = getYesterdayKey();
      localStorage.setItem('water_streak', state.streak);
      localStorage.setItem('water_last_streak_date', state.lastStreakUpdate);
    }
    checkStreak();
    saveAndRender();
  }
}

function saveAndRender() {
  localStorage.setItem('water_history', JSON.stringify(state.history));
  render();
}

function render() {
  const today = getTodayKey();
  const current = state.history[today] || 0;
  
  document.getElementById('goalInput').value = state.goal;
  document.getElementById('currentDisplay').innerText = `${current} ml`;
  
  const percent = Math.min(Math.round((current / state.goal) * 100), 100);
  document.getElementById('percentDisplay').innerText = `${percent}%`;

  const circle = document.getElementById('circleProgress');
  if (percent >= 100) {
    circle.style.background = `conic-gradient(#4caf50 100%, rgba(0,0,0,0.1) 0%)`;
  } else {
    circle.style.background = `conic-gradient(var(--primary) ${percent}%, rgba(135,135,135,0.15) ${percent}%)`;
  }

  document.getElementById('streakDisplay').innerText = `🔥 ${state.streak} ${state.streak === 1 ? 'día' : 'días'}`;
  
  const month = new Date().getMonth();
  const isSummer = month >= 4 && month <= 8;
  document.getElementById('seasonDisplay').innerText = isSummer ? "☀️ Temp. Cálida" : "❄️ Temp. Estándar";

  updateTimerDisplay();

  // 🟢 ESCALA FIJA SINCRONIZADA A LA META REAL (state.goal) PARA EVITAR EL DESFASE DE MEDIO LITRO
  const linesContainer = document.getElementById('chartLines');
  if (linesContainer) {
    const top2L = 100 - ((2000 / state.goal) * 100);
	const lM = 100 - ((1500 / state.goal) * 100);
    const top1L = 100 - ((1000 / state.goal) * 100); 
	const mL = 100 - ((500 / state.goal) * 100);

    linesContainer.innerHTML = `
      <div class="chart-line-row" style="top: ${top2L}%;"><span>2L</span></div>
	  <div class="chart-line-row" style="top: ${lM}%;"><span></span></div>
      <div class="chart-line-row" style="top: ${top1L}%;"><span>1L</span></div>
	  <div class="chart-line-row" style="top: ${mL}%;"><span></span></div>
    `;
  }

  const chartEl = document.getElementById('chart');
  if (!chartEl) return;
  chartEl.innerHTML = '';

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = getLocalDateString(d); 
    const val = state.history[key] || 0;
    
    const dayName = d.toLocaleDateString('es', { weekday: 'short' }).substring(0,2);
    
    // 🟢 LAS BARRAS AHORA UTILIZAN TU META REAL, IGUAL QUE LAS LÍNEAS DE ARRIBA
    const pct = (val / state.goal) * 100;

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';
    
    const bar = document.createElement('div');
    bar.className = `bar ${val >= state.goal ? 'goal-reached' : ''}`;
    
    setTimeout(() => {
      // Sin mínimos del 5% que inflen el gráfico a niveles bajos
      bar.style.height = `${Math.min(Math.max(pct, 0), 100)}%`;
    }, 10);

    const label = document.createElement('div');
    label.className = 'bar-day';
    label.innerText = dayName;

    barContainer.appendChild(bar);
    barContainer.appendChild(label);
    chartEl.appendChild(barContainer);
  }
}

// Registro de SW externo
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registrado con éxito', reg))
      .catch(err => console.error('Error al registrar el Service Worker', err));
  });
}

// Inicialización de la App
checkStreak();
render();

window.addEventListener('focus', () => {
  checkStreak();
  render();
});
setInterval(updateTimerDisplay, 60000);
