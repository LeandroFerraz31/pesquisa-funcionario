// Dados simulados (baseados no Excel, com todas as unidades)
const surveyData = [
  {
    unit: "LOGISTICA",
    timestamp: "2025-05-01",
    q1: "NUNCA/QUASE NUNCA", q2: "RARAMENTE", q3: "ÀS VEZES", q4: "FREQUENTEMENTE",
    q5: "SEMPRE", q6: "ÀS VEZES", q7: "RARAMENTE", q8: "NUNCA/QUASE NUNCA",
    q9: "ÀS VEZES", q10: "FREQUENTEMENTE", q11: "SEMPRE", q12: "RARAMENTE",
    q13: "ÀS VEZES", q14: "NUNCA/QUASE NUNCA", q15: "RARAMENTE", q16: "ÀS VEZES",
    q17: "FREQUENTEMENTE", q18: "SEMPRE", q19: "ÀS VEZES", q20: "RARAMENTE",
    q21: "SIM", q22: "BOA", q23: "ÀS VEZES", q24: "RARAMENTE",
    q25: "FREQUENTEMENTE", q26: "SEMPRE", q27: "NÃO", q28: "SIM"
  },
  {
    unit: "BRITAGEM",
    timestamp: "2025-05-02",
    q1: "RARAMENTE", q2: "ÀS VEZES", q3: "NUNCA/QUASE NUNCA", q4: "RARAMENTE",
    q5: "ÀS VEZES", q6: "FREQUENTEMENTE", q7: "SEMPRE", q8: "ÀS VEZES",
    q9: "RARAMENTE", q10: "NUNCA/QUASE NUNCA", q11: "ÀS VEZES", q12: "FREQUENTEMENTE",
    q13: "SEMPRE", q14: "ÀS VEZES", q15: "RARAMENTE", q16: "NUNCA/QUASE NUNCA",
    q17: "ÀS VEZES", q18: "RARAMENTE", q19: "FREQUENTEMENTE", q20: "SEMPRE",
    q21: "NÃO", q22: "MUITO BOA", q23: "RARAMENTE", q24: "ÀS VEZES",
    q25: "NUNCA/QUASE NUNCA", q26: "RARAMENTE", q27: "SIM", q28: "NÃO"
  },
  {
    unit: "F1",
    timestamp: "2025-05-03",
    q1: "ÀS VEZES", q2: "FREQUENTEMENTE", q3: "RARAMENTE", q4: "NUNCA/QUASE NUNCA",
    q5: "RARAMENTE", q6: "ÀS VEZES", q7: "NUNCA/QUASE NUNCA", q8: "SEMPRE",
    q9: "FREQUENTEMENTE", q10: "ÀS VEZES", q11: "RARAMENTE", q12: "NUNCA/QUASE NUNCA",
    q13: "ÀS VEZES", q14: "SEMPRE", q15: "FREQUENTEMENTE", q16: "RARAMENTE",
    q17: "NUNCA/QUASE NUNCA", q18: "ÀS VEZES", q19: "RARAMENTE", q20: "FREQUENTEMENTE",
    q21: "SIM", q22: "RAZOÁVEL", q23: "SEMPRE", q24: "ÀS VEZES",
    q25: "RARAMENTE", q26: "NUNCA/QUASE NUNCA", q27: "NÃO", q28: "SIM"
  }
  // Adicionar mais dados para F2, F3, F5, F6, F7, F9, F10, F12, F14, F17, F18 conforme necessário
];

// Inicializar dados do localStorage
let responses = JSON.parse(localStorage.getItem("surveyResponses")) || surveyData;

// Login
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("login-error");

  if (username === "caren.santos" && password === "Meusfilhos@2") {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").style.display = "block";
    error.textContent = "";
    updateDashboard("ALL");
    updateDetailedView();
  } else {
    error.textContent = "Usuário ou senha inválidos";
  }
});

// Voltar para Login
document.getElementById("back-to-login").addEventListener("click", () => {
  document.getElementById("app-container").style.display = "none";
  document.getElementById("login-container").style.display = "block";
  document.getElementById("login-form").reset();
  document.getElementById("login-error").textContent = "";
});

// Navegação por abas
function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.getElementById(tabId).style.display = "block";
  document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add("active");
  if (tabId === "survey") {
    document.getElementById("survey-form").reset();
    document.getElementById("edit-index").value = "";
  }
}

// Filtro de unidade
document.getElementById("unit-filter").addEventListener("change", (e) => {
  updateDashboard(e.target.value);
});

