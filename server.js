const express = require('express');
const WebSocket = require('ws');
const pty = require('node-pty');

// 初始化 Express 和 WebSocket 服务器
const app = express();
const wss = new WebSocket.Server({ noServer: true });

let userInput = '';
let cursorPosition = 0;
const forbiddenCommands = ['rm', 'delete', 'pulsar-client', 'vim'];

wss.on('connection', (ws) => {
    let execShell = pty.spawn('zsh', ['-i'], {
        name: 'xterm-color',
        cwd: process.env.HOME,
        env: process.env
    });
    execShell.write('proxy\n');
    execShell.write('apiserver-admin pools connect aws-use2-dixie-snc -n streamnative\n');
    // execShell.write('kubectl exec -ti test-io-broker-1 /bin/bash -n o-5om91\n');

    ws.on('message', (message) => {
        if (message.includes('\r') || message.includes('\n')) { // Enter key
            console.log("user put all cmd: " + userInput);
            const firstCommand = userInput.trim().split(' ')[0];
            const forbiddenCommand = forbiddenCommands.find(command => firstCommand.includes(command));
            if (forbiddenCommand) {
                userInput = '';
                ws.send('\r\nError: The [' + forbiddenCommand + '] command is not allowed.\r\n');
                // Send Ctrl+C to the shell to cancel execution.
                execShell.write('\x03');
                return;
            }
            userInput = '';
            cursorPosition = 0;
        // TODO compatibility of different platforms needs to be dealt with.
        } else if (message.toString() === '\b' || message.toString() === '\x7f') { // Backspace or Delete key
            if (cursorPosition > 0) { // Ensure cursor isn't at the start
                userInput = userInput.slice(0, cursorPosition - 1) + userInput.slice(cursorPosition);
                cursorPosition--;
            }
        } else if (message.toString() === '\x1bOD') { // Left arrow key
            if (cursorPosition > 0) { // Ensure cursor isn't at the start
                cursorPosition--;
            }
        } else if (message.toString() === '\x1bOC') { // Right arrow key
            if (cursorPosition < userInput.length) { // Ensure cursor isn't at the end
                cursorPosition++;
            }
        } else { // Normal character
            userInput = userInput.slice(0, cursorPosition) + message + userInput.slice(cursorPosition);
            cursorPosition++;
        }
        console.log("receive :" + message.toString() + ':' + userInput);
        execShell.write(message);
    });

    execShell.on('data', (data) => {
        ws.send(data);
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
