    const getTodayKey = () => new Date().toISOString().split('T')[0];
    
    let state = {
      goal: parseInt(localStorage.getItem('water_goal')),
      history: JSON.parse(localStorage.getItem('water_history')) || {},
      streak: parseInt(localStorage.getItem('water_streak')) || 0,
      lastStreakUpdate: localStorage.getItem('water_last_streak_date') || '',
      lastDrinkTime: localStorage.getItem('water_last_drink_time') || ''
    };

    // 2. META INTELIGENTE: Cambia al cambiar de estación y respeta tus cambios dentro de ella
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


    if (!state.history[getTodayKey()]) {
      state.history[getTodayKey()] = 0;
    }

    // 1. LÓGICA DE RÁFAGA (STREAK) AUTOMÁTICA
    function checkStreak() {
      const today = getTodayKey();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];

      const todayWater = state.history[today] || 0;

      if (todayWater >= state.goal && state.lastStreakUpdate !== today) {
        if (state.lastStreakUpdate === yesterdayKey || state.streak === 0) {
          state.streak++;
        } else if (state.lastStreakUpdate !== today) {
          state.streak = 1;
        }
        state.lastStreakUpdate = today;
        localStorage.setItem('water_streak', state.streak);
        localStorage.setItem('water_last_streak_date', state.lastStreakUpdate);
      } 
      else if (state.lastStreakUpdate !== today && state.lastStreakUpdate !== yesterdayKey && state.streak > 0) {
        state.streak = 0;
        localStorage.setItem('water_streak', state.streak);
      }
    }

    // 3. LÓGICA DE TIEMPO TRANSCURRIDO (ÚLTIMA INGESTA)
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

    function addWater(amount) {
      const today = getTodayKey();
      state.history[today] = (state.history[today] || 0) + amount;
      
      state.lastDrinkTime = new Date().getTime().toString();
      localStorage.setItem('water_last_drink_time', state.lastDrinkTime);
      
      checkStreak();
      saveAndRender();
    }

    function removeLastWater() {
      const today = getTodayKey();
      if ((state.history[today] || 0) >= 250) {
        state.history[today] -= 250;
        saveAndRender();
      } else if ((state.history[today] || 0) > 0) {
        state.history[today] = 0;
        saveAndRender();
      }
    }

    function resetToday() {
      if(confirm('¿Seguro que quieres reiniciar el conteo de hoy?')) {
        state.history[getTodayKey()] = 0;
        state.lastDrinkTime = '';
        localStorage.removeItem('water_last_drink_time');
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
        circle.style.background = `conic-gradient(#4caf50 100%, #e3f2fd 0%)`;
      } else {
        circle.style.background = `conic-gradient(var(--primary) ${percent}%, #e3f2fd ${percent}%)`;
      }

      document.getElementById('streakDisplay').innerText = `🔥 ${state.streak} ${state.streak === 1 ? 'día' : 'días'}`;
      
      const month = new Date().getMonth();
      const isSummer = month >= 4 && month <= 8;
      document.getElementById('seasonDisplay').innerText = isSummer ? "☀️ Temp. Cálida" : "❄️ Temp. Estándar";

      updateTimerDisplay();

      const chartEl = document.getElementById('chart');
      chartEl.innerHTML = '';

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const val = state.history[key] || 0;
        
        const dayName = d.toLocaleDateString('es', { weekday: 'short' }).substring(0,2);
        const pct = Math.min((val / state.goal) * 100, 100);

        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';
        
        const bar = document.createElement('div');
        bar.className = `bar ${val >= state.goal ? 'goal-reached' : ''}`;
        bar.style.height = `${Math.max(pct, 5)}%`;

        const label = document.createElement('div');
        label.className = 'bar-day';
        label.innerText = dayName;

        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        chartEl.appendChild(barContainer);
      }
    }

    if ('serviceWorker' in navigator) {
      const swCode = `
        const CACHE = 'water-v8';
        self.addEventListener('install', e => self.skipWaiting());
        self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
      `;
      const blob = new Blob([swCode], { type: 'application/javascript' });
      navigator.serviceWorker.register(URL.createObjectURL(blob));
    }

    checkStreak();
    render();
    setInterval(updateTimerDisplay, 60000);