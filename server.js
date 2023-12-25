const express = require('express');
const WebSocket = require('ws');
const pty = require('node-pty');

// 初始化 Express 和 WebSocket 服务器
const app = express();
const wss = new WebSocket.Server({ noServer: true });

let userInput = '';
const PROMPT_LENGTH = '➜  ~ '.length;

wss.on('connection', (ws) => {
    let echoShell = pty.spawn('zsh', ['-i'], {
        name: 'xterm-color',
        cwd: process.env.HOME,
        env: process.env
    });

    let execShell = pty.spawn('zsh', ['-i'], {
        name: 'xterm-color',
        cwd: process.env.HOME,
        env: process.env
    });
    execShell.write('proxy\n');
    execShell.write('apiserver-admin pools connect aws-use2-dixie-snc -n streamnative\n');

    ws.on('message', (message) => {
        userInput += message;

        console.log(message + ':' + userInput)

        if (message.includes('\r')) { // 检测 Enter 键
            if (userInput.trim() === 'delete') {
                ws.send('\r\nError: The "delete" command is not allowed.\r\n');
            } else {
                // 清理输入.
                ws.send(`\u001b[0G\u001b[${PROMPT_LENGTH}C\u001b[K`);
                execShell.write(userInput);
            }
            userInput = '';
            return;
        }

        echoShell.write(message); // 立即回显字符
    });



    echoShell.on('data', (data) => {
        ws.send(data);
    });

    execShell.on('data', (data) => {
        ws.send(data);
    });

    echoShell.on('exit', () => {
        ws.close();
    });

    execShell.on('exit', () => {
        ws.close();
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
