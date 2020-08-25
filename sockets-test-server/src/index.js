const app = require('express')();
const server = app.listen(3000);
const io = require('socket.io').listen(server);

io.on('connection', (socket) => {
    console.log('a user connected');
});
