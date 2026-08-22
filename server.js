const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'tarefas.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function lerTarefas() {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, '[]', 'utf-8');
    }
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data || '[]');
}

function salvarTarefas(tarefas) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(tarefas, null, 4), 'utf-8');
}

const CATEGORIAS_VALIDAS = ['Estudo', 'Trabalho', 'Pessoal', 'Evento', 'Outro'];
const PRIORIDADES_VALIDAS = ['Baixa', 'Média', 'Alta'];

app.get('/tarefas', (req, res) => {
    try {
        const tarefas = lerTarefas();
        tarefas.sort((a, b) => new Date(`${a.data}T${a.horario || '00:00'}`) - new Date(`${b.data}T${b.horario || '00:00'}`));
        res.json(tarefas);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao ler tarefas.' });
    }
});

app.post('/tarefas', (req, res) => {
    const { titulo, descricao, data, horario, categoria, prioridade } = req.body;

    if (!titulo || !data || !categoria || !prioridade) {
        return res.status(400).json({ erro: 'Título, data, categoria e prioridade são obrigatórios.' });
    }

    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
        return res.status(400).json({ erro: 'Categoria inválida.' });
    }

    if (!PRIORIDADES_VALIDAS.includes(prioridade)) {
        return res.status(400).json({ erro: 'Prioridade inválida.' });
    }

    const tarefas = lerTarefas();
    const novoId = tarefas.length > 0 ? Math.max(...tarefas.map(t => t.id)) + 1 : 1;

    const novaTarefa = {
        id: novoId,
        titulo: titulo.trim(),
        descricao: (descricao || '').trim(),
        data,
        horario: horario || '00:00',
        categoria,
        prioridade,
        concluida: false
    };

    tarefas.push(novaTarefa);
    salvarTarefas(tarefas);

    res.status(201).json(novaTarefa);
});

app.put('/tarefas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const tarefas = lerTarefas();
    const tarefa = tarefas.find(t => t.id === id);

    if (!tarefa) {
        return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    }

    tarefa.concluida = !tarefa.concluida;
    salvarTarefas(tarefas);

    res.json(tarefa);
});

app.delete('/tarefas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let tarefas = lerTarefas();
    const index = tarefas.findIndex(t => t.id === id);

    if (index === -1) {
        return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    }

    tarefas = tarefas.filter(t => t.id !== id);
    salvarTarefas(tarefas);

    res.json({ mensagem: 'Tarefa excluída com sucesso.' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});