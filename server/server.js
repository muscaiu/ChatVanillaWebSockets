var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var server = require('http').createServer(app);
var mongoose = require('mongoose')
var io = require('socket.io')(server)

//User model for mongoose
var User = mongoose.model('user', {
    username: String,
    password: String
})
var Message = mongoose.model('message', {
    username: String,
    message: String
})

//logged in users
var numUsers = 0;
var numSockets = 0;
var loggedUser = "Guest"

//io
io.on('connection', function(socket) {
    var addedUser = false
    var userToken = null
        ++numSockets
    console.log("Sockets: " + numSockets, " | Users: " + numUsers)

    socket.on('user token', function(data) {
        console.log(data)
    })

    //start API
    app.get('/api/user', GetUsers)

    function GetUsers(req, res) {
        User.find({}).exec(function(err, result) {
            console.log(result)
            res.send(result)
        })
    }
    app.get('/api/message', GetMessages)

    function GetMessages(req, res) {
        Message.find({}).exec(function(err, result) {
            res.send(result)
        })
    }

    socket.on('register user', function(username, password) {
        console.log('regUser: ' + username, 'regPassword: ' + password)
            //Save user in MongoDB
        var user = new User({
            username: username,
            password: password
        })
        user.save()

    });

    socket.on('login attempt', function(username, password) {
        User.findOne({ username: username, password: password }, function(err, user) {
            if (user) {
                if (addedUser) return;
                socket.username = username
                    ++numUsers
                addedUser = true;
                loggedUser = user.username
                console.log(loggedUser + ' logged in')
                console.log("Sockets: " + numSockets, " | Users: " + numUsers)

                //io.sockets.emit('user logged in', socket.username)
                socket.emit('login', {
                    username: socket.username,
                    numUsers: numUsers
                });
                io.sockets.emit('user logged in', {
                    username: socket.username,
                    numUsers: numUsers
                })
            } else {
                console.log('wrong credentials')
                socket.emit('wrong credentials')
            }
        })
    })

    socket.on('send message', function(data) {
        console.log(socket.username + ': ' + data)
            //Save user in MongoDB
        var message = new Message({
            username: socket.username,
            message: data,
        })
        message.save()
            //socket.emit('emit message', message)
        io.sockets.emit('emit message', {
            username: socket.username,
            message: data
        })
    })

    socket.on('log off', function(data) {
        console.log(loggedUser + " logged out")
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
        console.log("Sockets: " + numSockets, " | Users: " + numUsers)

        socket.username = "Guest"
        addedUser = false

        socket.broadcast.emit('log off event', numSockets, numUsers)
    })

    socket.on('disconnect', function() {
        console.log(loggedUser + " logged out")
            --numSockets
        console.log("Sockets: " + numSockets, " | Users: " + numUsers)
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
})

//serve files
app.use(express.static(__dirname + '/../client'));
app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        next();
    })
    //start server
server.listen(port, function() {
    console.log('Server listening on port %d', port)
})

//conenct to Mongoose
mongoose.connect('mongodb://localhost:27017/chat', function(err, db) {
    if (!err) {
        console.log('connected to mongo')
    } else(console.log(err))
})