let tarefas = [];

const formTarefa = document.getElementById('form-tarefa');
const filtroStatus = document.getElementById('filtro-status');
const filtroCategoria = document.getElementById('filtro-categoria');
const listaTarefas = document.getElementById('lista-tarefas');
const listaProximos = document.getElementById('lista-proximos');

document.addEventListener('DOMContentLoaded', carregarTarefas);

formTarefa.addEventListener('submit', async (e) => {
    e.preventDefault();

    const novaTarefa = {
        titulo: document.getElementById('titulo').value,
        descricao: document.getElementById('descricao').value,
        data: document.getElementById('data').value,
        horario: document.getElementById('horario').value,
        categoria: document.getElementById('categoria').value,
        prioridade: document.getElementById('prioridade').value
    };

    const resposta = await fetch('/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaTarefa)
    });

    if (resposta.ok) {
        formTarefa.reset();
        await carregarTarefas();
    } else {
        const err = await resposta.json();
        alert(err.erro || 'Erro ao salvar tarefa');
    }
});

filtroStatus.addEventListener('change', renderizarTarefas);
filtroCategoria.addEventListener('change', renderizarTarefas);

async function carregarTarefas() {
    const res = await fetch('/tarefas');
    tarefas = await res.json();
    renderizarTarefas();
    renderizarProximosCompromissos();
}

function renderizarTarefas() {
    listaTarefas.innerHTML = '';

    const statusVal = filtroStatus.value;
    const catVal = filtroCategoria.value;

    const filtradas = tarefas.filter(t => {
        const matchStatus = statusVal === 'Todas' ||
            (statusVal === 'Pendentes' && !t.concluida) ||
            (statusVal === 'Concluídas' && t.concluida);

        const matchCat = catVal === 'Todas' || t.categoria === catVal;

        return matchStatus && matchCat;
    });

    if (filtradas.length === 0) {
        listaTarefas.innerHTML = '<p>Nenhuma tarefa encontrada.</p>';
        return;
    }

    filtradas.forEach(t => {
        const card = document.createElement('div');
        const prioClass = `prio-${t.prioridade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;
        const catClass = `badge-${t.categoria.toLowerCase()}`;

        card.className = `card-tarefa ${prioClass} ${t.concluida ? 'concluida' : ''}`;

        const dataFormatada = new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR');

        card.innerHTML = `
            <div class="detalhes">
                <h3>${t.titulo}</h3>
                ${t.descricao ? `<p>${t.descricao}</p>` : ''}
                <p><strong>Data:</strong> ${dataFormatada} às ${t.horario}</p>
                <p>
                    <span class="badge ${catClass}">${t.categoria}</span>
                    <strong>Prioridade:</strong> ${t.prioridade} | 
                    <strong>Status:</strong> ${t.concluida ? 'Concluída' : 'Pendente'}
                </p>
            </div>
            <div class="acoes">
                <button class="btn-concluir" onclick="alternarConcluida(${t.id})">
                    ${t.concluida ? 'Refazer' : 'Concluir'}
                </button>
                <button class="btn-excluir" onclick="excluirTarefa(${t.id})">Excluir</button>
            </div>
        `;

        listaTarefas.appendChild(card);
    });
}

async function alternarConcluida(id) {
    await fetch(`/tarefas/${id}`, { method: 'PUT' });
    await carregarTarefas();
}

async function excluirTarefa(id) {
    await fetch(`/tarefas/${id}`, { method: 'DELETE' });
    await carregarTarefas();
}

function renderizarProximosCompromissos() {
    listaProximos.innerHTML = '';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const proximas = tarefas
        .filter(t => !t.concluida)
        .map(t => ({
            ...t,
            dataHoraObj: new Date(`${t.data}T${t.horario || '00:00'}`)
        }))
        .filter(t => t.dataHoraObj >= hoje)
        .sort((a, b) => a.dataHoraObj - b.dataHoraObj)
        .slice(0, 3);

    if (proximas.length === 0) {
        listaProximos.innerHTML = '<p>Nenhum compromisso próximo pendente.</p>';
        return;
    }

    proximas.forEach(t => {
        const item = document.createElement('div');
        item.className = 'item-proximo';
        const dataFmt = new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR');
        item.innerHTML = `<strong>${dataFmt} - ${t.horario}</strong>: ${t.titulo} (${t.categoria})`;
        listaProximos.appendChild(item);
    });
}