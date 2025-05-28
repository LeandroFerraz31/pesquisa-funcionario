// Configuração global
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:80'
    : '';

console.log('Hostname:', window.location.hostname);
console.log('API_BASE_URL definido como:', API_BASE_URL);

const UNITS = [
    'Logística', 'Britagem', 'SST', 'Oficina', 'Laboratório',
    'CA', 'F1', 'F2', 'F3', 'F5', 'F6', 'F7', 'F9', 'F10', 'F12', 'F14', 'F17', 'F18'
];

// Opções de resposta para cada pergunta
const RESPONSE_OPTIONS = {
    default: [
        'NUNCA/QUASE NUNCA',
        'RARAMENTE',
        'ÀS VEZES',
        'FREQUENTEMENTE',
        'SEMPRE'
    ],
    health: [
        'EXCELENTE',
        'MUITO BOA',
        'BOA',
        'RAZOÁVEL',
        'DEFICITÁRIA'
    ],
    impact: [
        'NUNCA/QUASE NUNCA',
        'UM POUCO',
        'MODERADAMENTE',
        'MUITO',
        'EXTREMAMENTE'
    ]
};

// Mapeamento das perguntas para suas opções de resposta
const QUESTION_OPTIONS = {
    q28: 'health',
    q29: 'impact',
    q30: 'impact',
    default: 'default'
};

// Mapeamento das perguntas para exibição
const QUESTION_LABELS = [
    'A sua carga de trabalho acumula-se por ser mal distribuída?',
    'Com que frequência não tem tempo para completar todas as tarefas do seu trabalho?',
    'Precisa trabalhar muito rapidamente?',
    'O seu trabalho exige a sua atenção constante?',
    'O seu trabalho exige que tome decisões difíceis?',
    'O seu trabalho exige emocionalmente de si?',
    'O seu trabalho exige que tenha iniciativa?',
    'O seu trabalho permite-lhe aprender coisas novas?',
    'No seu local de trabalho, é informado com antecedência sobre decisões importantes, mudanças ou planos para o futuro?',
    'Recebe toda a informação de que necessita para fazer bem o seu trabalho?',
    'Sabe exatamente quais as suas responsabilidades?',
    'O seu trabalho é reconhecido e apreciado pela gerência?',
    'É tratado de forma justa no seu local de trabalho?',
    'Com que frequência tem ajuda e apoio do seu superior imediato?',
    'Existe um bom ambiente de trabalho entre si e os seus colegas?',
    'Oferece aos indivíduos e ao grupo boas oportunidades de desenvolvimento?',
    'É bom no planejamento do trabalho?',
    'A gerência confia nos seus funcionários para fazer o seu trabalho bem?',
    'Confia na informação que lhe é transmitida pela gerência?',
    'Os conflitos são resolvidos de uma forma justa?',
    'O trabalho é igualmente distribuído pelos funcionários?',
    'Sou sempre capaz de resolver problemas, se tentar o suficiente.',
    'O seu trabalho tem algum significado para si?',
    'Sente que o seu trabalho é importante?',
    'Sente que os problemas do seu local de trabalho são seus também?',
    'Quão satisfeito está com o seu trabalho de uma forma global?',
    'Sente-se preocupado em ficar desempregado?',
    'Em geral sente que a sua saúde é:',
    'Sente que o seu trabalho lhe exige muita energia que acaba por afetar a sua vida privada negativamente?',
    'Sente que o seu trabalho lhe exige muito tempo que acaba por afetar a sua vida privada negativamente?',
    'Acordou várias vezes durante a noite e depois não conseguia adormecer novamente?',
    'Fisicamente exausto?',
    'Emocionalmente exausto?',
    'Irritado?',
    'Ansioso?',
    'Triste?',
    'Tem sido alvo de insultos ou provocações verbais?',
    'Tem sido exposto a assédio sexual indesejado?',
    'Tem sido exposto a ameaças de violência?',
    'Tem sido exposto a violência física?'
];

// Variáveis globais
let currentResponses = [];
let charts = {};
let isDarkTheme = localStorage.getItem('theme') === 'dark';

