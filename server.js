const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('public'));

// Configuração do banco de dados
const dbPath = process.env.NODE_ENV === 'production' ? '/app/storage/employees.db' : './employees.db';
const storageDir = path.dirname(dbPath);

// Criar diretório storage se não existir
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Inicializar banco de dados
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit TEXT NOT NULL,
        q1 TEXT NOT NULL,
        q2 TEXT NOT NULL,
        q3 TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Credenciais fixas
const ADMIN_CREDENTIALS = {
    username: 'caren.santos',
    password: 'Meusfilhos@2'
};

// Lista de unidades atualizada
const UNITS = [
    'Logística', 'Britagem', 'SST', 'Oficina', 'Laboratório'
];

// Opções de resposta
const RESPONSE_OPTIONS = [
    'NUNCA/QUASE NUNCA',
    'RARAMENTE',
    'ÀS VEZES',
    'FREQUENTEMENTE',
    'SEMPRE'
];

// Rota de login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        res.json({ success: true, message: 'Login realizado com sucesso' });
    } else {
        res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
});

// Obter todas as respostas ou filtrar por unidade
app.get('/api/responses', (req, res) => {
    const { unit } = req.query;
    let query = 'SELECT * FROM responses ORDER BY created_at DESC';
    const params = [];
    
    if (unit) {
        query = 'SELECT * FROM responses WHERE unit = ? ORDER BY created_at DESC';
        params.push(unit);
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar dados' });
        }
        res.json(rows);
    });
});

// Criar nova resposta
app.post('/api/responses', (req, res) => {
    const { unit, q1, q2, q3 } = req.body;
    
    if (!unit || !UNITS.includes(unit) || !q1 || !q2 || !q3 || !RESPONSE_OPTIONS.includes(q1) || !RESPONSE_OPTIONS.includes(q2) || !RESPONSE_OPTIONS.includes(q3)) {
        return res.status(400).json({ error: 'Campos inválidos ou unidade não permitida' });
    }
    
    db.run(
        'INSERT INTO responses (unit, q1, q2, q3) VALUES (?, ?, ?, ?)',
        [unit, q1, q2, q3],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao salvar resposta' });
            }
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Editar resposta
app.put('/api/responses/:id', (req, res) => {
    const { id } = req.params;
    const { unit, q1, q2, q3 } = req.body;
    
    if (!unit || !UNITS.includes(unit) || !q1 || !q2 || !q3 || !RESPONSE_OPTIONS.includes(q1) || !RESPONSE_OPTIONS.includes(q2) || !RESPONSE_OPTIONS.includes(q3)) {
        return res.status(400).json({ error: 'Campos inválidos ou unidade não permitida' });
    }
    
    db.run(
        'UPDATE responses SET unit = ?, q1 = ?, q2 = ?, q3 = ? WHERE id = ?',
        [unit, q1, q2, q3, id],
        function(err) {
            if (err || this.changes === 0) {
                return res.status(404).json({ error: 'Resposta não encontrada' });
            }
            res.json({ id });
        }
    );
});

// Excluir resposta
app.delete('/api/responses/:id', (req, res) => {
    db.run(
        'DELETE FROM responses WHERE id = ?',
        [req.params.id],
        function(err) {
            if (err || this.changes === 0) {
                return res.status(404).json({ error: 'Resposta não encontrada' });
            }
            res.status(204).send();
        }
    );
});

// Rota para dados dos gráficos
app.get('/api/chart-data', (req, res) => {
    // Consulta para dados por unidade
    db.all('SELECT unit, COUNT(*) as count FROM responses GROUP BY unit', [], (err, unitRows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar dados das unidades' });
        }

        // Consulta para dados de saúde (baseado em q2 - estresse)
        db.all('SELECT q2 as label, COUNT(*) as value FROM responses GROUP BY q2', [], (err, healthRows) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar dados de saúde' });
            }

            // Consulta para dados de tendência (últimos 30 dias)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

            db.all(
                'SELECT DATE(created_at) as date, COUNT(*) as count FROM responses WHERE DATE(created_at) >= ? GROUP BY DATE(created_at) ORDER BY DATE(created_at)',
                [dateFilter],
                (err, trendRows) => {
                    if (err) {
                        return res.status(500).json({ error: 'Erro ao buscar dados de tendência' });
                    }

                    // Montar resposta
                    const chartData = {
                        unitData: unitRows,
                        healthData: healthRows,
                        trendData: trendRows
                    };

                    res.json(chartData);
                }
            );
        });
    });
});
// Adicionar esta rota antes da rota padrão
app.get('/api/comparison-data', (req, res) => {
    // Consulta para obter médias por unidade e pergunta
    db.all(`
        SELECT 
            unit,
            AVG(CASE WHEN q1 = 'NUNCA/QUASE NUNCA' THEN 1
                     WHEN q1 = 'RARAMENTE' THEN 2
                     WHEN q1 = 'ÀS VEZES' THEN 3
                     WHEN q1 = 'FREQUENTEMENTE' THEN 4
                     WHEN q1 = 'SEMPRE' THEN 5 END) as q1_avg,
            AVG(CASE WHEN q2 = 'NUNCA/QUASE NUNCA' THEN 1
                     WHEN q2 = 'RARAMENTE' THEN 2
                     WHEN q2 = 'ÀS VEZES' THEN 3
                     WHEN q2 = 'FREQUENTEMENTE' THEN 4
                     WHEN q2 = 'SEMPRE' THEN 5 END) as q2_avg,
            AVG(CASE WHEN q3 = 'NUNCA/QUASE NUNCA' THEN 1
                     WHEN q3 = 'RARAMENTE' THEN 2
                     WHEN q3 = 'ÀS VEZES' THEN 3
                     WHEN q3 = 'FREQUENTEMENTE' THEN 4
                     WHEN q3 = 'SEMPRE' THEN 5 END) as q3_avg
        FROM responses
        GROUP BY unit
        ORDER BY unit
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar dados de comparação' });
        }
        res.json(rows);
    });
});
// Rota padrão
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});