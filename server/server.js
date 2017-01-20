var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var server = require('http').createServer(app);
var mongoose = require('mongoose')
var io = require('socket.io')(server)
var _ = require('lodash')

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
var numUsers = 0
var numSockets = 0
var usersArray = []

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

    socket.on('request users', function() {
        socket.emit('receive users', {
            numUsers: numUsers,
            usersArray: usersArray
        });
    })

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
        //look in DB
        User.findOne({
            username: username,
            password: password
        }, function(err, user) {

            if (user) { //if user found  in DB
                if (addedUser) {
                    console.log(user, 'socket is already logged')
                } else {

                    usersArray.push(user.username)
                    numUsers = usersArray.length

                    socket.emit('user login', {
                        username: user.username,
                        numUsers: numUsers,
                        usersArray: usersArray
                    });
                    io.sockets.emit('global user login', {
                        username: user.username,
                        numUsers: numUsers,
                        usersArray: usersArray
                    })

                    console.log('users: ', usersArray)
                    console.log("Sockets: " + numSockets, " | Users: " + numUsers)
                    addedUser = true;
                }


            } else {
                console.log('wrong credentials')
                socket.emit('wrong credentials')
            }
        })
    })

    socket.on('send message', function(data) {

        console.log(data.loggedUser + ': ' + data.message) ///cHECK THSIIIII<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
            //Save user in MongoDB
        var message = new Message({
            username: data.loggedUser,
            message: data.message,
        })
        message.save()
            //socket.emit('emit message', message)
        io.sockets.emit('emit message', {
            username: data.loggedUser,
            message: data.message
        })
    })

    socket.on('click log off', function(clientLoggedUser) {
        if (addedUser) {
            _.pull(usersArray, clientLoggedUser)
            numUsers = usersArray.length

            io.sockets.emit('user left', {
                username: clientLoggedUser,
                numUsers: numUsers,
                usersArray: usersArray
            })

            //loggedUser = "Guest"
            addedUser = false
            console.log(clientLoggedUser + " logged out")
            console.log('users', usersArray)
            console.log("Sockets: " + numSockets, " | Users: " + numUsers)
        } else {
            socket.emit('not logged')
            console.log('not logged')
        }
    })

    socket.on('disconnect', function() {
        --numSockets
        console.log('users', usersArray)
        console.log("Sockets: " + numSockets, " | Users: " + numUsers)
        if (addedUser) {
            //_.pull(usersArray, loggedUser)

            socket.broadcast.emit('user left', {
                //username: loggedUser,
                numUsers: numUsers,
                usersArray: usersArray
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