// Função para exibir mensagens de feedback
function showFeedback(message, isError = true) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = isError ? 'error-message' : 'success-message';
    feedbackDiv.textContent = message;
    feedbackDiv.style.position = 'fixed';
    feedbackDiv.style.top = '20px';
    feedbackDiv.style.right = '20px';
    feedbackDiv.style.padding = '10px 20px';
    feedbackDiv.style.borderRadius = '8px';
    feedbackDiv.style.background = isError ? '#e74c3c' : '#28a745';
    feedbackDiv.style.color = '#fff';
    feedbackDiv.style.zIndex = '1002';
    document.body.appendChild(feedbackDiv);
    setTimeout(() => feedbackDiv.remove(), 3000);
}

// Função para aplicar o tema global
function applyTheme() {
    isDarkTheme = localStorage.getItem('theme') === 'dark';
    const root = document.documentElement;

    if (isDarkTheme) {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
    } else {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
    }

    Object.values(charts).forEach(chart => {
        if (chart) {
            updateChartTheme(chart);
        }
    });
}

// Função para atualizar as cores de um gráfico com base no tema
function updateChartTheme(chart) {
    if (!chart) return;

    const isDark = localStorage.getItem('theme') === 'dark';
    const chartId = chart.canvas.id;

    if (chartId === 'unitChart') {
        chart.options.plugins.legend.labels.color = isDark ? '#E0E0E0' : '#333';
        chart.options.plugins.datalabels.color = isDark ? '#E0E0E0' : '#fff';
    } else if (chartId === 'healthChart') {
        chart.data.datasets[0].backgroundColor = isDark ? 'rgba(128, 196, 255, 0.8)' : 'rgba(102, 126, 234, 0.8)';
        chart.data.datasets[0].borderColor = isDark ? 'rgba(128, 196, 255, 1)' : 'rgba(102, 126, 234, 1)';
        chart.options.scales.y.ticks.color = isDark ? '#E0E0E0' : '#333';
        chart.options.scales.x.ticks.color = isDark ? '#E0E0E0' : '#333';
        chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        chart.options.scales.x.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        chart.options.plugins.datalabels.color = isDark ? '#E0E0E0' : '#333';
    } else if (chartId === 'trendChart') {
        chart.data.datasets[0].borderColor = isDark ? 'rgba(128, 196, 255, 1)' : 'rgba(102, 126, 234, 1)';
        chart.data.datasets[0].backgroundColor = isDark ? 'rgba(128, 196, 255, 0.1)' : 'rgba(102, 126, 234, 0.1)';
        chart.data.datasets[0].pointBackgroundColor = isDark ? 'rgba(128, 196, 255, 1)' : 'rgba(102, 126, 234, 1)';
        chart.options.scales.y.ticks.color = isDark ? '#E0E0E0' : '#333';
        chart.options.scales.x.ticks.color = isDark ? '#E0E0E0' : '#333';
        chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        chart.options.scales.x.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    } else if (chartId === 'comparisonChart') {
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#C9CBCF', '#FF6384', '#36A2EB', '#FFCE56',
            '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384',
            '#36A2EB', '#FFCE56', '#4BC0C0'
        ];
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        const lightColors = colors;
        const darkColors = colors.map(color => {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgb(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)})`;
        });

        chart.data.datasets.forEach((dataset, index) => {
            dataset.borderColor = isDark ? darkColors[index % darkColors.length] : lightColors[index % lightColors.length];
            dataset.backgroundColor = isDark 
                ? hexToRgba(darkColors[index % darkColors.length], 0.2)
                : hexToRgba(lightColors[index % lightColors.length], 0.1);
            dataset.pointBackgroundColor = isDark 
                ? darkColors[index % darkColors.length] 
                : lightColors[index % lightColors.length];
        });
        chart.options.scales.y.ticks.color = isDark ? '#E0E0E0' : '#333';
        chart.options.scales.x.ticks.color = isDark ? '#E0E0E0' : '#333';
        chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        chart.options.scales.x.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        chart.options.plugins.legend.labels.color = isDark ? '#E0E0E0' : '#333';
    }
    chart.canvas.style.backgroundColor = isDark ? '#1E3A8A' : '#FFFFFF';
    chart.update();
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    applyTheme();
});

function initializeApp() {
    populateSelects();
    setupEventListeners();
    setupThemeButton();
}

function populateSelects() {
    // Preencher select de unidades
    const unitSelects = [document.getElementById('unitSelect'), document.getElementById('unitFilter')];
    unitSelects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Selecione</option>'; // Limpar e adicionar opção padrão
            UNITS.forEach(unit => {
                const option = document.createElement('option');
                option.value = unit;
                option.textContent = unit;
                select.appendChild(option);
            });
        }
    });

    // Preencher selects de respostas (q1 a q40)
    for (let i = 1; i <= 40; i++) {
        const selectId = `q${i}Select`;
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Selecione</option>'; // Limpar opções existentes
            const optionType = QUESTION_OPTIONS[`q${i}`] || QUESTION_OPTIONS.default;
            const options = RESPONSE_OPTIONS[optionType];
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });
        }
    }
}

function setupEventListeners() {
    const responseForm = document.getElementById('responseForm');
    if (responseForm) {
        responseForm.addEventListener('submit', handleResponseSubmit);
    }

    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
}

function setupThemeButton() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    let themeButton = document.querySelector('.theme-toggle');
    if (!themeButton) {
        themeButton = document.createElement('button');
        themeButton.className = 'theme-toggle';
        themeButton.innerHTML = isDarkTheme ? '☀️' : '🌙';
        themeButton.style.background = 'none';
        themeButton.style.border = 'none';
        themeButton.style.cursor = 'pointer';
        themeButton.style.fontSize = '20px';
        themeButton.style.marginTop = '10px';
        headerActions.appendChild(themeButton);

        themeButton.addEventListener('click', () => {
            isDarkTheme = !isDarkTheme;
            localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
            themeButton.innerHTML = isDarkTheme ? '☀️' : '🌙';
            applyTheme();
        });
    }
}

// Funções de autenticação
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    if (!username || !password) {
        errorDiv.textContent = 'Por favor, preencha todos os campos.';
        return;
    }

    try {
        const loginUrl = `${API_BASE_URL}/api/login`;
        console.log('Enviando requisição para:', loginUrl); // Debug
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta do servidor:', errorText);
            throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.success) {
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
window.login = login;

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('isAuthenticated') === 'true') {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');
        loadDashboardData();
    }
});

function logout() {
    localStorage.removeItem('isAuthenticated');
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
async function loadDashboardData() {
    try {
        const [chartResponse, comparisonResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/chart-data`),
            fetch(`${API_BASE_URL}/api/comparison-data`)
        ]);

        if (!chartResponse.ok || !comparisonResponse.ok) {
            throw new Error('Erro HTTP ao carregar os dados');
        }

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
        showFeedback('Erro ao carregar dados do painel. Verifique se há respostas registradas.', true);
    }
}

