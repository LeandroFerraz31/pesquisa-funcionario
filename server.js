const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises; // Usar promises para operações assíncronas

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
async function ensureStorageDir() {
    try {
        await fs.mkdir(storageDir, { recursive: true });
        console.log(`Diretório de armazenamento criado/verificado: ${storageDir}`);
    } catch (error) {
        console.error(`Erro ao criar diretório de armazenamento ${storageDir}:`, error);
        process.exit(1); // Encerrar o processo se o diretório não puder ser criado
    }
}

// Inicializar banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1);
    }
    console.log('Conectado ao banco de dados SQLite:', dbPath);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit TEXT NOT NULL,
        q1 TEXT NOT NULL,
        q2 TEXT NOT NULL,
        q3 TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar tabela responses:', err);
        } else {
            console.log('Tabela responses criada ou já existente');
        }
    });
});

// Credenciais fixas (Nota: Em produção, considere usar variáveis de ambiente ou um sistema de autenticação mais seguro)
const ADMIN_CREDENTIALS = {
    username: 'caren.santos',
    password: 'Meusfilhos@2'
};

// Lista de unidades
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
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios' });
    }

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
        if (!UNITS.includes(unit)) {
            return res.status(400).json({ error: `Unidade inválida: ${unit}` });
        }
        query = 'SELECT * FROM responses WHERE unit = ? ORDER BY created_at DESC';
        params.push(unit);
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar respostas:', err);
            return res.status(500).json({ error: 'Erro interno ao buscar respostas' });
        }
        res.json(rows || []);
    });
});

// Criar nova resposta
app.post('/api/responses', (req, res) => {
    const { unit, q1, q2, q3 } = req.body;
    
    if (!unit || !q1 || !q2 || !q3) {
        return res.status(400).json({ error: 'Todos os campos (unit, q1, q2, q3) são obrigatórios' });
    }

    if (!UNITS.includes(unit)) {
        return res.status(400).json({ error: `Unidade inválida: ${unit}` });
    }

    if (!RESPONSE_OPTIONS.includes(q1) || !RESPONSE_OPTIONS.includes(q2) || !RESPONSE_OPTIONS.includes(q3)) {
        return res.status(400).json({ error: 'Opções de resposta inválidas' });
    }
    
    db.run(
        'INSERT INTO responses (unit, q1, q2, q3) VALUES (?, ?, ?, ?)',
        [unit, q1, q2, q3],
        function(err) {
            if (err) {
                console.error('Erro ao salvar resposta:', err);
                return res.status(500).json({ error: 'Erro interno ao salvar resposta' });
            }
            res.status(201).json({ id: this.lastID, message: 'Resposta criada com sucesso' });
        }
    );
});

// Editar resposta
app.put('/api/responses/:id', (req, res) => {
    const { id } = req.params;
    const { unit, q1, q2, q3 } = req.body;
    
    if (!unit || !q1 || !q2 || !q3) {
        return res.status(400).json({ error: 'Todos os campos (unit, q1, q2, q3) são obrigatórios' });
    }

    if (!UNITS.includes(unit)) {
        return res.status(400).json({ error: `Unidade inválida: ${unit}` });
    }

    if (!RESPONSE_OPTIONS.includes(q1) || !RESPONSE_OPTIONS.includes(q2) || !RESPONSE_OPTIONS.includes(q3)) {
        return res.status(400).json({ error: 'Opções de resposta inválidas' });
    }
    
    db.run(
        'UPDATE responses SET unit = ?, q1 = ?, q2 = ?, q3 = ? WHERE id = ?',
        [unit, q1, q2, q3, id],
        function(err) {
            if (err) {
                console.error('Erro ao atualizar resposta:', err);
                return res.status(500).json({ error: 'Erro interno ao atualizar resposta' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: `Resposta com ID ${id} não encontrada` });
            }
            res.json({ id, message: 'Resposta atualizada com sucesso' });
        }
    );
});

// Excluir resposta
app.delete('/api/responses/:id', (req, res) => {
    const { id } = req.params;
    
    db.run(
        'DELETE FROM responses WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                console.error('Erro ao excluir resposta:', err);
                return res.status(500).json({ error: 'Erro interno ao excluir resposta' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: `Resposta com ID ${id} não encontrada` });
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
            console.error('Erro ao buscar dados das unidades:', err);
            return res.status(500).json({ error: 'Erro interno ao buscar dados das unidades' });
        }

        // Consulta para dados de saúde (baseado em q2 - estresse)
        db.all('SELECT q2 as label, COUNT(*) as value FROM responses GROUP BY q2', [], (err, healthRows) => {
            if (err) {
                console.error('Erro ao buscar dados de saúde:', err);
                return res.status(500).json({ error: 'Erro interno ao buscar dados de saúde' });
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
                        console.error('Erro ao buscar dados de tendência:', err);
                        return res.status(500).json({ error: 'Erro interno ao buscar dados de tendência' });
                    }

                    // Montar resposta
                    const chartData = {
                        unitData: unitRows || [],
                        healthData: healthRows || [],
                        trendData: trendRows || []
                    };

                    res.json(chartData);
                }
            );
        });
    });
});

// Rota para dados de comparação
app.get('/api/comparison-data', (req, res) => {
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
            console.error('Erro ao buscar dados de comparação:', err);
            return res.status(500).json({ error: 'Erro interno ao buscar dados de comparação' });
        }
        res.json(rows || []);
    });
});

// Rota padrão
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
async function startServer() {
    await ensureStorageDir();
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

// Fechar banco de dados ao encerrar o processo
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar o banco de dados:', err);
        }
        console.log('Banco de dados fechado');
        process.exit(0);
    });
});

startServer();