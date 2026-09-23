const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clear');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

// Conexão WebSocket (Mude para o link do Render após o deploy)
const ws = new WebSocket('ws://localhost:8080');

let drawing = false;

// Configuração do Canvas
ctx.lineWidth = 3;
ctx.lineCap = 'round';
ctx.strokeStyle = '#000000';

// Eventos de Desenho (Local)
canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', draw);

function draw(e) {
    if (!drawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Envia as coordenadas para o servidor em tempo real
    ws.send(JSON.stringify({ type: 'draw', x, y, drawing }));
}

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ws.send(JSON.stringify({ type: 'clear' }));
});

// Eventos de Chat
chatSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });

function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(`Você: ${text}`);
    ws.send(JSON.stringify({ type: 'chat', text }));
    chatInput.value = '';
}

function appendMessage(msg) {
    const msgEl = document.createElement('div');
    msgEl.textContent = msg;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Recebendo dados do Servidor (Outros Jogadores)
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'draw') {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
    } else if (data.type === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (data.type === 'chat') {
        appendMessage(`Jogador: ${data.text}`);
    }
};

ws.onclose = () => {
    appendMessage('🔴 Desconectado do servidor.');
};
