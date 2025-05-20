const API_BASE_URL = 'http://localhost:80';
const API_URL = `${API_BASE_URL}/api`;

// Estado de autenticação
let isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

// Unidades que compõem a Matriz
const MATRIX_UNITS = ['Logística', 'Britagem', 'SST', 'Oficina', 'LABORATORIO', 'Matriz'];

// Todas as unidades para o gráfico Visão por Unidade
const ALL_UNITS = [
  'Logística', 'Britagem', 'SST', 'Oficina', 'LABORATORIO', 'Matriz', 'CA',
  'F1', 'F2', 'F3', 'F5', 'F6', 'F7', 'F9', 'F10', 'F12', 'F14', 'F17', 'F18'
];

// Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("login-error");

  if (!username || !password) {
    error.textContent = "Preencha todos os campos";
    return;
  }

  try {
    console.log('Enviando requisição para:', `${API_URL}/login`);
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const rawResponse = await response.text();
    console.log("Resposta bruta do login:", rawResponse);

    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
        const jsonError = JSON.parse(rawResponse);
        errorMessage = jsonError.message || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }

    const result = JSON.parse(rawResponse);
    if (result.success) {
      isAuthenticated = true;
      localStorage.setItem('isAuthenticated', 'true');
      document.getElementById("login-container").style.display = "none";
      document.getElementById("login-container").setAttribute("aria-hidden", "true");
      document.getElementById("app-container").style.display = "block";
      document.getElementById("app-container").removeAttribute("aria-hidden");
      error.textContent = "";
      document.querySelector(".tabs button").focus();
      await updateDashboard("ALL").catch(err => console.error("Erro ao inicializar dashboard:", err));
      await updateDetailedView().catch(err => console.error("Erro ao inicializar visão detalhada:", err));
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
  document.getElementById("login-container").style.display = "block";
  document.getElementById("app-container").setAttribute("aria-hidden", "true");
  document.getElementById("login-container").removeAttribute("aria-hidden");
  document.getElementById("login-form").reset();
  document.getElementById("login-error").textContent = "";
});

// Verificar autenticação ao carregar
window.addEventListener('load', () => {
  if (isAuthenticated) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("login-container").setAttribute("aria-hidden", "true");
    document.getElementById("app-container").style.display = "block";
    document.getElementById("app-container").removeAttribute("aria-hidden");
    showTab("dashboard");
    updateDashboard("ALL").catch(err => console.error("Erro ao inicializar dashboard:", err));
    updateDetailedView().catch(err => console.error("Erro ao inicializar visão detalhada:", err));
  }
});

// Navegação por abas
function showTab(tabId) {
  if (!isAuthenticated) return;
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.style.display = "none";
    tab.setAttribute("aria-hidden", "true");
  });
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  const activeTab = document.getElementById(tabId);
  activeTab.style.display = "block";
  activeTab.removeAttribute("aria-hidden");
  document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add("active");
  if (tabId === "survey") {
    document.getElementById("survey-error").textContent = "";
    document.querySelectorAll(".required-star").forEach(star => star.style.display = "none");
  }
}

// Filtro de unidade, comparação e indicador
document.getElementById("unit-filter").addEventListener("change", (e) => {
  if (isAuthenticated) updateDashboard(e.target.value).catch(err => console.error("Erro ao atualizar dashboard:", err));
});
document.getElementById("compare-unit").addEventListener("change", (e) => {
  if (isAuthenticated) updateDashboard(document.getElementById("unit-filter").value).catch(err => console.error("Erro ao atualizar dashboard:", err));
});
document.getElementById("problem-filter").addEventListener("change", (e) => {
  if (isAuthenticated) updateDashboard(document.getElementById("unit-filter").value).catch(err => console.error("Erro ao atualizar dashboard:", err));
});
document.getElementById("health-unit-filter").addEventListener("change", (e) => {
  if (isAuthenticated) updateDashboard(document.getElementById("unit-filter").value).catch(err => console.error("Erro ao atualizar dashboard:", err));
});

