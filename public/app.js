// Configuração global
const API_BASE = 'http://localhost:3000';

const UNITS = [
    'Logística', 'Britagem', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
    'Administrativo', 'RH', 'Financeiro', 'TI', 'Segurança',
    'Manutenção', 'Qualidade', 'Vendas', 'Compras', 'Almoxarifado'
];
const RESPONSE_OPTIONS = [
    'NUNCA/QUASE NUNCA',
    'RARAMENTE',
    'ÀS VEZES',
    'FREQUENTEMENTE',
    'SEMPRE'
];

// Variáveis globais
let currentResponses = [];
let charts = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    populateSelects();
    setupEventListeners();
}

function populateSelects() {
    // Popular select de unidades
    const unitSelects = [document.getElementById('unitSelect'), document.getElementById('unitFilter')];
    
    unitSelects.forEach(select => {
        if (select) {
            UNITS.forEach(unit => {
                const option = document.createElement('option');
                option.value = unit;
                option.textContent = unit;
                select.appendChild(option);
            });
        }
    });
    
    // Popular selects de respostas
    const responseSelects = ['q1Select', 'q2Select', 'q3Select'];
    responseSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            RESPONSE_OPTIONS.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });
        }
    });
}

function setupEventListeners() {
    // Form de resposta
    const responseForm = document.getElementById('responseForm');
    if (responseForm) {
        responseForm.addEventListener('submit', handleResponseSubmit);
    }
    
    // Enter key no login
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
}

// Funções de autenticação
// Modificar a função login
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!username || !password) {
        errorDiv.textContent = 'Por favor, preencha todos os campos.';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Armazenar estado de login
            localStorage.setItem('isAuthenticated', 'true');
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('dashboardScreen').classList.remove('hidden');
            loadDashboardData();
        } else {
            errorDiv.textContent = data.message || 'Credenciais inválidas.';
        }
    } catch (error) {
        errorDiv.textContent = 'Erro ao conectar com o servidor.';
        console.error('Erro no login:', error);
    }
}

// Adicionar verificação de autenticação no carregamento
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se está autenticado
    if (localStorage.getItem('isAuthenticated') === 'true') {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');
        loadDashboardData();
    } else {
        initializeApp();
    }
});

// Modificar a função logout
function logout() {
    localStorage.removeItem('isAuthenticated');
    document.getElementById('dashboardScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').textContent = '';
}

function logout() {
    document.getElementById('dashboardScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').textContent = '';
}

// Funções de navegação
function showDashboard() {
    document.getElementById('dashboardTab').classList.remove('hidden');
    document.getElementById('responsesTab').classList.add('hidden');
    document.getElementById('dashboardBtn').classList.add('active');
    document.getElementById('responsesBtn').classList.remove('active');
    loadDashboardData();
}

function showResponses() {
    document.getElementById('dashboardTab').classList.add('hidden');
    document.getElementById('responsesTab').classList.remove('hidden');
    document.getElementById('dashboardBtn').classList.remove('active');
    document.getElementById('responsesBtn').classList.add('active');
    loadResponses();
}

