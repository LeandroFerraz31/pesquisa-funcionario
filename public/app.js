const API_BASE_URL = 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/api`;

// Estado global
let isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
const ALL_UNITS = ['Logística', 'Britagem', 'SST', 'Oficina', 'LABORATORIO', 'Matriz', 'CA', 'F1', 'F2', 'F3', 'F5', 'F6', 'F7', 'F9', 'F10', 'F12', 'F14', 'F17', 'F18'];
const MATRIX_UNITS = ['Logística', 'Britagem', 'SST', 'Oficina', 'LABORATORIO', 'Matriz'];
const FILIAL_UNITS = ['F1', 'F2', 'F3', 'F5', 'F6', 'F7', 'F9', 'F10', 'F12', 'F14', 'F17', 'F18'];
let currentFilter = 'ALL';

// Função de login
function handleLogin() {
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("login-error");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const result = await response.json();
      if (result.success) {
        isAuthenticated = true;
        localStorage.setItem('isAuthenticated', 'true');
        document.getElementById("login-container").style.display = "none";
        document.getElementById("app-container").style.display = "block";
        error.textContent = "";
        await updateDashboard();
        await updateDetailedView();
      } else {
        error.textContent = result.message || "Erro desconhecido";
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      error.textContent = `Erro ao fazer login: ${err.message}`;
    }
  });
}

// Função de logout
function handleLogout() {
  document.getElementById("back-to-login").addEventListener("click", () => {
    isAuthenticated = false;
    localStorage.removeItem('isAuthenticated');
    document.getElementById("app-container").style.display = "none";
    document.getElementById("login-container").style.display = "flex";
    document.getElementById("login-form").reset();
    document.getElementById("login-error").textContent = "";
  });
}

// Função de troca de tema
function handleThemeToggle() {
  document.getElementById("theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem('theme', document.body.classList.contains("dark-theme") ? "dark" : "light");
    updateDashboard(); // Recarregar gráficos com as cores ajustadas
  });

  // Carregar tema salvo
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === "dark") document.body.classList.add("dark-theme");
}

// Função para alternar abas
function showTab(tabId) {
  if (!isAuthenticated) return;
  document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  const activeTab = document.getElementById(tabId);
  activeTab.style.display = "block";
  document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add("active");
  if (tabId === "survey") {
    document.getElementById("survey-error").textContent = "";
    document.querySelectorAll(".required-star").forEach(star => star.style.display = "none");
  }
}

// Função para processar dados do dashboard
function processDashboardData(responses, filter = 'ALL') {
  let filteredResponses = filter === 'ALL' ? responses : responses.filter(r => r.unit === filter);

  // Respostas por Unidade (Barras)
  const unitCounts = ALL_UNITS.reduce((acc, unit) => {
    acc[unit] = filteredResponses.filter(r => r.unit === unit).length;
    return acc;
  }, {});

  // Saúde Geral (Donut)
  const healthCounts = { "EXCELENTE": 0, "MUITO BOA": 0, "BOA": 0, "RAZOÁVEL": 0, "DEFICITÁRIA": 0 };
  filteredResponses.forEach(r => r.q22 && healthCounts[r.q22]++);

  // Tendência de Carga de Trabalho (Linha) com impacto das filiais
  const trendData = {};
  const filialImpact = {};
  filteredResponses.forEach(r => {
    const month = new Date(r.timestamp).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const isHighLoad = r.q1 === 'FREQUENTEMENTE' || r.q1 === 'SEMPRE';
    trendData[month] = (trendData[month] || 0) + (isHighLoad ? 1 : 0);
    if (FILIAL_UNITS.includes(r.unit)) {
      filialImpact[month] = (filialImpact[month] || 0) + (isHighLoad ? 1 : 0);
    }
  });

  // Matriz vs CA vs Filiais (Barras)
  const comparisonCounts = {
    "Matriz": { "FREQUENTEMENTE/SEMPRE": 0, "ÀS VEZES": 0, "NUNCA/QUASE NUNCA/RARAMENTE": 0 },
    "CA": { "FREQUENTEMENTE/SEMPRE": 0, "ÀS VEZES": 0, "NUNCA/QUASE NUNCA/RARAMENTE": 0 },
    "Filiais": { "FREQUENTEMENTE/SEMPRE": 0, "ÀS VEZES": 0, "NUNCA/QUASE NUNCA/RARAMENTE": 0 }
  };
  filteredResponses.forEach(r => {
    const category = r.q1 === "FREQUENTEMENTE" || r.q1 === "SEMPRE" ? "FREQUENTEMENTE/SEMPRE" :
                     r.q1 === "ÀS VEZES" ? "ÀS VEZES" : "NUNCA/QUASE NUNCA/RARAMENTE";
    if (MATRIX_UNITS.includes(r.unit)) {
      comparisonCounts["Matriz"][category]++;
    } else if (r.unit === "CA") {
      comparisonCounts["CA"][category]++;
    } else if (FILIAL_UNITS.includes(r.unit)) {
      comparisonCounts["Filiais"][category]++;
    }
  });

  return { unitCounts, healthCounts, trendData, comparisonCounts, filialImpact };
}

// Função para atualizar o dashboard
async function updateDashboard(filter = 'ALL') {
  if (!isAuthenticated) return;
  try {
    const response = await fetch(`${API_URL}/responses`, { headers: { "Accept": "application/json" }, credentials: 'include' });
    if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
    const responses = await response.json();

    // Alternar para "ALL" se clicar novamente na mesma unidade
    if (currentFilter === filter) filter = 'ALL';
    currentFilter = filter;

    const { unitCounts, healthCounts, trendData, comparisonCounts, filialImpact } = processDashboardData(responses, filter);

    // Destruir gráficos existentes
    if (window.unitChart) window.unitChart.destroy();
    if (window.healthChart) window.healthChart.destroy();
    if (window.trendChart) window.trendChart.destroy();
    if (window.comparisonChart) window.comparisonChart.destroy();

    // Gráfico de Barras: Respostas por Unidade
    const unitCtx = document.getElementById('unit-chart').getContext('2d');
    window.unitChart = new Chart(unitCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(unitCounts),
        datasets: [{
          label: 'Respostas',
          data: Object.values(unitCounts),
          backgroundColor: '#ff9500',
          borderColor: '#e07b00',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Respostas', font: { size: 12 } }, ticks: { font: { size: 10, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } } },
          x: { ticks: { font: { size: 10, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' }, maxRotation: 45, minRotation: 45 } }
        },
        plugins: {
          legend: { display: false, labels: { color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } },
          datalabels: { color: document.body.classList.contains('dark-theme') ? '#fff' : '#333', font: { size: 10, weight: 'bold' }, formatter: value => value > 0 ? value : '' }
        }
      },
      plugins: [ChartDataLabels]
    });

    // Gráfico Donut: Saúde Geral
    const healthCtx = document.getElementById('health-chart').getContext('2d');
    window.healthChart = new Chart(healthCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(healthCounts),
        datasets: [{
          data: Object.values(healthCounts),
          backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d'],
          borderColor: ['#0056b3', '#218838', '#e0a800', '#c82333', '#5a6268'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 10, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } } },
          datalabels: {
            color: document.body.classList.contains('dark-theme') ? '#fff' : '#333',
            font: { size: 10, weight: 'bold' },
            formatter: (value, ctx) => {
              const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
              return value > 0 ? `${((value / sum) * 100).toFixed(1)}%` : '';
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });

    // Gráfico de Linha: Tendência
    const trendCtx = document.getElementById('trend-chart').getContext('2d');
    window.trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: Object.keys(trendData),
        datasets: [
          {
            label: 'Carga Alta (Total)',
            data: Object.values(trendData),
            backgroundColor: 'rgba(255, 149, 0, 0.2)',
            borderColor: '#ff9500',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          },
          {
            label: 'Impacto Filiais',
            data: Object.values(filialImpact),
            backgroundColor: 'rgba(40, 167, 69, 0.2)',
            borderColor: '#28a745',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Respostas', font: { size: 12, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } }, ticks: { font: { size: 10, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } } },
          x: { ticks: { font: { size: 10, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' }, maxRotation: 45, minRotation: 45 } }
        },
        plugins: {
          legend: { labels: { font: { size: 10, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } } },
          datalabels: { color: document.body.classList.contains('dark-theme') ? '#fff' : '#333', font: { size: 10, weight: 'bold' }, formatter: value => value > 0 ? value : '' }
        }
      },
      plugins: [ChartDataLabels]
    });

    // Gráfico de Comparação: Matriz vs CA vs Filiais
    const comparisonCtx = document.getElementById('comparison-chart').getContext('2d');
    window.comparisonChart = new Chart(comparisonCtx, {
      type: 'bar',
      data: {
        labels: ['FREQUENTEMENTE/SEMPRE', 'ÀS VEZES', 'NUNCA/QUASE NUNCA/RARAMENTE'],
        datasets: [
          { label: 'Matriz', data: Object.values(comparisonCounts['Matriz']), backgroundColor: 'rgba(0, 123, 255, 0.5)', borderColor: '#0056b3', borderWidth: 1 },
          { label: 'CA', data: Object.values(comparisonCounts['CA']), backgroundColor: 'rgba(40, 167, 69, 0.5)', borderColor: '#218838', borderWidth: 1 },
          { label: 'Filiais', data: Object.values(comparisonCounts['Filiais']), backgroundColor: 'rgba(255, 193, 7, 0.5)', borderColor: '#e0a800', borderWidth: 1 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Respostas', font: { size: 12, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } }, ticks: { font: { size: 10, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } } },
          x: { ticks: { font: { size: 10, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } } }
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 10, color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } } },
          datalabels: { color: document.body.classList.contains('dark-theme') ? '#fff' : '#333', font: { size: 10, weight: 'bold' }, formatter: value => value > 0 ? value : '' }
        }
      },
      plugins: [ChartDataLabels]
    });

    // Lista de Unidades
    const unitList = document.getElementById('unit-list');
    unitList.innerHTML = '';
    ALL_UNITS.forEach(unit => {
      const li = document.createElement('li');
      li.className = 'unit-item';
      li.textContent = `${unit}: ${unitCounts[unit] || 0} respostas`;
      li.addEventListener('click', () => updateDashboard(unit));
      unitList.appendChild(li);
    });
  } catch (err) {
    console.error("Erro ao atualizar dashboard:", err);
    alert("Erro ao carregar dados do dashboard: " + err.message);
  }
}

// Função para atualizar a visão detalhada
async function updateDetailedView(unitFilter = "ALL") {
  if (!isAuthenticated) return;
  try {
    const tbodyElement = document.getElementById("data-table")?.querySelector("tbody");
    const cardContainerElement = document.getElementById("data-cards");
    if (!tbodyElement || !cardContainerElement) throw new Error("Elementos 'data-table' ou 'data-cards' não encontrados");

    const response = await fetch(`${API_URL}/responses`, { headers: { "Accept": "application/json" }, credentials: 'include' });
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    let responses = await response.json();
    if (unitFilter !== "ALL") responses = responses.filter(r => r.unit === unitFilter);

    tbodyElement.innerHTML = "";
    cardContainerElement.innerHTML = "";

    responses.forEach(r => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${r.unit}</td>
        <td>${new Date(r.timestamp).toLocaleString('pt-BR')}</td>
        <td>${r.q1}</td>
        <td>${r.q2}</td>
        <td>${r.q3}</td>
        <td>
          <button class="edit-btn" onclick="editResponse(${r.id})">Editar</button>
          <button class="delete-btn" onclick="deleteResponse(${r.id})">Excluir</button>
        </td>
      `;
      tbodyElement.appendChild(row);

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-header" onclick="toggleCard(this)">
          <span>${r.unit} - ${new Date(r.timestamp).toLocaleString('pt-BR')}</span>
          <span>▼</span>
        </div>
        <div class="card-content">
          <p><strong>Carga Mal Distribuída:</strong> ${r.q1}</p>
          <p><strong>Interfere Vida Pessoal:</strong> ${r.q2}</p>
          <p><strong>Carga Adequada:</strong> ${r.q3}</p>
          <p><strong>Cansaço Físico:</strong> ${r.q4 || ''}</p>
          <p><strong>Energia Física:</strong> ${r.q5 || ''}</p>
          <p><strong>Energia Mental:</strong> ${r.q6 || ''}</p>
          <p><strong>Esgotamento Emocional:</strong> ${r.q7 || ''}</p>
          <p><strong>Frustração:</strong> ${r.q8 || ''}</p>
          <p><strong>Pressão Excessiva:</strong> ${r.q9 || ''}</p>
          <p><strong>Esforço Mental:</strong> ${r.q10 || ''}</p>
          <p><strong>Esforço Físico:</strong> ${r.q11 || ''}</p>
          <p><strong>Monotonia:</strong> ${r.q12 || ''}</p>
          <p><strong>Desafiador:</strong> ${r.q13 || ''}</p>
          <p><strong>Gratificante:</strong> ${r.q14 || ''}</p>
          <p><strong>Crescimento Profissional:</strong> ${r.q15 || ''}</p>
          <p><strong>Feedback Adequado:</strong> ${r.q16 || ''}</p>
          <p><strong>Comunicação Eficaz:</strong> ${r.q17 || ''}</p>
          <p><strong>Colaboração Equipe:</strong> ${r.q18 || ''}</p>
          <p><strong>Ambiente Seguro:</strong> ${r.q19 || ''}</p>
          <p><strong>Ambiente Confortável:</strong> ${r.q20 || ''}</p>
          <p><strong>Condições Saúde:</strong> ${r.q21 || ''}</p>
          <p><strong>Saúde Geral:</strong> ${r.q22 || ''}</p>
          <p><strong>Qualidade Sono:</strong> ${r.q23 || ''}</p>
          <p><strong>Alimentação:</strong> ${r.q24 || ''}</p>
          <p><strong>Vida Social:</strong> ${r.q25 || ''}</p>
          <p><strong>Vida Familiar:</strong> ${r.q26 || ''}</p>
          <p><strong>Bem-Estar:</strong> ${r.q27 || ''}</p>
          <p><strong>Reconhecimento:</strong> ${r.q28 || ''}</p>
          <div class="card-actions">
            <button class="edit-btn" onclick="editResponse(${r.id})">Editar</button>
            <button class="delete-btn" onclick="deleteResponse(${r.id})">Excluir</button>
          </div>
        </div>
      `;
      cardContainerElement.appendChild(card);
    });
  } catch (err) {
    console.error("Erro ao atualizar visão detalhada:", err);
  }
}

// Função para alternar visibilidade do card
function toggleCard(header) {
  if (!isAuthenticated) return;
  const content = header.nextElementSibling;
  content.classList.toggle("show");
  header.querySelector("span:last-child").textContent = content.classList.contains("show") ? "▲" : "▼";
}

// Função para editar resposta
async function editResponse(id) {
  if (!isAuthenticated) return;
  try {
    const response = await fetch(`${API_URL}/responses/${id}`, { headers: { "Accept": "application/json" }, credentials: 'include' });
    if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
    const r = await response.json();
    if (r) {
      document.getElementById("edit-id").value = r.id;
      document.getElementById("survey-unit").value = r.unit;
      for (let i = 1; i <= 28; i++) {
        document.getElementById("survey-form").querySelector(`[name='q${i}']`).value = r[`q${i}`] || '';
      }
      showTab("survey");
    }
  } catch (err) {
    console.error("Erro ao editar resposta:", err);
    alert("Erro ao carregar dados para edição: " + err.message);
  }
}

// Função para excluir resposta
async function deleteResponse(id) {
  if (!isAuthenticated) return;
  if (confirm("Tem certeza que deseja excluir esta resposta?")) {
    try {
      const response = await fetch(`${API_URL}/responses/${id}`, { method: "DELETE", headers: { "Accept": "application/json" }, credentials: 'include' });
      if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
      await updateDashboard(currentFilter);
      await updateDetailedView(document.getElementById("unit-filter").value);
      alert("Resposta excluída com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir resposta:", err);
      alert("Erro ao excluir resposta: " + err.message);
    }
  }
}

// Função para enviar/atualizar pesquisa
function handleSurveySubmit() {
  document.getElementById("survey-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const error = document.getElementById("survey-error");
    const editId = formData.get("edit-id");

    if (!isAuthenticated) {
      error.textContent = "Sessão expirada. Faça login novamente.";
      return;
    }

    document.querySelectorAll(".required-star").forEach(star => star.style.display = "none");

    const selects = document.querySelectorAll("#survey-form select");
    let isValid = true;
    selects.forEach(select => {
      const star = select.nextElementSibling;
      if (!select.value) {
        isValid = false;
        star.style.display = "inline";
      }
    });

    if (!isValid) {
      error.textContent = "Por favor, preencha todos os campos obrigatórios.";
      return;
    }

    const response = {
      unit: formData.get("survey-unit"),
      q1: formData.get("q1"), q2: formData.get("q2"), q3: formData.get("q3"),
      q4: formData.get("q4"), q5: formData.get("q5"), q6: formData.get("q6"),
      q7: formData.get("q7"), q8: formData.get("q8"), q9: formData.get("q9"),
      q10: formData.get("q10"), q11: formData.get("q11"), q12: formData.get("q12"),
      q13: formData.get("q13"), q14: formData.get("q14"), q15: formData.get("q15"),
      q16: formData.get("q16"), q17: formData.get("q17"), q18: formData.get("q18"),
      q19: formData.get("q19"), q20: formData.get("q20"), q21: formData.get("q21"),
      q22: formData.get("q22"), q23: formData.get("q23"), q24: formData.get("q24"),
      q25: formData.get("q25"), q26: formData.get("q26"), q27: formData.get("q27"),
      q28: formData.get("q28")
    };

    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `${API_URL}/responses/${editId}` : `${API_URL}/responses`;
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(response),
        credentials: 'include'
      });

      if (!res.ok) throw new Error(`Erro na requisição: ${res.status}`);

      await updateDashboard(currentFilter);
      await updateDetailedView(document.getElementById("unit-filter").value);
      alert(editId ? "Resposta atualizada com sucesso!" : "Pesquisa enviada com sucesso!");
      document.getElementById("survey-form").reset();
      document.getElementById("edit-id").value = "";
      showTab("survey");
    } catch (err) {
      console.error("Erro ao enviar/atualizar pesquisa:", err);
      error.textContent = `Erro ao enviar/atualizar pesquisa: ${err.message}`;
    }
  });
}

// Função para filtrar visão detalhada
function handleDetailedViewFilter() {
  document.getElementById("unit-filter").addEventListener("change", (e) => {
    if (isAuthenticated) updateDetailedView(e.target.value);
  });
}

// Inicialização
window.addEventListener('load', () => {
  handleLogin();
  handleLogout();
  handleThemeToggle();
  handleSurveySubmit();
  handleDetailedViewFilter();

  if (isAuthenticated) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").style.display = "block";
    showTab("dashboard");
    updateDashboard();
    updateDetailedView();
  }
});

// Inicializar abas
showTab("dashboard");