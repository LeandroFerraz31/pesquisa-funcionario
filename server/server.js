const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

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

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'caren.santos' && password === 'Meusfilhos@2') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });
  }
});

// Listar respostas
app.get('/api/responses', (req, res) => {
  const unit = req.query.unit;
  if (unit && unit !== 'ALL') {
    res.json(responses.filter(r => r.unit === unit));
  } else {
    res.json(responses);
  }
});

// Criar resposta
app.post('/api/responses', (req, res) => {
  const response = req.body;
  response.id = responses.length ? Math.max(...responses.map(r => r.id)) + 1 : 1;
  response.timestamp = new Date().toISOString().split('T')[0];
  responses.push(response);
  saveResponses();
  res.status(201).json(response);
});

// Editar resposta
app.put('/api/responses/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = responses.findIndex(r => r.id === id);
  if (index !== -1) {
    responses[index] = { ...req.body, id, timestamp: new Date().toISOString().split('T')[0] };
    saveResponses();
    res.json(responses[index]);
  } else {
    res.status(404).json({ message: 'Resposta não encontrada' });
  }
});

// Excluir resposta
app.delete('/api/responses/:id', (req, res) => {
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
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});