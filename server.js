const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

// Configuração do Servidor
app.use(express.json());
app.use(express.static('public'));

// Conexão com o Banco de Dados (Render)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- ROTA ESPECIAL PARA CRIAR A TABELA ---
app.get('/setup-tabela', async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS produtos (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                time VARCHAR(255),
                preco VARCHAR(50),
                imagem TEXT
            );
        `);
        res.send("<h1>Sucesso!</h1><p>Tabela 'produtos' criada. Agora vá para o /admin.html e cadastre a primeira camisa.</p>");
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao criar tabela: " + err.message);
    }
});
// -----------------------------------------

// ROTA 1: Pegar produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar produtos" });
    }
});

// ROTA 2: Adicionar produto
app.post('/api/produtos', async (req, res) => {
    const { nome, time, preco, imagem } = req.body;
    const senha = req.headers['admin-senha'];
    
    if (senha !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Senha incorreta!" });
    }

    try {
        const query = 'INSERT INTO produtos (nome, time, preco, imagem) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [nome, time, preco, imagem];
        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao salvar" });
    }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
