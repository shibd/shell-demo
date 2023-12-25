// server.js
const express = require('express');
const { spawn } = require('child_process');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    const shellPath = process.env.SHELL || '/bin/sh';
    const env = Object.assign({}, process.env, { PATH: '/usr/local/bin:' + process.env.PATH });
    const shell = spawn(shellPath, [], { env: env });

    let shellOutput = '';

    shell.stdout.on('data', (data) => {
        shellOutput += data.toString();
    });

    shell.stderr.on('data', (data) => {
        shellOutput += data.toString();
    });

    shell.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    socket.on('command', (command) => {
        shellOutput = '';
        shell.stdin.write(`${command}\n`);
        // Allow some time for the command to execute and output to be collected
        setTimeout(() => {
            if (shellOutput === '') {
                socket.emit('output', 'Command execution timed out');
            } else {
                if (command === 'pwd') {
                    socket.emit('pwd', shellOutput);
                } else {
                    socket.emit('output', shellOutput);
                }
            }
        }, 100000);

    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
