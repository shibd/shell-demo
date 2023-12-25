const express = require('express');
const WebSocket = require('ws');
const pty = require('node-pty');
const os = require('os');

// 初始化 Express 和 WebSocket 服务器
const app = express();
const wss = new WebSocket.Server({noServer: true});

// 创建一个新的 pty
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'zsh';
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
});

// 在 pty 中执行代理命令和 apiserver-admin 命令
ptyProcess.write('proxy\n');
ptyProcess.write('apiserver-admin pools connect aws-use2-dixie-snc -n streamnative\n');

// 当 WebSocket 接收到消息时，将其写入 pty
wss.on('connection', ws => {
    ws.on('message', message => {
        // 检查消息是否是一个字符串
        let stringMessage;
        if (typeof message !== 'string') {
            stringMessage = message.toString();
        }
        // 检查是否为不允许的命令
        if (stringMessage.trim().startsWith('kubectl delete')) {
            ws.send('Error: kubectl delete command is not allowed.\n');
        } else {
            // 如果消息不能被解析为 JSON，将其作为一个普通的命令处理
            ptyProcess.write(stringMessage + '\n');
        }
    });
});



// 当 pty 接收到数据时，将其发送到所有 WebSocket 连接
ptyProcess.on('data', data => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
});

// 为静态文件提供服务
app.use(express.static('public'));

// 将 Express 和 WebSocket 服务器绑定到同一个端口
const server = app.listen(3000, () => console.log('Listening on port 3000'));
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
    });
});
