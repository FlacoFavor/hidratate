const getTodayKey = () => new Date().toISOString().split('T')[0];
    
    let state = {
      goal: parseInt(localStorage.getItem('water_goal')) || 2000,
      history: JSON.parse(localStorage.getItem('water_history')) || {}
    };

    if (!state.history[getTodayKey()]) {
      state.history[getTodayKey()] = 0;
    }

    function updateGoal(val) {
      state.goal = parseInt(val) || 2000;
      localStorage.setItem('water_goal', state.goal);
      render();
    }

    function addWater(amount) {
      const today = getTodayKey();
      state.history[today] = (state.history[today] || 0) + amount;
      saveAndRender();
    }

    // NUEVA FUNCIÓN: Resta un vaso estándar si el total es mayor a cero
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
        const CACHE = 'water-v7';
        self.addEventListener('install', e => self.skipWaiting());
        self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
      `;
      const blob = new Blob([swCode], { type: 'application/javascript' });
      navigator.serviceWorker.register(URL.createObjectURL(blob));
    }

    render();