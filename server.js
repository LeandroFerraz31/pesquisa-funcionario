const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises; // Usar promises para operações assíncronas

const app = express();
const PORT = process.env.PORT || 80;

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
    // Modificado: Criar tabela com colunas q1 a q40
    const columns = ['id INTEGER PRIMARY KEY AUTOINCREMENT', 'unit TEXT NOT NULL'];
    for (let i = 1; i <= 40; i++) {
        columns.push(`q${i} TEXT NOT NULL`);
    }
    columns.push('created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    const createTableQuery = `CREATE TABLE IF NOT EXISTS responses (${columns.join(', ')})`;
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('Erro ao criar tabela responses:', err);
        } else {
            console.log('Tabela responses criada ou já existente');
        }
    });
});

db.get('SELECT COUNT(*) as total FROM responses', [], (err, row) => {
    if (err) return console.error('Erro ao verificar registros iniciais:', err);

    if (row.total === 0) {
        const unit = 'Logística';
        const values = Array.from({ length: 40 }, () => 'ÀS VEZES');
        const query = `INSERT INTO responses (unit, ${values.map((_, i) => `q${i + 1}`).join(', ')}) VALUES (?, ${values.map(() => '?').join(', ')})`;
        db.run(query, [unit, ...values], (err) => {
            if (err) console.error('Erro ao inserir resposta de teste:', err);
            else console.log('Resposta de teste inserida com sucesso');
        });
    }
});


// Credenciais fixas
const ADMIN_CREDENTIALS = {
    username: 'caren.santos',
    password: 'Meusfilhos@2'
};

// Mapeamento das opções de resposta
const UNITS = [
    'Logística', 'Britagem', 'SST', 'Oficina', 'Laboratório',
    'CA', 'F1', 'F2', 'F3', 'F5', 'F6', 'F7', 'F9', 'F10', 'F12', 'F14', 'F17', 'F18'
];

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

// Rota para criar nova resposta
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.get(query, [username, password], (err, user) => {
        if (err) {
            console.error('Erro ao verificar usuário:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
        }

        res.json({ success: true, message: 'Login bem-sucedido.' });
    });
});

// Rota para atualizar resposta
app.put('/api/responses/:id', (req, res) => {
    const { id } = req.params;
    const data = req.body;

    // Validar unit e respostas q1 a q40
    const requiredFields = ['unit'].concat(Array.from({ length: 40 }, (_, i) => `q${i + 1}`));
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` });
    }

    if (!UNITS.includes(data.unit)) {
        return res.status(400).json({ error: `Unidade inválida: ${data.unit}` });
    }

    // Validar opções de resposta
    for (let i = 1; i <= 40; i++) {
        const q = `q${i}`;
        const optionKey = QUESTION_OPTIONS[q] || QUESTION_OPTIONS.default;
        const options = RESPONSE_OPTIONS[optionKey];
        if (!options.includes(data[q])) {
            return res.status(400).json({ error: `Resposta inválida para ${q}: ${data[q]}` });
        }
    }

    // Atualizar no banco
    const updates = requiredFields.map(field => `${field} = ?`).join(', ');
    const values = requiredFields.map(field => data[field]).concat([id]);
    const query = `UPDATE responses SET ${updates} WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            console.error('Erro ao atualizar resposta:', err);
            return res.status(500).json({ error: 'Erro interno ao atualizar resposta' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: `Resposta com ID ${id} não encontrada` });
        }
        res.json({ id, message: 'Resposta atualizada com sucesso' });
    });
});

// Editar resposta
app.put('/api/responses/:id', (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    // Modificado: Validar unit e q1 a q40
    const requiredFields = ['unit'].concat(Array.from({length: 40}, (_, i) => `q${i+1}`));
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` });
    }

    if (!UNITS.includes(data.unit)) {
        return res.status(400).json({ error: `Unidade inválida: ${data.unit}` });
    }

    // Validar opções de resposta
    for (let i = 1; i <= 40; i++) {
        const q = `q${i}`;
        const options = QUESTION_OPTIONS[q] || QUESTION_OPTIONS.default;
        if (!options.includes(data[q])) {
            return res.status(400).json({ error: `Resposta inválida para ${q}: ${data[q]}` });
        }
    }
    
    // Modificado: Atualizar q1 a q40
    const updates = requiredFields.map(field => `${field} = ?`).join(', ');
    const values = requiredFields.map(field => data[field]).concat([id]);
    const query = `UPDATE responses SET ${updates} WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            console.error('Erro ao atualizar resposta:', err);
            return res.status(500).json({ error: 'Erro interno ao atualizar resposta' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: `Resposta com ID ${id} não encontrada` });
        }
        res.json({ id, message: 'Resposta atualizada com sucesso' });
    });
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

        // Modificado: Usar q28 para dados de saúde
        db.all('SELECT q28 as label, COUNT(*) as value FROM responses GROUP BY q28', [], (err, healthRows) => {
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
    // Modificado: Calcular médias para q1 a q40, mas retornar apenas q1, q2, q3 para gráficos
    const responseValues = {
        'NUNCA/QUASE NUNCA': 1,
        'RARAMENTE': 2,
        'ÀS VEZES': 3,
        'FREQUENTEMENTE': 4,
        'SEMPRE': 5,
        'EXCELENTE': 5,
        'MUITO BOA': 4,
        'BOA': 3,
        'RAZOÁVEL': 2,
        'DEFICITÁRIA': 1,
        'UM POUCO': 2,
        'MODERADAMENTE': 3,
        'MUITO': 4,
        'EXTREMAMENTE': 5
    };

    const caseStatements = Array.from({length: 40}, (_, i) => {
        const q = `q${i+1}`;
        return `AVG(CASE
            ${Object.entries(responseValues).map(([key, value]) => `WHEN ${q} = '${key}' THEN ${value}`).join(' ')}
            ELSE 0 END) as ${q}_avg`;
    }).join(', ');

    const query = `
        SELECT unit, ${caseStatements}
        FROM responses
        GROUP BY unit
        ORDER BY unit
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar dados de comparação:', err);
            return res.status(500).json({ error: 'Erro interno ao buscar dados de comparação' });
        }
        // Filtrar apenas q1, q2, q3 para compatibilidade com os gráficos
        const filteredRows = rows.map(row => ({
            unit: row.unit,
            q1_avg: row.q1_avg,
            q2_avg: row.q2_avg,
            q3_avg: row.q3_avg
        }));
        res.json(filteredRows || []);
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