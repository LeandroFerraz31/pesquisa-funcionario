// Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("login-error");

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.json();
    if (result.success) {
      document.getElementById("login-container").style.display = "none";
      document.getElementById("app-container").style.display = "block";
      error.textContent = "";
      updateDashboard("ALL");
      updateDetailedView();
    } else {
      error.textContent = result.message;
    }
  } catch (err) {
    error.textContent = "Erro ao fazer login";
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
    document.getElementById("edit-id").value = "";
  }
}

// Filtro de unidade
document.getElementById("unit-filter").addEventListener("change", (e) => {
  updateDashboard(e.target.value);
});

// Processar dados para gráficos
function processData(responses) {
  const workloadCounts = { "NUNCA/QUASE NUNCA": 0, "RARAMENTE": 0, "ÀS VEZES": 0, "FREQUENTEMENTE": 0, "SEMPRE": 0 };
  const healthCounts = { "EXCELENTE": 0, "MUITO BOA": 0, "BOA": 0, "RAZOÁVEL": 0, "DEFICITÁRIA": 0 };

  responses.forEach(r => {
    workloadCounts[r.q1] = (workloadCounts[r.q1] || 0) + 1;
    if (r.q22) healthCounts[r.q22] = (healthCounts[r.q22] || 0) + 1;
  });

  return { workloadCounts, healthCounts };
}

// Atualizar dashboard
async function updateDashboard(unit) {
  try {
    const response = await fetch(`/api/responses?unit=${unit}`);
    const responses = await response.json();
    const { workloadCounts, healthCounts } = processData(responses);

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
  } catch (err) {
    console.error("Erro ao atualizar dashboard:", err);
  }
}

// Atualizar visão detalhada
async function updateDetailedView() {
  try {
    const response = await fetch("/api/responses");
    const responses = await response.json();
    const tbody = document.getElementById("data-table").querySelector("tbody");
    const cardContainer = document.getElementById("data-cards");
    tbody.innerHTML = "";
    cardContainer.innerHTML = "";

    responses.forEach((r) => {
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
        <td><button class="edit-btn" onclick="editResponse(${r.id})">Editar</button></td>
        <td><button class="delete-btn" onclick="deleteResponse(${r.id})">Excluir</button></td>
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
            <button class="edit-btn" onclick="editResponse(${r.id})">Editar</button>
            <button class="delete-btn" onclick="deleteResponse(${r.id})">Excluir</button>
          </div>
        </div>
      `;
      cardContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Erro ao atualizar visão detalhada:", err);
  }
}

// Alternar visibilidade do card
function toggleCard(header) {
  const content = header.nextElementSibling;
  content.classList.toggle("show");
  header.querySelector("span:last-child").textContent = content.classList.contains("show") ? "▲" : "▼";
}

// Editar resposta
async function editResponse(id) {
  try {
    const response = await fetch(`/api/responses?id=${id}`);
    const r = (await response.json())[0];
    if (r) {
      document.getElementById("edit-id").value = r.id;
      document.getElementById("survey-unit").value = r.unit;
      document.getElementById("survey-form").querySelector("[name='q1']").value = r.q1;
      document.getElementById("survey-form").querySelector("[name='q2']").value = r.q2;
      document.getElementById("survey-form").querySelector("[name='q3']").value = r.q3;
      document.getElementById("survey-form").querySelector("[name='q4']").value = r.q4;
      document.getElementById("survey-form").querySelector("[name='q5']").value = r.q5;
      document.getElementById("survey-form").querySelector("[name='q6']").value = r.q6;
      document.getElementById("survey-form").querySelector("[name='q7']").value = r.q7;
      document.getElementById("survey-form").querySelector("[name='q8']").value = r.q8;
      document.getElementById("survey-form").querySelector("[name='q9']").value = r.q9;
      document.getElementById("survey-form").querySelector("[name='q10']").value = r.q10;
      document.getElementById("survey-form").querySelector("[name='q11']").value = r.q11;
      document.getElementById("survey-form").querySelector("[name='q12']").value = r.q12;
      document.getElementById("survey-form").querySelector("[name='q13']").value = r.q13;
      document.getElementById("survey-form").querySelector("[name='q14']").value = r.q14;
      document.getElementById("survey-form").querySelector("[name='q15']").value = r.q15;
      document.getElementById("survey-form").querySelector("[name='q16']").value = r.q16;
      document.getElementById("survey-form").querySelector("[name='q17']").value = r.q17;
      document.getElementById("survey-form").querySelector("[name='q18']").value = r.q18;
      document.getElementById("survey-form").querySelector("[name='q19']").value = r.q19;
      document.getElementById("survey-form").querySelector("[name='q20']").value = r.q20;
      document.getElementById("survey-form").querySelector("[name='q21']").value = r.q21;
      document.getElementById("survey-form").querySelector("[name='q22']").value = r.q22;
      document.getElementById("survey-form").querySelector("[name='q23']").value = r.q23;
      document.getElementById("survey-form").querySelector("[name='q24']").value = r.q24;
      document.getElementById("survey-form").querySelector("[name='q25']").value = r.q25;
      document.getElementById("survey-form").querySelector("[name='q26']").value = r.q26;
      document.getElementById("survey-form").querySelector("[name='q27']").value = r.q27;
      document.getElementById("survey-form").querySelector("[name='q28']").value = r.q28;
      showTab("survey");
    }
  } catch (err) {
    console.error("Erro ao editar resposta:", err);
  }
}

// Excluir resposta
async function deleteResponse(id) {
  if (confirm("Tem certeza que deseja excluir esta resposta?")) {
    try {
      await fetch(`/api/responses/${id}`, { method: "DELETE" });
      updateDashboard(document.getElementById("unit-filter").value);
      updateDetailedView();
    } catch (err) {
      console.error("Erro ao excluir resposta:", err);
    }
  }
}

// Formulário de pesquisa
document.getElementById("survey-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const editId = formData.get("edit-id");
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
    const url = editId ? `/api/responses/${editId}` : "/api/responses";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    });
    alert("Pesquisa enviada com sucesso!");
    e.target.reset();
    document.getElementById("edit-id").value = "";
    updateDashboard(document.getElementById("unit-filter").value);
    updateDetailedView();
  } catch (err) {
    console.error("Erro ao enviar pesquisa:", err);
    alert("Erro ao enviar pesquisa");
  }
});

// Inicializar abas
showTab("dashboard");