// Processar dados para gráficos
function processData(responses, filterUnit = "ALL") {
  const workloadCounts = { "NUNCA/QUASE NUNCA": 0, "RARAMENTE": 0, "ÀS VEZES": 0, "FREQUENTEMENTE": 0, "SEMPRE": 0 };
  const healthCounts = { "EXCELENTE": 0, "MUITO BOA": 0, "BOA": 0, "RAZOÁVEL": 0, "DEFICITÁRIA": 0 };
  const emotionalExhaustionCounts = { "NUNCA/QUASE NUNCA": 0, "RARAMENTE": 0, "ÀS VEZES": 0, "FREQUENTEMENTE": 0, "SEMPRE": 0 };

  const filteredResponses = filterUnit === "ALL" ? responses : responses.filter(r => r.unit === filterUnit);
  filteredResponses.forEach(r => {
    if (r.q1) workloadCounts[r.q1] = (workloadCounts[r.q1] || 0) + 1;
    if (r.q22) healthCounts[r.q22] = (healthCounts[r.q22] || 0) + 1;
    if (r.q7) emotionalExhaustionCounts[r.q7] = (emotionalExhaustionCounts[r.q7] || 0) + 1;
  });

  const workloadMax = Math.max(...Object.values(workloadCounts)) * 1.1 || 10;
  const emotionalExhaustionMax = Math.max(...Object.values(emotionalExhaustionCounts)) * 1.1 || 10;

  return { workloadCounts, healthCounts, emotionalExhaustionCounts, workloadMax, emotionalExhaustionMax };
}

// Processar dados para gráfico comparativo
function processComparisonData(matrixResponses, compareResponses) {
  const matrixCounts = { "NUNCA/QUASE NUNCA": 0, "RARAMENTE": 0, "ÀS VEZES": 0, "FREQUENTEMENTE": 0, "SEMPRE": 0 };
  const compareCounts = { "NUNCA/QUASE NUNCA": 0, "RARAMENTE": 0, "ÀS VEZES": 0, "FREQUENTEMENTE": 0, "SEMPRE": 0 };

  matrixResponses.forEach(r => {
    if (r.q1) matrixCounts[r.q1] = (matrixCounts[r.q1] || 0) + 1;
  });
  compareResponses.forEach(r => {
    if (r.q1) compareCounts[r.q1] = (compareCounts[r.q1] || 0) + 1;
  });

  const comparisonMax = Math.max(...Object.values(matrixCounts), ...Object.values(compareCounts)) * 1.1 || 10;

  return { matrixCounts, compareCounts, comparisonMax };
}

// Processar dados para gráfico Visão por Unidade
function processUnitOverviewData(responses, question) {
  const unitCounts = ALL_UNITS.reduce((acc, unit) => {
    acc[unit] = 0;
    return acc;
  }, {});

  responses.forEach(r => {
    if (r[question] && (r[question] === "FREQUENTEMENTE" || r[question] === "SEMPRE" || r[question] === "RAZOÁVEL" || r[question] === "DEFICITÁRIA")) {
      unitCounts[r.unit] = (unitCounts[r.unit] || 0) + 1;
    }
  });

  const unitOverviewMax = Math.max(...Object.values(unitCounts)) * 1.1 || 10;

  return { unitCounts, unitOverviewMax };
}