function createCharts(chartData, comparisonData) {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });

    const isDark = localStorage.getItem('theme') === 'dark';

    const unitCtx = document.getElementById('unitChart');
    if (unitCtx) {
        charts.unitChart = new Chart(unitCtx, {
            type: 'doughnut',
            data: {
                labels: chartData.unitData.map(item => item.unit),
                datasets: [{
                    data: chartData.unitData.map(item => item.count),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                        '#FF9F40', '#C9CBCF', '#FF6384', '#36A2EB', '#FFCE56',
                        '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384',
                        '#36A2EB', '#FFCE56', '#4BC0C0'
                    ],
                    borderWidth: 2,
                    borderColor: isDark ? '#2D3748' : '#fff'
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
                            usePointStyle: true,
                            color: isDark ? '#E0E0E0' : '#333'
                        }
                    },
                    datalabels: {
                        color: isDark ? '#E0E0E0' : '#fff',
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
        unitCtx.style.backgroundColor = isDark ? '#1E3A8A' : '#FFFFFF';
    }

    const healthCtx = document.getElementById('healthChart');
    if (healthCtx) {
        charts.healthChart = new Chart(healthCtx, {
            type: 'bar',
            data: {
                labels: chartData.healthData.map(item => item.label),
                datasets: [{
                    label: 'Respostas',
                    data: chartData.healthData.map(item => item.value),
                    backgroundColor: isDark ? 'rgba(128, 196, 255, 0.8)' : 'rgba(102, 126, 234, 0.8)',
                    borderColor: isDark ? 'rgba(128, 196, 255, 1)' : 'rgba(102, 126, 234, 1)',
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
                            stepSize: 1,
                            color: isDark ? '#E0E0E0' : '#333'
                        },
                        grid: {
                            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            color: isDark ? '#E0E0E0' : '#333'
                        },
                        grid: {
                            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
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
                        color: isDark ? '#E0E0E0' : '#333',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        healthCtx.style.backgroundColor = isDark ? '#1E3A8A' : '#FFFFFF';
    }

    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        charts.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: chartData.trendData.map(item => {
                    const date = new Date(item.date);
                    return date.toLocaleDateString('pt-BR');
                }),
                datasets: [{
                    label: 'Respostas por Dia',
                    data: chartData.trendData.map(item => item.count),
                    borderColor: isDark ? 'rgba(128, 196, 255, 1)' : 'rgba(102, 126, 234, 1)',
                    backgroundColor: isDark ? 'rgba(128, 196, 255, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: isDark ? 'rgba(128, 196, 255, 1)' : 'rgba(102, 126, 234, 1)',
                    pointBorderColor: isDark ? '#2D3748' : '#fff',
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
                            stepSize: 1,
                            color: isDark ? '#E0E0E0' : '#333'
                        },
                        grid: {
                            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: isDark ? '#E0E0E0' : '#333'
                        },
                        grid: {
                            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
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
        trendCtx.style.backgroundColor = isDark ? '#1E3A8A' : '#FFFFFF';
    }

    const comparisonCtx = document.getElementById('comparisonChart');
    if (comparisonCtx && comparisonData) {
        const questions = ['Carga de Trabalho', 'Estresse', 'Tempo para Tarefas'];
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#C9CBCF', '#FF6384', '#36A2EB', '#FFCE56',
            '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384',
            '#36A2EB', '#FFCE56', '#4BC0C0'
        ];
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        const lightColors = colors;
        const darkColors = colors.map(color => {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgb(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)})`;
        });

        const datasets = comparisonData.map((item, index) => ({
            label: item.unit,
            data: [item.q1_avg, item.q2_avg, item.q3_avg],
            borderColor: isDark ? darkColors[index % darkColors.length] : lightColors[index % lightColors.length],
            backgroundColor: isDark 
                ? hexToRgba(darkColors[index % darkColors.length], 0.2)
                : hexToRgba(lightColors[index % lightColors.length], 0.1),
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: isDark 
                ? darkColors[index % darkColors.length] 
                : lightColors[index % lightColors.length]
        }));

        charts.comparisonChart = new Chart(comparisonCtx, {
            type: 'line',
            data: {
                labels: questions,
                datasets: datasets
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
                            },
                            color: isDark ? '#E0E0E0' : '#333'
                        },
                        grid: {
                            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            color: isDark ? '#E0E0E0' : '#333'
                        },
                        grid: {
                            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
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
                    },
                    legend: {
                        labels: {
                            color: isDark ? '#E0E0E0' : '#333',
                            usePointStyle: true
                        },
                        position: 'bottom'
                    }
                }
            }
        });
        comparisonCtx.style.backgroundColor = isDark ? '#1E3A8A' : '#FFFFFF';
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
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">Nenhuma resposta encontrada.</p>';
        return;
    }

    responses.forEach(response => {
        const card = document.createElement('div');
        card.className = 'response-card';

        const date = new Date(response.created_at);
        const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');

        let detailsHtml = '';
        for (let i = 1; i <= 40; i++) {
            const answer = response[`q${i}`];
            if (answer) {
                detailsHtml += `
                    <div class="response-item">
                        <div class="response-question">${QUESTION_LABELS[i - 1]}</div>
                        <div class="response-answer" data-answer="${answer}">${answer}</div>
                    </div>
                `;
            }
        }

        card.innerHTML = `
            <div class="response-header">
                <div class="response-unit">${response.unit}</div>
                <div class="response-date">${formattedDate}</div>
            </div>
            <div class="response-details">
                ${detailsHtml}
            </div>
            <div class="response-actions">
                <button onclick="editResponse(${response.id})" class="btn-edit" aria-label="Editar resposta ${response.id}">Editar</button>
                <button onclick="deleteResponse(${response.id})" class="btn-delete" aria-label="Excluir resposta ${response.id}">Excluir</button>
            </div>
        `;

        container.appendChild(card);
    });
}

async function loadResponses(unit = '') {
    const container = document.getElementById('responsesContainer');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; padding: 2rem;">Carregando respostas...</p>';

    try {
        const url = unit ? `${API_BASE_URL}/api/responses?unit=${encodeURIComponent(unit)}` : `${API_BASE_URL}/api/responses`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            container.innerHTML = `<p style="text-align: center; padding: 2rem; color: #e74c3c;">Erro ao carregar respostas: ${data.error}</p>`;
            return;
        }

        currentResponses = data;
        displayResponses(data);
    } catch (error) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Erro ao conectar com o servidor.</p>';
        console.error('Erro ao carregar respostas:', error);
    }
}

function filterResponses() {
    const unitFilter = document.getElementById('unitFilter').value;
    loadResponses(unitFilter);
}

function showAddForm() {
    document.getElementById('modalTitle').textContent = 'Nova Pesquisa';
    document.getElementById('responseId').value = '';
    document.getElementById('responseForm').reset();
    document.getElementById('responseModal').classList.remove('hidden');
}

function editResponse(id) {
    const response = currentResponses.find(r => r.id === id);
    if (!response) return;

    document.getElementById('modalTitle').textContent = 'Editar Pesquisa';
    document.getElementById('responseId').value = response.id;
    document.getElementById('unitSelect').value = response.unit;

    for (let i = 1; i <= 40; i++) {
        const select = document.getElementById(`q${i}Select`);
        if (select) select.value = response[`q${i}`];
    }

    document.getElementById('responseModal').classList.remove('hidden');
}

async function deleteResponse(id) {
    if (!confirm('Tem certeza que deseja excluir esta resposta?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/responses/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json();
            showFeedback(`Erro ao excluir resposta: ${data.error}`, true);
            return;
        }

        showFeedback('Resposta excluída com sucesso!', false);
        loadResponses(document.getElementById('unitFilter').value);
    } catch (error) {
        showFeedback('Erro ao excluir resposta.', true);
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

async function handleResponseSubmit(e) {
    e.preventDefault();

    const unit = document.getElementById('unitSelect').value;
    const formData = { unit };

    // Coletar valores de todos os 40 selects
    for (let i = 1; i <= 40; i++) {
        const select = document.getElementById(`q${i}Select`);
        if (!select.value) {
            showFeedback(`Preencha a pergunta ${i}.`, true);
            return;
        }
        formData[`q${i}`] = select.value;
    }

    const responseId = document.getElementById('responseId').value;
    const isEdit = responseId !== '';
    const url = isEdit 
        ? `${API_BASE_URL}/api/responses/${responseId}`
        : `${API_BASE_URL}/api/responses`;

    try {
        const response = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao salvar');
        }

        closeModal();
        showFeedback(isEdit ? 'Pesquisa atualizada com sucesso!' : 'Pesquisa enviada com sucesso!', false);
        await loadResponses(document.getElementById('unitFilter').value);
    } catch (error) {
        showFeedback(`Erro ao salvar resposta: ${error.message}`, true);
        console.error('Erro ao salvar resposta:', error);
    }
}