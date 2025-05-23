const API_BASE_URL = 'http://localhost:80';
const API_URL = `${API_BASE_URL}/api`;

// Estado de autenticação
let isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

// Unidades
const ALL_UNITS = ['Logística', 'Britagem', 'SST', 'Oficina', 'LABORATORIO', 'Matriz', 'CA', 'F1', 'F2', 'F3', 'F5', 'F6', 'F7', 'F9', 'F10', 'F12', 'F14', 'F17', 'F18'];

// Login
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

// Voltar para Login
document.getElementById("back-to-login").addEventListener("click", () => {
  isAuthenticated = false;
  localStorage.removeItem('isAuthenticated');
  document.getElementById("app-container").style.display = "none";
  document.getElementById("login-container").style.display = "flex";
  document.getElementById("login-form").reset();
  document.getElementById("login-error").textContent = "";
});

// Verificar autenticação ao carregar
window.addEventListener('load', () => {
  if (isAuthenticated) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").style.display = "block";
    showTab("dashboard");
    updateDashboard();
    updateDetailedView();
  }
});

// Navegação por abas
function showTab(tabId) {
  if (!isAuthenticated) return;
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.style.display = "none";
  });
  document.querySelectorAll(".tabs button").forEach(tab => tab.classList.remove("active"));
  const activeTab = document.getElementById(tabId);
  activeTab.style.display = "block";
  document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add("active");
  if (tabId === "survey") {
    document.getElementById("survey-error").textContent = "";
    document.querySelectorAll(".required-star").forEach(star => star.style.display = "none");
  }
}

// Processar dados para o dashboard
function processDashboardData(responses) {
  // Respostas por Unidade (Barras)
  const unitCounts = ALL_UNITS.reduce((acc, unit) => {
    acc[unit] = responses.filter(r => r.unit === unit).length;
    return acc;
  }, {});

  // Saúde Geral (Donut)
  const healthCounts = { "EXCELENTE": 0, "MUITO BOA": 0, "BOA": 0, "RAZOÁVEL": 0, "DEFICITÁRIA": 0 };
  responses.forEach(r => {
    if (r.q22) healthCounts[r.q22]++;
  });

  // Tendência de Carga de Trabalho (Linha) - por mês
  const trendData = {};
  responses.forEach(r => {
    const month = new Date(r.timestamp).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    trendData[month] = (trendData[month] || 0) + (r.q1 === 'FREQUENTEMENTE' || r.q1 === 'SEMPRE' ? 1 : 0);
  });

  return { unitCounts, healthCounts, trendData };
}

// Atualizar dashboard
async function updateDashboard() {
  if (!isAuthenticated) return;
  try {
    const response = await fetch(`${API_URL}/responses`, {
      headers: { "Accept": "application/json" },
      credentials: 'include'
    });
    if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
    const responses = await response.json();

    const { unitCounts, healthCounts, trendData } = processDashboardData(responses);

    // Destruir gráficos existentes
    if (window.unitChart) window.unitChart.destroy();
    if (window.healthChart) window.healthChart.destroy();
    if (window.trendChart) window.trendChart.destroy();

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
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Número de Respostas', color: '#fff' }, ticks: { color: '#fff' } },
          x: { ticks: { color: '#fff', maxRotation: 45, minRotation: 45 } }
        },
        plugins: {
          legend: { display: false },
          datalabels: { color: '#fff', font: { size: 14, weight: 'bold' }, formatter: value => value > 0 ? value : '' }
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
        plugins: {
          legend: { position: 'bottom', labels: { color: '#fff', font: { size: 14 } } },
          datalabels: {
            color: '#fff',
            font: { size: 14, weight: 'bold' },
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
        datasets: [{
          label: 'Carga Alta (Frequente/Sempre)',
          data: Object.values(trendData),
          backgroundColor: 'rgba(255, 149, 0, 0.2)',
          borderColor: '#ff9500',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Número de Respostas', color: '#fff' }, ticks: { color: '#fff' } },
          x: { ticks: { color: '#fff', maxRotation: 45, minRotation: 45 } }
        },
        plugins: {
          legend: { labels: { color: '#fff', font: { size: 14 } } },
          datalabels: { color: '#fff', font: { size: 14, weight: 'bold' }, formatter: value => value > 0 ? value : '' }
        }
      },
      plugins: [ChartDataLabels]
    });

    // Lista de Unidades
    const unitList = document.getElementById('unit-list');
    unitList.innerHTML = '';
    ALL_UNITS.forEach(unit => {
      const li = document.createElement('li');
      li.textContent = `${unit}: ${unitCounts[unit] || 0} respostas`;
      unitList.appendChild(li);
    });
  } catch (err) {
    console.error("Erro ao atualizar dashboard:", err);
    alert("Erro ao carregar dados do dashboard: " + err.message);
  }
}

// Atualizar visão detalhada
async function updateDetailedView() {
  if (!isAuthenticated) return;
  try {
    const tbodyElement = document.getElementById("data-table")?.querySelector("tbody");
    const cardContainerElement = document.getElementById("data-cards");
    if (!tbodyElement || !cardContainerElement) throw new Error("Elementos 'data-table' ou 'data-cards' não encontrados");

    const response = await fetch(`${API_URL}/responses`, {
      headers: { "Accept": "application/json" },
      credentials: 'include'
    });
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const responses = await response.json();

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

// Alternar visibilidade do card
function toggleCard(header) {
  if (!isAuthenticated) return;
  const content = header.nextElementSibling;
  content.classList.toggle("show");
  header.querySelector("span:last-child").textContent = content.classList.contains("show") ? "▲" : "▼";
}

// Editar resposta
async function editResponse(id) {
  if (!isAuthenticated) return;
  try {
    const response = await fetch(`${API_URL}/responses/${id}`, {
      headers: { "Accept": "application/json" },
      credentials: 'include'
    });
    if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
    const r = await response.json();
    if (r) {
      document.getElementById("edit-id").value = r.id;
      document.getElementById("survey-unit").value = r.unit;
      document.getElementById("survey-form").querySelector("[name='q1']").value = r.q1 || '';
      document.getElementById("survey-form").querySelector("[name='q2']").value = r.q2 || '';
      document.getElementById("survey-form").querySelector("[name='q3']").value = r.q3 || '';
      showTab("survey");
    }
  } catch (err) {
    console.error("Erro ao editar resposta:", err);
    alert("Erro ao carregar dados para edição: " + err.message);
  }
}

// Excluir resposta
async function deleteResponse(id) {
  if (!isAuthenticated) return;
  if (confirm("Tem certeza que deseja excluir esta resposta?")) {
    try {
      const response = await fetch(`${API_URL}/responses/${id}`, {
        method: "DELETE",
        headers: { "Accept": "application/json" },
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
      await updateDashboard();
      await updateDetailedView();
      alert("Resposta excluída com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir resposta:", err);
      alert("Erro ao excluir resposta: " + err.message);
    }
  }
}

// Formulário de pesquisa
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
    q1: formData.get("q1"),
    q2: formData.get("q2"),
    q3: formData.get("q3")
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

    await updateDashboard();
    await updateDetailedView();
    alert(editId ? "Resposta atualizada com sucesso!" : "Pesquisa enviada com sucesso!");
    document.getElementById("survey-form").reset();
    document.getElementById("edit-id").value = "";
    showTab("survey");
  } catch (err) {
    console.error("Erro ao enviar/atualizar pesquisa:", err);
    error.textContent = `Erro ao enviar/atualizar pesquisa: ${err.message}`;
  }
});

// Inicializar abas
showTab("dashboard");