// Funções de carregamento de dados
// Modificar a função loadDashboardData
async function loadDashboardData() {
    try {
        const [chartResponse, comparisonResponse] = await Promise.all([
            fetch(`${API_BASE}/api/chart-data`),
            fetch(`${API_BASE}/api/comparison-data`)
        ]);
        
        const chartData = await chartResponse.json();
        const comparisonData = await comparisonResponse.json();
        
        if (chartData.error || comparisonData.error) {
            console.error('Erro ao carregar dados:', chartData.error || comparisonData.error);
            return;
        }
        
        createCharts(chartData, comparisonData);
        updateUnitsList(chartData.unitData);
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// Modificar a função createCharts
function createCharts(chartData, comparisonData) {
    // ... (código existente dos outros gráficos)

    // Gráfico de comparação entre unidades
    const comparisonCtx = document.getElementById('comparisonChart');
    if (comparisonCtx && comparisonData) {
        // Preparar dados para o gráfico de linhas
        const units = comparisonData.map(item => item.unit);
        const q1Data = comparisonData.map(item => item.q1_avg);
        const q2Data = comparisonData.map(item => item.q2_avg);
        const q3Data = comparisonData.map(item => item.q3_avg);

        charts.comparisonChart = new Chart(comparisonCtx, {
            type: 'line',
            data: {
                labels: units,
                datasets: [
                    {
                        label: 'Carga de Trabalho',
                        data: q1Data,
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.3,
                        borderWidth: 3
                    },
                    {
                        label: 'Estresse no Trabalho',
                        data: q2Data,
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.3,
                        borderWidth: 3
                    },
                    {
                        label: 'Tempo para Tarefas',
                        data: q3Data,
                        borderColor: '#FFCE56',
                        backgroundColor: 'rgba(255, 206, 86, 0.1)',
                        tension: 0.3,
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 1,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const options = [
                                    '', 'NUNCA', 'RARAMENTE', 'ÀS VEZES', 'FREQUENTEMENTE', 'SEMPRE'
                                ];
                                return options[value];
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const options = [
                                    '', 'NUNCA/QUASE NUNCA', 'RARAMENTE', 'ÀS VEZES', 'FREQUENTEMENTE', 'SEMPRE'
                                ];
                                return `${context.dataset.label}: ${options[Math.round(value)]} (${value.toFixed(1)})`;
                            }
                        }
                    }
                }
            }
        });
    }
}

async function loadResponses(unitFilter = '') {
    try {
        const url = unitFilter ? 
            `${API_BASE}/api/responses?unit=${encodeURIComponent(unitFilter)}` : 
            `${API_BASE}/api/responses`;
            
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error('Erro ao carregar respostas:', data.error);
            return;
        }
        
        currentResponses = data;
        displayResponses(data);
    } catch (error) {
        console.error('Erro ao carregar respostas:', error);
    }
}

