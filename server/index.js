const express = require('express');
const socketio = require('socket.io');
const Http = require('http');
const cors = require('cors')

const {addUser, removeUser, getUser, getUserInRoom} = require('./user');

const PORT = process.env.PORT || 5000;
const router = require('./router');
const app = express();
const server = Http.createServer(app);
const io = socketio(server);

app.use(router);
app.use(cors());

io.on('connection', function(socket){
    socket.on('join', ({name, room}, callback) => { //to recieve data from the client side
        const {error, user} = addUser({id: socket.id, name, room});

        if(error){
            return callback(error)
        }
        socket.emit('message', {user: 'admin', text: `${user.name} , welcome to ${user.room}`});
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name} has joined`});
        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUserInRoom(user.room)})

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
    
        io.to(user.room).emit('message', { user: user.name, text: message });
        io.to(user.room).emit('roomData', { room: user.room,users: getUserInRoom(user.room) });
    
        callback();
      });


    socket.on('disconnect', function(){
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} had left`});
        }
    })
})

server.listen(PORT, () => 
    console.log(` server has started on port ${PORT}`)
);