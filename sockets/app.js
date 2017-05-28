/*jshint node: true */
var Post = require('../Models/Post');
var User = require('../Models/User');

module.exports = function(io) {
    //connection
    io.on('connection', function(socket) {
        console.log('user connected');

        //adding post
        socket.on('addPost', function(text){
          var newPost = new Post({
            text: text,
            author: socket.request.user.id
          });

          newPost.save(function(err){
            if(err){throw err;}
            console.log('Succesfully added post! Text: ' + text +  "by user: " + socket.request.user.id + "username: " + socket.request.user.firstName);
          });

          var user = socket.request.user;
          socket.emit('addPost', {text: text, user: user, time: 'Just now'} );
        });


    //End connection
    });
};
