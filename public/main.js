const term = new Terminal({
    theme: {
        background: '#000000',  // 设置背景色为黑色
    },
    fontSize: 18,  // 设置字体大小为18
});
term.open(document.getElementById('terminal'));

const socket = new WebSocket('ws://localhost:3000');

let commandBuffer = '';

socket.onopen = () => {
    term.onKey(({ key, domEvent }) => {
        const keyCode = domEvent.keyCode;

        if (keyCode === 13) {  // Enter 键
            // 当用户按下 Enter 键时，发送完整的命令
            socket.send(commandBuffer);
            commandBuffer = '';
        } else {
            // 不是 Enter 键，将字符添加到缓冲区
            commandBuffer += key;
        }

        term.write(key);
    });
};

socket.onmessage = event => {
    term.write(event.data);
};