// Funções de gráficos
function createCharts(data) {
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    
    // Gráfico por unidade
    const unitCtx = document.getElementById('unitChart');
    if (unitCtx) {
        charts.unitChart = new Chart(unitCtx, {
            type: 'doughnut',
            data: {
                labels: data.unitData.map(item => item.unit),
                datasets: [{
                    data: data.unitData.map(item => item.count),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56',
                        '#9966FF', '#FF9F40', '#4BC0C0', '#C9CBCF',
                        '#FF6384', '#36A2EB'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    datalabels: {
                        color: '#fff',
                        font: {
                            weight: 'bold'
                        },
                        formatter: (value, ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return value > 0 ? `${percentage}%` : '';
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }
    
    // Gráfico de saúde
    const healthCtx = document.getElementById('healthChart');
    if (healthCtx) {
        charts.healthChart = new Chart(healthCtx, {
            type: 'bar',
            data: {
                labels: data.healthData.map(item => item.label),
                datasets: [{
                    label: 'Respostas',
                    data: data.healthData.map(item => item.value),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#333',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }
    
    // Gráfico de tendência
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        charts.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: data.trendData.map(item => {
                    const date = new Date(item.date);
                    return date.toLocaleDateString('pt-BR');
                }),
                datasets: [{
                    label: 'Respostas por Dia',
                    data: data.trendData.map(item => item.count),
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        display: false
                    }
                }
            }
        });
    }
}

function updateUnitsList(unitData) {
    const unitsList = document.getElementById('unitsList');
    if (!unitsList) return;
    
    unitsList.innerHTML = '';
    
    unitData.forEach(unit => {
        const unitItem = document.createElement('div');
        unitItem.className = 'unit-item';
        unitItem.onclick = () => {
            document.getElementById('unitFilter').value = unit.unit;
            showResponses();
            filterResponses();
        };
        
        unitItem.innerHTML = `
            <span class="unit-name">${unit.unit}</span>
            <span class="unit-count">${unit.count}</span>
        `;
        
        unitsList.appendChild(unitItem);
    });
}

// Funções de exibição de respostas
function displayResponses(responses) {
    const container = document.getElementById('responsesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (responses.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">Nenhuma resposta encontrada.</p>';
        return;
    }
    
    responses.forEach(response => {
        const card = document.createElement('div');
        card.className = 'response-card';
        
        const date = new Date(response.created_at);
        const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
        
        card.innerHTML = `
            <div class="response-header">
                <div class="response-unit">${response.unit}</div>
                <div class="response-date">${formattedDate}</div>
            </div>
            <div class="response-details">
                <div class="response-item">
                    <div class="response-question">Como você avalia sua carga de trabalho?</div>
                    <div class="response-answer">${response.q1}</div>
                </div>
                <div class="response-item">
                    <div class="response-question">Com que frequência você sente estresse no trabalho?</div>
                    <div class="response-answer">${response.q2}</div>
                </div>
                <div class="response-item">
                    <div class="response-question">Você tem tempo suficiente para completar suas tarefas?</div>
                    <div class="response-answer">${response.q3}</div>
                </div>
            </div>
            <div class="response-actions">
                <button onclick="editResponse(${response.id})" class="btn-edit">Editar</button>
                <button onclick="deleteResponse(${response.id})" class="btn-delete">Excluir</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function filterResponses() {
    const unitFilter = document.getElementById('unitFilter').value;
    loadResponses(unitFilter);
}

// Funções do modal
function showAddForm() {
    document.getElementById('modalTitle').textContent = 'Nova Pesquisa';
    document.getElementById('responseForm').reset();
    document.getElementById('responseId').value = '';
    showModal();
}

async function editResponse(id) {
    try {
        const response = await fetch(`${API_BASE}/api/responses/${id}`);
        const data = await response.json();
        
        if (data.error) {
            alert('Erro ao carregar resposta: ' + data.error);
            return;
        }
        
        document.getElementById('modalTitle').textContent = 'Editar Pesquisa';
        document.getElementById('responseId').value = data.id;
        document.getElementById('unitSelect').value = data.unit;
        document.getElementById('q1Select').value = data.q1;
        document.getElementById('q2Select').value = data.q2;
        document.getElementById('q3Select').value = data.q3;
        
        showModal();
    } catch (error) {
        alert('Erro ao carregar resposta para edição.');
        console.error('Erro:', error);
    }
}


async function deleteResponse(id) {
    if (!confirm('Tem certeza que deseja excluir esta resposta?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/responses/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert('Erro ao excluir resposta: ' + data.error);
            return;
        }
        
        alert('Resposta excluída com sucesso!');
        loadResponses(document.getElementById('unitFilter').value);
        
    } catch (error) {
        alert('Erro ao excluir resposta.');
        console.error('Erro:', error);
    }
}

function showModal() {
    document.getElementById('responseModal').classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('responseModal').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
}

// Manipulação do formulário
async function handleResponseSubmit(e) {
    if (e) e.preventDefault();

    const unit = document.getElementById('unitSelect').value;
    const q1 = document.getElementById('q1Select').value;
    const q2 = document.getElementById('q2Select').value;
    const q3 = document.getElementById('q3Select').value;
    const responseId = document.getElementById('responseId').value;

    if (!unit || !q1 || !q2 || !q3) {
        alert('Preencha todos os campos obrigatórios.');
        return;
    }

    const formData = { unit, q1, q2, q3 };
    const isEdit = responseId !== '';
    const url = isEdit
        ? `${API_BASE}/api/responses/${responseId}`
        : `${API_BASE}/api/responses`;

    try {
        const response = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Erro ao salvar');

        closeModal(); // fecha o modal após salvar
        await loadResponses(document.getElementById('unitFilter').value); // atualiza respostas
        if (!isEdit) alert('Pesquisa enviada com sucesso!');
    } catch (err) {
        console.error('Erro ao salvar resposta:', err);
        alert('Erro ao salvar resposta.');
    }
}