// Processar dados para gráficos
function processData(unit) {
  const filteredData = unit === "ALL" ? responses : responses.filter(r => r.unit === unit);
  const workloadCounts = { "NUNCA/QUASE NUNCA": 0, "RARAMENTE": 0, "ÀS VEZES": 0, "FREQUENTEMENTE": 0, "SEMPRE": 0 };
  const healthCounts = { "EXCELENTE": 0, "MUITO BOA": 0, "BOA": 0, "RAZOÁVEL": 0, "DEFICITÁRIA": 0 };

  filteredData.forEach(r => {
    workloadCounts[r.q1] = (workloadCounts[r.q1] || 0) + 1;
    if (r.q22) healthCounts[r.q22] = (healthCounts[r.q22] || 0) + 1;
  });

  return { workloadCounts, healthCounts };
}

// Atualizar dashboard
function updateDashboard(unit) {
  const { workloadCounts, healthCounts } = processData(unit);

  // Fato interessante
  const fact = document.getElementById("interesting-fact").querySelector("p");
  fact.textContent = unit === "ALL"
    ? "Logística e F1 reportam alta exaustão física, com muitos funcionários sentindo cansaço frequente."
    : `${unit} apresenta desafios com exaustão física impactando o bem-estar.`;

  // Destruir gráficos existentes
  if (window.workloadChart) window.workloadChart.destroy();
  if (window.healthChart) window.healthChart.destroy();

  // Gráfico de Carga de Trabalho (Bar)
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
      animation: {
        duration: 1000,
        easing: "easeOutBounce"
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Número de Respostas",
            font: { size: 14, weight: "bold" }
          },
          ticks: { font: { size: 12 } }
        },
        x: {
          title: {
            display: true,
            text: "Frequência",
            font: { size: 14, weight: "bold" }
          },
          ticks: { font: { size: 12 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#333",
          titleFont: { size: 14 },
          bodyFont: { size: 12 }
        }
      }
    }
  });

  // Gráfico de Saúde (Pie)
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
      animation: {
        duration: 1000,
        easing: "easeInOutQuad"
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 12 },
            boxWidth: 20
          }
        },
        tooltip: {
          backgroundColor: "#333",
          titleFont: { size: 14 },
          bodyFont: { size: 12 }
        },
        datalabels: {
          color: "#fff",
          formatter: (value, ctx) => {
            let sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
            let percentage = ((value / sum) * 100).toFixed(1) + "%";
            return value > 0 ? percentage : "";
          },
          font: { size: 12, weight: "bold" }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// Atualizar visão detalhada
function updateDetailedView() {
  const tbody = document.getElementById("data-table").querySelector("tbody");
  const cardContainer = document.getElementById("data-cards");
  tbody.innerHTML = "";
  cardContainer.innerHTML = "";

  responses.forEach((r, index) => {
    // Table Row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.unit}</td>
      <td>${r.timestamp}</td>
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
      <td><button class="edit-btn" onclick="editResponse(${index})">Editar</button></td>
      <td><button class="delete-btn" onclick="deleteResponse(${index})">Excluir</button></td>
    `;
    tbody.appendChild(row);

    // Card
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header" onclick="toggleCard(this)">
        <span>${r.unit} - ${r.timestamp}</span>
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
          <button class="edit-btn" onclick="editResponse(${index})">Editar</button>
          <button class="delete-btn" onclick="deleteResponse(${index})">Excluir</button>
        </div>
      </div>
    `;
    cardContainer.appendChild(card);
  });
}

// Alternar visibilidade do card
function toggleCard(header) {
  const content = header.nextElementSibling;
  content.classList.toggle("show");
  header.querySelector("span:last-child").textContent = content.classList.contains("show") ? "▲" : "▼";
}

// Editar resposta
function editResponse(index) {
  const response = responses[index];
  document.getElementById("edit-index").value = index;
  document.getElementById("survey-unit").value = response.unit;
  document.getElementById("survey-form").querySelector("[name='q1']").value = response.q1;
  document.getElementById("survey-form").querySelector("[name='q2']").value = response.q2;
  document.getElementById("survey-form").querySelector("[name='q3']").value = response.q3;
  // Preencha outros campos q4 a q28
  showTab("survey");
}

// Excluir resposta
function deleteResponse(index) {
  if (confirm("Tem certeza que deseja excluir esta resposta?")) {
    responses.splice(index, 1);
    localStorage.setItem("surveyResponses", JSON.stringify(responses));
    updateDashboard(document.getElementById("unit-filter").value);
    updateDetailedView();
  }
}

// Formulário de pesquisa
document.getElementById("survey-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const editIndex = formData.get("edit-index");
  const response = {
    unit: formData.get("survey-unit"),
    timestamp: new Date().toISOString().split("T")[0],
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

  if (editIndex !== "") {
    responses[parseInt(editIndex)] = response;
  } else {
    responses.push(response);
  }

  localStorage.setItem("surveyResponses", JSON.stringify(responses));
  alert("Pesquisa enviada com sucesso!");
  e.target.reset();
  document.getElementById("edit-index").value = "";
  updateDashboard(document.getElementById("unit-filter").value);
  updateDetailedView();
});

// Inicializar abas
showTab("dashboard");