const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:80', 'http://127.0.0.1:80'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));
app.use(express.static(__dirname));

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
      q1: "NUNCA/QUASE NUNCA", q2: "RARAMENTE", q3: "ÀS VEZES"
    },
    {
      id: 2,
      unit: "BRITAGEM",
      timestamp: "2025-05-02",
      q1: "RARAMENTE", q2: "ÀS VEZES", q3: "NUNCA/QUASE NUNCA"
    },
    {
      id: 3,
      unit: "F1",
      timestamp: "2025-05-03",
      q1: "ÀS VEZES", q2: "FREQUENTEMENTE", q3: "RARAMENTE"
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

// Lista de unidades válidas
const validUnits = ["Logística", "Britagem", "SST", "Oficina", "LABORATORIO", "Matriz", "CA", "F1", "F2", "F3", "F5", "F6", "F7", "F9", "F10", "F12", "F14", "F17", "F18"].map(normalizeUnit);
const validFrequencies = ["NUNCA/QUASE NUNCA", "RARAMENTE", "ÀS VEZES", "FREQUENTEMENTE", "SEMPRE"];

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

  if (!validFrequencies.includes(response.q1) || !validFrequencies.includes(response.q2) || !validFrequencies.includes(response.q3)) {
    return res.status(400).json({ message: "Valores inválidos para q1, q2 ou q3" });
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});