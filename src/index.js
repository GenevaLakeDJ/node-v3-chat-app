const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/messages')
const { generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// let count = 0

// server (emit) -> client (receive) - countUpdated
// client (emit) -> server (receive) - increment

// Goal: Send a welcome message to new users

// 1. Have server emit "message" when new client connects
//    - Send "Welcome!" as the event data
// 2. Have client listen for "message" event and print to console
// 3. Test your work!

// Use io.on only for connection, socket.on for disconnect
// No need to emit 'connection' or 'disconnect', they are built into socket
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    // socket.emit('countUpdated', count)

    // socket.on('increment', () => {
    //     count++
    //     // line below only emits to the connection that performed the change
    //     // socket.emit('countUpdated', count)
    //     io.emit('countUpdated', count)
    // })
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            // can use return to stop code, or could use an else block
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        // Broadcast sends to everyone except for this socket.
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the chatroom!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()
    })

    // socket.on('sendMessage', (inputMessage) => {
    //     io.emit('pushMessage', inputMessage)
    // })

    // first argument is name, arguments available in the function are the second (and later) arguments from the emit function on the client side
    // last argument 'callback' below is what is sent back to the client (acknowledgement)
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback('Delivered!')
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left the room.`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})


