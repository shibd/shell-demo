const term = new Terminal({
    theme: {
        background: '#000000',  // 设置背景色为黑色
    },
    fontSize: 18,  // 设置字体大小为18
});
const socket = new WebSocket('ws://localhost:3000');
const attachAddon = new AttachAddon.AttachAddon(socket);

// Attach the socket to term
term.loadAddon(attachAddon);
term.open(document.getElementById('terminal'));  // Attach the terminal to the "terminal" div
