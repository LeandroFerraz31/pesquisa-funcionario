const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Carregar dados
let responses = [];
try {
  const data = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
  responses = JSON.parse(data);
} catch (err) {
  responses = [
    {
      id: 1,
      unit: "LOGÍSTICA",
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
      id: 2,
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
      id: 3,
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
  ];
  fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(responses, null, 2));
}

// Salvar dados
function saveResponses() {
  fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(responses, null, 2));
}

// Normalizar unidade
function normalizeUnit(unit) {
  return unit.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

// Lista de unidades válidas e opções
const validUnits = ["Logística", "Britagem", "SST", "Oficina", "LABORATORIO", "Matriz", "CA", "F1", "F2", "F3", "F5", "F6", "F7", "F9", "F10", "F12", "F14", "F17", "F18"].map(normalizeUnit);
const validFrequencies = ["NUNCA/QUASE NUNCA", "RARAMENTE", "ÀS VEZES", "FREQUENTEMENTE", "SEMPRE"];
const validHealth = ["EXCELENTE", "MUITO BOA", "BOA", "RAZOÁVEL", "DEFICITÁRIA"];
const validYesNo = ["SIM", "NÃO"];

// Login
app.post('/api/login', (req, res) => {
  console.log('Requisição POST /api/login recebida:', req.body);
  const { username, password } = req.body;
  if (username === 'caren.santos' && password === 'Meusfilhos@2') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });
  }
});

// Listar respostas
app.get('/api/responses', (req, res) => {
  console.log('Requisição GET /api/responses recebida');
  const unit = req.query.unit;
  if (unit && unit !== 'ALL') {
    res.json(responses.filter(r => normalizeUnit(r.unit) === normalizeUnit(unit)));
  } else {
    res.json(responses);
  }
});

// Obter uma resposta específica
app.get('/api/responses/:id', (req, res) => {
  console.log('Requisição GET /api/responses/:id recebida:', req.params.id);
  const id = parseInt(req.params.id);
  const response = responses.find(r => r.id === id);
  if (response) {
    res.json(response);
  } else {
    res.status(404).json({ message: 'Resposta não encontrada' });
  }
});

// Criar resposta
app.post('/api/responses', (req, res) => {
  console.log('Requisição POST /api/responses recebida:', req.body);
  const response = req.body;
  if (!response.unit || !response.q1 || !response.q2 || !response.q3) {
    return res.status(400).json({ message: "Campos obrigatórios não preenchidos" });
  }

  const normalizedUnit = normalizeUnit(response.unit);
  if (!validUnits.includes(normalizedUnit)) {
    return res.status(400).json({ message: `Unidade inválida: ${response.unit}` });
  }

  for (let i = 1; i <= 20; i++) {
    const key = `q${i}`;
    if (response[key] && !validFrequencies.includes(response[key])) {
      return res.status(400).json({ message: `Valor inválido para ${key}: ${response[key]}` });
    }
  }
  if (response.q21 && !validYesNo.includes(response.q21)) {
    return res.status(400).json({ message: `Valor inválido para q21: ${response.q21}` });
  }
  if (response.q22 && !validHealth.includes(response.q22)) {
    return res.status(400).json({ message: `Valor inválido para q22: ${response.q22}` });
  }
  for (let i = 23; i <= 26; i++) {
    const key = `q${i}`;
    if (response[key] && !validFrequencies.includes(response[key])) {
      return res.status(400).json({ message: `Valor inválido para ${key}: ${response[key]}` });
    }
  }
  for (let i = 27; i <= 28; i++) {
    const key = `q${i}`;
    if (response[key] && !validYesNo.includes(response[key])) {
      return res.status(400).json({ message: `Valor inválido para ${key}: ${response[key]}` });
    }
  }

  response.unit = normalizedUnit;
  response.id = responses.length ? Math.max(...responses.map(r => r.id)) + 1 : 1;
  response.timestamp = new Date().toISOString().split('T')[0];
  responses.push(response);
  saveResponses();
  res.status(201).json(response);
});

// Editar resposta
app.put('/api/responses/:id', (req, res) => {
  console.log('Requisição PUT /api/responses/:id recebida:', req.params.id, req.body);
  const id = parseInt(req.params.id);
  const response = req.body;

  if (!response.unit || !response.q1 || !response.q2 || !response.q3) {
    return res.status(400).json({ message: "Campos obrigatórios não preenchidos" });
  }

  const normalizedUnit = normalizeUnit(response.unit);
  if (!validUnits.includes(normalizedUnit)) {
    return res.status(400).json({ message: `Unidade inválida: ${response.unit}` });
  }

  for (let i = 1; i <= 20; i++) {
    const key = `q${i}`;
    if (response[key] && !validFrequencies.includes(response[key])) {
      return res.status(400).json({ message: `Valor inválido para ${key}: ${response[key]}` });
    }
  }
  if (response.q21 && !validYesNo.includes(response.q21)) {
    return res.status(400).json({ message: `Valor inválido para q21: ${response.q21}` });
  }
  if (response.q22 && !validHealth.includes(response.q22)) {
    return res.status(400).json({ message: `Valor inválido para q22: ${response.q22}` });
  }
  for (let i = 23; i <= 26; i++) {
    const key = `q${i}`;
    if (response[key] && !validFrequencies.includes(response[key])) {
      return res.status(400).json({ message: `Valor inválido para ${key}: ${response[key]}` });
    }
  }
  for (let i = 27; i <= 28; i++) {
    const key = `q${i}`;
    if (response[key] && !validYesNo.includes(response[key])) {
      return res.status(400).json({ message: `Valor inválido para ${key}: ${response[key]}` });
    }
  }

  const index = responses.findIndex(r => r.id === id);
  if (index !== -1) {
    responses[index] = { ...response, unit: normalizedUnit, id, timestamp: new Date().toISOString().split('T')[0] };
    saveResponses();
    res.json(responses[index]);
  } else {
    res.status(404).json({ message: 'Resposta não encontrada' });
  }
});

// Excluir resposta
app.delete('/api/responses/:id', (req, res) => {
  console.log('Requisição DELETE /api/responses/:id recebida:', req.params.id);
  const id = parseInt(req.params.id);
  const index = responses.findIndex(r => r.id === id);
  if (index !== -1) {
    responses.splice(index, 1);
    saveResponses();
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Resposta não encontrada' });
  }
});

// Servir frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} às ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
});