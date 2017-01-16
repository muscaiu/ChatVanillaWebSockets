// var app = angular.module('ChatApp', ['ngRoute'])
var app = angular.module('ChatApp', ['ui.router', 'ngMaterial', 'ngStorage'])

//UI.ROUTER
.config(function config($stateProvider, $urlRouterProvider) {

    $stateProvider

        .state("chat", {
            url: "/chat",
            templateUrl: "chat.html",
            controller: "ChatController as chat",
        })
        .state("chat.login", {
            url: "/login",
            templateUrl: "login.html",
        })
        .state("chat.register", {
            url: "/register",
            templateUrl: "register.html",
        })
        .state("chat.chatroom", {
            url: "/chatroom",
            templateUrl: "chatroom.html",
        })

    $urlRouterProvider.otherwise('/chat/login');
})

//Services
// .service('loggedUsers', function LoggedUsers() {
//     var loggedUsers = this;
//     loggedUsers.users = []
// })

//LoginController
.controller('ChatController', function ChatController($scope, $state, $localStorage) {
    var socket = io()

    var chat = this
    chat.users = []
    chat.messages = []
    var connected = false
    $scope.$participants = 0

    $scope.$currentUser = $localStorage.$default({
        username: 'Guest',
        token: null
    })

    LoadMessages()

    function LoadMessages() {
        $.getJSON('http://localhost:3000/api/message', function(data) {
            $.each(data, function(key, val) {
                addChatMessage(val)
            })
        })
    }

    $scope.clickDisconnect = function() {
        $scope.$currentUser.$reset()
        $scope.$currentUser.username = 'Guest'
    }

    chat.LoginForm = function() {
        if (chat.usernameLogin == "") {
            Materialize.toast('Empty fields!', 4000)
        } else {
            console.log(chat.usernameLogin, chat.passwordLogin)
            console.log('users: ' + chat.users)
            socket.emit('login attempt', chat.usernameLogin, chat.passwordLogin)
        }
    }

    chat.RegisterForm = function() {
        if (chat.passwordRegister === chat.repeatPasswordRegister) {
            socket.emit('register user', chat.usernameRegister, chat.passwordRegister)
        } else {
            Materialize.toast('Passwords don`t match !', 4000)
            console.log('wrong credentials')
        }
    }

    chat.sendMessage = function() {
        socket.emit('send message', chat.message)
        chat.message = ''
    }

    //when the user is succesfully connected by the server
    socket.on('login', function(data) {
        connected = true
        $state.go('chat.chatroom')
        chat.usernameLogin = ''
        chat.passwordLogin = ''

        //connect user to token
        var userToken = Math.random().toString(36).substring(3, 16) // + new Date
        localStorage.setItem('userToken', userToken)
            //socket.emit('user token', localStorage.getItem('userToken'))
        console.log(userToken)

        $scope.$currentUser = {
            username: data.username,
            token: userToken
        }

    })

    //when a user has logged in alert all sockets
    socket.on('user logged in', function(data) {
        $scope.$apply(function() {
            chat.users.push(data.username);
            $scope.$participants = data.numUsers
            console.log('logged in users: ' + chat.users)
        })
    })

    socket.on('wrong credentials', function() {
        Materialize.toast('Wrong credentials !', 4000)
        console.log('wrong credentials')
    })

    //add message the screen
    var addChatMessage = function(data) {
            $scope.$apply(function() {
                chat.messages.push({
                    username: data.username,
                    message: data.message
                });
            })
        }
        //send the message to the server
    socket.on('emit message', function(data) {
        $scope.$apply(function() {
            chat.messages.push({
                username: data.username,
                message: data.message
            });
        })
    })

    socket.on('user left', function(data) {
        $scope.$apply(function() {
            chat.users.splice(-1, 1)
            $scope.$participants = data.numUsers
                //chat.users.push(data.username);
        })
        console.log(data.username + ' left')
    })

    socket.on('disconnect', function() {
        Materialize.toast('Disconnected', 4000)
    })
    socket.on('reconnect', function() {
        Materialize.toast('Connected', 4000)
    })
    socket.on('reconnect_error', function() {
        Materialize.toast('Attempt to reconnect failed', 4000)
    })
})

$(document).on('click', '#toast-container .toast', function() {
    $(this).fadeOut(function() {
        $(this).remove();
    });

});





// var app = angular.module('ChatApp', ['ui.router'])

//     //UI.ROUTER
//     .config(function config($stateProvider, $urlRouterProvider) {
//         // $stateProvider
//         //     .state('home', {
//         //         controller: "HomeController as home",
//         //         url: '',
//         //         templateUrl: 'navbar.html'
//         //         // views: {
//         //         //     nav: {
//         //         //         templateUrl: 'navbar.html'
//         //         //     }
//         //         // }
//         //     })

// //Routing ngRoute
// .config(function ($routeProvider) {
//     $routeProvider
//         .when('/login', {
//             controller: 'LoginController',
//             templateUrl: 'login.html'
//         })
//         .when('/register', {
//             controller: 'RegisterController',
//             templateUrl: 'register.html'
//         })
//         .otherwise({
//             redirectTo: '/login'
//         })
// })

// .service('sharedProperties', function () {
//     var property = '1'
//     return {
//         getProperty: function () {
//             return property;
//         },
//         setProperty: function (value) {
//             property = value;
//         }
//     };
// })