// Atualizar dashboard
async function updateDashboard(unit) {
  if (!isAuthenticated) return;
  try {
    console.log('Fazendo requisição para:', `${API_URL}/responses`);
    const response = await fetch(`${API_URL}/responses`, {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      const errText = await response.text();
      console.log('Resposta de erro da API:', errText);
      throw new Error(`Erro na requisição: ${response.status} - ${errText}`);
    }
    const allResponses = await response.json();
    console.log('Dados recebidos:', allResponses);

    let filteredResponses = unit === "Matriz" ? allResponses.filter(r => MATRIX_UNITS.includes(r.unit)) : unit === "ALL" ? allResponses : allResponses.filter(r => r.unit === unit);

    const compareUnit = document.getElementById("compare-unit").value;
    const question = document.getElementById("problem-filter").value;
    const healthUnit = document.getElementById("health-unit-filter").value;
    const matrixResponses = allResponses.filter(r => MATRIX_UNITS.includes(r.unit));
    const compareResponses = allResponses.filter(r => r.unit === compareUnit);

    const { workloadCounts, healthCounts, emotionalExhaustionCounts, workloadMax, emotionalExhaustionMax } = processData(filteredResponses, healthUnit);
    const { matrixCounts, compareCounts, comparisonMax } = processComparisonData(matrixResponses, compareResponses);
    const { unitCounts, unitOverviewMax } = processUnitOverviewData(allResponses, question);

    const fact = document.getElementById("interesting-fact").querySelector("p");
    fact.textContent = unit === "ALL"
      ? "Logística e F1 reportam alta exaustão física, com muitos funcionários sentindo cansaço frequente."
      : unit === "Matriz"
      ? "A Matriz (incluindo Logística, Britagem, SST, Oficina, Laboratório) apresenta desafios com exaustão física."
      : `${unit} apresenta desafios com exaustão física impactando o bem-estar.`;

    if (window.workloadChart) window.workloadChart.destroy();
    if (window.healthChart) window.healthChart.destroy();
    if (window.emotionalExhaustionChart) window.emotionalExhaustionChart.destroy();
    if (window.comparisonChart) window.comparisonChart.destroy();
    if (window.unitOverviewChart) window.unitOverviewChart.destroy();

    const workloadCtx = document.getElementById("workload-chart").getContext("2d");
    window.workloadChart = new Chart(workloadCtx, {
      type: "bar",
      data: {
        labels: ["NUNCA/QUASE NUNCA", "RARAMENTE", "ÀS VEZES", "FREQUENTEMENTE", "SEMPRE"],
        datasets: [{
          label: "Respostas",
          data: Object.values(workloadCounts),
          backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6c757d"],
          borderColor: ["#0056b3", "#218838", "#e0a800", "#c82333", "#5a6268"],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 1000, easing: "easeOutBounce" },
        scales: {
          y: { beginAtZero: true, suggestedMax: workloadMax, title: { display: true, text: "Número de Respostas" }, ticks: { font: { size: 16 } } },
          x: { title: { display: true, text: "Frequência" }, ticks: { font: { size: 16 } } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: "#333", titleFont: { size: 16 }, bodyFont: { size: 14 } },
          datalabels: { anchor: 'end', align: 'top', color: '#333', font: { size: 16, weight: 'bold' }, formatter: (value) => value > 0 ? value : '' }
        }
      },
      plugins: [ChartDataLabels]
    });

    const healthCtx = document.getElementById("health-chart").getContext("2d");
    window.healthChart = new Chart(healthCtx, {
      type: "pie",
      data: {
        labels: ["EXCELENTE", "MUITO BOA", "BOA", "RAZOÁVEL", "DEFICITÁRIA"],
        datasets: [{
          data: Object.values(healthCounts),
          backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6c757d"],
          borderColor: ["#0056b3", "#218838", "#e0a800", "#c82333", "#5a6268"],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 1000, easing: "easeInOutQuad" },
        plugins: {
          legend: { position: "bottom", labels: { font: { size: 16 }, boxWidth: 20 } },
          tooltip: { backgroundColor: "#333", titleFont: { size: 16 }, bodyFont: { size: 14 } },
          datalabels: { color: "#fff", formatter: (value, ctx) => { let sum = ctx.dataset.data.reduce((a, b) => a + b, 0); return value > 0 ? ((value / sum) * 100).toFixed(1) + "%" : ""; }, font: { size: 16, weight: 'bold' } }
        }
      },
      plugins: [ChartDataLabels]
    });

    const emotionalExhaustionCtx = document.getElementById("emotional-exhaustion-chart").getContext("2d");
    window.emotionalExhaustionChart = new Chart(emotionalExhaustionCtx, {
      type: "bar",
      data: {
        labels: ["NUNCA/QUASE NUNCA", "RARAMENTE", "ÀS VEZES", "FREQUENTEMENTE", "SEMPRE"],
        datasets: [{
          label: "Respostas",
          data: Object.values(emotionalExhaustionCounts),
          backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6c757d"],
          borderColor: ["#0056b3", "#218838", "#e0a800", "#c82333", "#5a6268"],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 1000, easing: "easeOutBounce" },
        scales: {
          y: { beginAtZero: true, suggestedMax: emotionalExhaustionMax, title: { display: true, text: "Número de Respostas" }, ticks: { font: { size: 16 } } },
          x: { title: { display: true, text: "Frequência" }, ticks: { font: { size: 16 } } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: "#333", titleFont: { size: 16 }, bodyFont: { size: 14 } },
          datalabels: { anchor: 'end', align: 'top', color: '#333', font: { size: 16, weight: 'bold' }, formatter: (value) => value > 0 ? value : '' }
        }
      },
      plugins: [ChartDataLabels]
    });

    const comparisonCtx = document.getElementById("comparison-chart").getContext("2d");
    window.comparisonChart = new Chart(comparisonCtx, {
      type: "bar",
      data: {
        labels: ["NUNCA/QUASE NUNCA", "RARAMENTE", "ÀS VEZES", "FREQUENTEMENTE", "SEMPRE"],
        datasets: [
          { label: "Matriz", data: Object.values(matrixCounts), backgroundColor: "rgba(0, 123, 255, 0.5)", borderColor: "#0056b3", borderWidth: 1 },
          { label: compareUnit, data: Object.values(compareCounts), backgroundColor: "rgba(255, 193, 7, 0.5)", borderColor: "#e0a800", borderWidth: 1 }
        ]
      },
      options: {
        responsive: true,
        animation: { duration: 1000, easing: "easeOutBounce" },
        scales: {
          y: { beginAtZero: true, suggestedMax: comparisonMax, title: { display: true, text: "Número de Respostas" }, ticks: { font: { size: 16 } } },
          x: { title: { display: true, text: "Frequência (Carga de Trabalho)" }, ticks: { font: { size: 16 } } }
        },
        plugins: {
          legend: { position: "top", labels: { font: { size: 16 }, boxWidth: 20 } },
          tooltip: { backgroundColor: "#333", titleFont: { size: 16 }, bodyFont: { size: 14 } },
          datalabels: { anchor: 'end', align: 'top', color: '#333', font: { size: 16, weight: 'bold' }, formatter: (value) => value > 0 ? value : '' }
        }
      },
      plugins: [ChartDataLabels]
    });

    const unitOverviewCtx = document.getElementById("unit-overview-chart").getContext("2d");
    window.unitOverviewChart = new Chart(unitOverviewCtx, {
      type: "bar",
      data: {
        labels: ALL_UNITS,
        datasets: [{
          label: "Respostas (FREQUENTEMENTE/SEMPRE ou RAZOÁVEL/DEFICITÁRIA)",
          data: Object.values(unitCounts),
          backgroundColor: ALL_UNITS.map((_, i) => `hsl(${i * 360 / ALL_UNITS.length}, 70%, 50%)`),
          borderColor: ALL_UNITS.map((_, i) => `hsl(${i * 360 / ALL_UNITS.length}, 70%, 40%)`),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 1000, easing: "easeOutBounce" },
        scales: {
          y: { beginAtZero: true, suggestedMax: unitOverviewMax, title: { display: true, text: "Número de Respostas" }, ticks: { font: { size: 16 } } },
          x: { title: { display: true, text: "Unidades" }, ticks: { font: { size: 16 }, autoSkip: false, maxRotation: 45, minRotation: 45 } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: "#333", titleFont: { size: 16 }, bodyFont: { size: 14 } },
          datalabels: { anchor: 'end', align: 'top', color: '#333', font: { size: 16, weight: 'bold' }, formatter: (value) => value > 0 ? value : '' }
        }
      },
      plugins: [ChartDataLabels]
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
    if (!tbodyElement || !cardContainerElement) {
      throw new Error("Elementos 'data-table' ou 'data-cards' não encontrados no DOM");
    }

    console.log('Fazendo requisição para:', `${API_URL}/responses`);
    const response = await fetch(`${API_URL}/responses`, {
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log('Resposta de erro da API:', errText);
      throw new Error(`Erro HTTP: ${response.status} - ${errText}`);
    }

    const responses = await response.json();
    console.log('Dados recebidos:', responses);

    if (!Array.isArray(responses)) {
      throw new Error("Dados retornados pela API não são um array");
    }

    tbodyElement.innerHTML = "";
    cardContainerElement.innerHTML = "";

    responses.forEach((r) => {
      if (!r.unit || !r.timestamp || !r.q1 || !r.q2 || !r.q3) {
        console.warn(`Resposta com ID ${r.id} está incompleta:`, r);
        return;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${r.unit}</td>
        <td>${new Date(r.timestamp).toLocaleString('pt-BR')}</td>
        <td>${r.q1}</td><td>${r.q2}</td><td>${r.q3}</td>
        <td>${r.q4 || ''}</td><td>${r.q5 || ''}</td><td>${r.q6 || ''}</td>
        <td>${r.q7 || ''}</td><td>${r.q8 || ''}</td><td>${r.q9 || ''}</td>
        <td>${r.q10 || ''}</td><td>${r.q11 || ''}</td><td>${r.q12 || ''}</td>
        <td>${r.q13 || ''}</td><td>${r.q14 || ''}</td><td>${r.q15 || ''}</td>
        <td>${r.q16 || ''}</td><td>${r.q17 || ''}</td><td>${r.q18 || ''}</td>
        <td>${r.q19 || ''}</td><td>${r.q20 || ''}</td><td>${r.q21 || ''}</td>
        <td>${r.q22 || ''}</td><td>${r.q23 || ''}</td><td>${r.q24 || ''}</td>
        <td>${r.q25 || ''}</td><td>${r.q26 || ''}</td><td>${r.q27 || ''}</td>
        <td>${r.q28 || ''}</td>
        <td><button class="edit-btn" onclick="editResponse(${r.id})">Editar</button></td>
        <td><button class="delete-btn" onclick="deleteResponse(${r.id})">Excluir</button></td>
      `;
      tbodyElement.appendChild(row);

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-header" onclick="toggleCard(this)" role="button" aria-expanded="false">
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

// Alternar visibilidade do card
function toggleCard(header) {
  if (!isAuthenticated) return;
  const content = header.nextElementSibling;
  content.classList.toggle("show");
  header.setAttribute("aria-expanded", content.classList.contains("show"));
  header.querySelector("span:last-child").textContent = content.classList.contains("show") ? "▲" : "▼";
}

// Editar resposta
async function editResponse(id) {
  if (!isAuthenticated) return;
  try {
    console.log('Fazendo requisição para:', `${API_URL}/responses/${id}`);
    const response = await fetch(`${API_URL}/responses/${id}`, {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      const errText = await response.text();
      console.log('Resposta de erro da API:', errText);
      throw new Error(`Erro na requisição: ${response.status} - ${errText}`);
    }
    const r = await response.json();
    console.log('Dados recebidos:', r);
    if (r) {
      document.getElementById("edit-id").value = r.id;
      document.getElementById("survey-unit").value = r.unit;
      document.getElementById("survey-form").querySelector("[name='q1']").value = r.q1 || '';
      document.getElementById("survey-form").querySelector("[name='q2']").value = r.q2 || '';
      document.getElementById("survey-form").querySelector("[name='q3']").value = r.q3 || '';
      document.getElementById("survey-form").querySelector("[name='q4']").value = r.q4 || '';
      document.getElementById("survey-form").querySelector("[name='q5']").value = r.q5 || '';
      document.getElementById("survey-form").querySelector("[name='q6']").value = r.q6 || '';
      document.getElementById("survey-form").querySelector("[name='q7']").value = r.q7 || '';
      document.getElementById("survey-form").querySelector("[name='q8']").value = r.q8 || '';
      document.getElementById("survey-form").querySelector("[name='q9']").value = r.q9 || '';
      document.getElementById("survey-form").querySelector("[name='q10']").value = r.q10 || '';
      document.getElementById("survey-form").querySelector("[name='q11']").value = r.q11 || '';
      document.getElementById("survey-form").querySelector("[name='q12']").value = r.q12 || '';
      document.getElementById("survey-form").querySelector("[name='q13']").value = r.q13 || '';
      document.getElementById("survey-form").querySelector("[name='q14']").value = r.q14 || '';
      document.getElementById("survey-form").querySelector("[name='q15']").value = r.q15 || '';
      document.getElementById("survey-form").querySelector("[name='q16']").value = r.q16 || '';
      document.getElementById("survey-form").querySelector("[name='q17']").value = r.q17 || '';
      document.getElementById("survey-form").querySelector("[name='q18']").value = r.q18 || '';
      document.getElementById("survey-form").querySelector("[name='q19']").value = r.q19 || '';
      document.getElementById("survey-form").querySelector("[name='q20']").value = r.q20 || '';
      document.getElementById("survey-form").querySelector("[name='q21']").value = r.q21 || '';
      document.getElementById("survey-form").querySelector("[name='q22']").value = r.q22 || '';
      document.getElementById("survey-form").querySelector("[name='q23']").value = r.q23 || '';
      document.getElementById("survey-form").querySelector("[name='q24']").value = r.q24 || '';
      document.getElementById("survey-form").querySelector("[name='q25']").value = r.q25 || '';
      document.getElementById("survey-form").querySelector("[name='q26']").value = r.q26 || '';
      document.getElementById("survey-form").querySelector("[name='q27']").value = r.q27 || '';
      document.getElementById("survey-form").querySelector("[name='q28']").value = r.q28 || '';
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
      console.log('Fazendo requisição para:', `${API_URL}/responses/${id}`, 'Método:', 'DELETE');
      const response = await fetch(`${API_URL}/responses/${id}`, {
        method: "DELETE",
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) {
        const errText = await response.text();
        console.log('Resposta de erro da API:', errText);
        throw new Error(`Erro na requisição: ${response.status} - ${errText}`);
      }
      await updateDashboard(document.getElementById("unit-filter").value).catch(err => console.error("Erro ao atualizar dashboard:", err));
      await updateDetailedView().catch(err => console.error("Erro ao atualizar visão detalhada:", err));
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
  console.log("Submit iniciado");
  const formData = new FormData(e.target);
  const error = document.getElementById("survey-error");
  const editId = formData.get("edit-id");

  if (!isAuthenticated) {
    error.textContent = "Sessão expirada. Faça login novamente.";
    return;
  }

  document.querySelectorAll(".required-star").forEach(star => {
    star.style.display = "none";
  });

  const selects = document.querySelectorAll("#survey-form select");
  let isValid = true;
  let firstEmptyField = null;

  selects.forEach(select => {
    const star = select.nextElementSibling;
    if (!select.value || select.value === "") {
      isValid = false;
      if (!firstEmptyField) firstEmptyField = select;
      star.style.display = "inline";
    }
  });

  if (!isValid) {
    error.textContent = "Por favor, preencha todos os campos obrigatórios.";
    if (firstEmptyField) firstEmptyField.focus();
    return;
  }

  const unitInput = formData.get("survey-unit").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const normalizedUnit = ALL_UNITS.includes(unitInput) ? unitInput : formData.get("survey-unit");

  const response = {
    unit: normalizedUnit,
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
    console.log('Fazendo requisição para:', editId ? `${API_URL}/responses/${editId}` : `${API_URL}/responses`, 'Método:', editId ? 'PUT' : 'POST');
    const method = editId ? "PUT" : "POST";
    const url = editId ? `${API_URL}/responses/${editId}` : `${API_URL}/responses`;
    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(response)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log('Resposta de erro da API:', errText);
      throw new Error(`Erro na requisição: ${res.status} - ${errText}`);
    }

    const result = await res.json();
    console.log('Dados recebidos:', result);
    alert(editId ? "Resposta atualizada com sucesso!" : "Pesquisa enviada com sucesso!");

    await updateDashboard(document.getElementById("unit-filter").value).catch(err => console.error("Erro ao atualizar dashboard após envio:", err));
    await updateDetailedView().catch(err => console.error("Erro ao atualizar visão detalhada após envio:", err));
  } catch (err) {
    console.error("Erro ao enviar/atualizar pesquisa:", err);
    error.textContent = `Erro ao enviar/atualizar pesquisa: ${err.message}`;
    if (err.message.includes("401")) {
      isAuthenticated = false;
      localStorage.removeItem('isAuthenticated');
      document.getElementById("app-container").style.display = "none";
      document.getElementById("login-container").style.display = "block";
      document.getElementById("app-container").setAttribute("aria-hidden", "true");
      document.getElementById("login-container").removeAttribute("aria-hidden");
      document.getElementById("login-error").textContent = "Sessão expirada. Faça login novamente.";
    }
  } finally {
    document.getElementById("survey-form").reset();
    document.getElementById("edit-id").value = "";
    showTab("survey");
  }
});

// Inicializar abas
showTab("dashboard");