const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const crypto = require('crypto');

const token = crypto.createHash("md5").update("hanyadiaksesolehadmin").digest("hex")

const port = 6558
const ipAddress = '127.0.0.1'

var connectedUsers = {};
var pengguna = {};

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.render('main.ejs')
})

app.get('/serv/admin', (req, res) => {
    if (req.query.token == token) {
        res.render('server.ejs')
    } else {
        res.send("Sorry, you don't have permission to access this page.<br>Visit this url for client chat <a href='http://"+ipAddress+":"+port+"'>http://"+ipAddress+":"+port+"");
    }
})

io.sockets.on('connection', (socket) => {
    socket.on('username', ({username}) => {
        socket.username = username
        connectedUsers[username] = socket;
        pengguna[username] = username;
        io.emit('is_online', {username:username, message: 'bergabung di chatroom.', status: 'online', users: pengguna})
        console.log('- '+socket.username + " bergabung di chatroom ("+Object.keys(connectedUsers).length+" pengguna aktif) -");
    })

    socket.on('disconnect', (username) => {
        delete connectedUsers[socket.username]
        delete pengguna[socket.username]
        console.log('- '+socket.username + " keluar di chatroom ("+Object.keys(connectedUsers).length+" pengguna aktif) -");
        io.emit('is_online', {username:socket.username, message: 'keluar dari chatroom.', status: 'offline', users: pengguna})
    })

    socket.on('chat_message', ({message, color, time}) => {
        console.log('[*]'+socket.username+': '+ message)
        io.emit('chat_message', { username: socket.username, message: message, color: color, time: time })
    })

    socket.on("private", function(data) {
        const ke = data.ke,
                message = data.pesan,
                    dari = data.dari,
                        time = data.time

        if(connectedUsers.hasOwnProperty(ke)){
            connectedUsers[ke].emit('private',{
                //The sender's username
                username : dari,
                //Message sent to receiver
                message : message,
                to: ke,
                color: connectedUsers[ke].color,
                time: time
            });
            connectedUsers[dari].emit('private',{
                //The sender's username
                username : dari,
                //Message sent to receiver
                message : message,
                to: ke,
                color: connectedUsers[ke].color,
                time: time
            });
        } else {
            connectedUsers[data.dari].emit('private', { message: 'Username tidak ditemukan.'})
        }
    });
})

const server = http.listen(port, ipAddress, () => {
    console.log(`Server listening on ${ipAddress}:${port}`)
    console.log(`Visit the following url to chat`)
    console.log(`- Admin: http://${ipAddress}:${port}/serv/admin/?token=${token}`)
    console.log(`- User : http://${ipAddress}:${port}/`)
})