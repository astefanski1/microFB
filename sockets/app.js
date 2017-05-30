/*jshint node: true, esversion: 6 */
var Post = require('../Models/Post');
var User = require('../Models/User');
var Notification = require('../Models/Notification');

module.exports = function(io) {
    //connection
    io.on('connection', function(socket) {
        socket.join(socket.request.user.id);
        console.log('user connected to room '+socket.request.user.id);

        //adding post
        socket.on('addPost', function(text){
          var user = socket.request.user;
          var newPost = new Post({
            text: text,
            author: socket.request.user.id,
            numberOfLikes: 0
          });

          newPost.save(function(err){
            if(err){throw err;}
            console.log('Succesfully added post! Text: ' + text +  "by user: " + socket.request.user.id + "username: " + socket.request.user.firstName);
            Post.findOne({text: text, author: user}, function(err, post){
              if(err){ throw err;}
              console.log(post);
              socket.emit('addPost', {text: text, user: user, time: 'Just now', postID: post._id} );
            });
          });



        });

        //adding friend
        socket.on('addFriend', function(username){
          User.findOne({username: username}, function(err, user){
            if(err){ throw err; }
            console.log("Zalogowany user " + socket.request.user.id);
            console.log("Profil usera do dodania " + user.id);
            console.log("Dodajemy invite to friends do bazy dla użytkownika: " + user.id);
            //Dodanie invite do profilu usera
            User.findOneAndUpdate(
              {_id: user.id},
              {$push: {friendsInvites: socket.request.user.id}},
              {safe: true, upsert: true},
              function(err, model) {
                  if(err){ throw err; }
                  console.log("Invite dodany");
              }
            );
            //Dodajemy notifykację do bazy
            var newNotification = new Notification({
              text: "invited u to friends!",
              fromUser: socket.request.user.id,
              toUser: user.id,
              fromUserFullname: socket.request.user.firstName,
              toFriends: 1
            });

            newNotification.save(function(err){
              if(err){throw err;}
              console.log('Notyfikacja dodana do bazy: ' + user.id);
              Notification.findOne({fromUser: socket.request.user.id, toUser: user.id}, function(err, notification){
                if(err){throw err;}
                //Przypisujemy notyfikację do usera
                User.findOneAndUpdate(
                  {_id: user.id},
                  {$push: {notifications: notification.id}},
                  {safe: true, upsert: true},
                  function(err, model) {
                      if(err){ throw err; }
                      console.log("Notification dodany do usera " + user.id);
                  }
                );
              });
            });
            //Znajdujemy dodaną notyfikację

            //Wchodzimy na kanał usera do którego ma pójść invite
            io.sockets.in(user.id).emit('addFriendInviteNotification', { inviteFromUser: socket.request.user });
          });
        });

        //accepting invite to friends
        socket.on('acceptedInvite', function(fromUserId) {
          var userReq = socket.request.user;
          console.log(userReq);

          console.log("Usuwamy invite z " + userReq.firstName);
          var element;
          userReq.friendsInvites.forEach((invite, index) => {
            console.log(invite);
            if(invite == fromUserId){
              element = index;
              console.log("TU "+element);
            }
          });

          userReq.friendsInvites.splice(element,1);
          userReq.save();
          //Invite usunięty

          //usuwamy powiadomienie
          Notification.findOne({fromUser: fromUserId, toUser: userReq}, function(err, notification){
            notification.remove();
          });
          //Notyfikacja usunięta

          User.findOne({_id: fromUserId}, function(err, user){
            var newNotification = new Notification({
              text: "accepted u invite to friends!",
              fromUser: userReq.id,
              toUser: user.id,
              fromUserFullname: userReq.firstName,
              toFriends: 0
            });

            newNotification.save(function(err){
              if(err){throw err;}
              console.log('Notyfikacja dodana do bazy: ' + user.id);
              Notification.findOne({fromUser: userReq.id, toUser: user.id}, function(err, notification){
                if(err){throw err;}
                //Przypisujemy notyfikację do usera
                User.findOneAndUpdate(
                  {_id: user.id},
                  {$push: {notifications: notification.id}},
                  {safe: true, upsert: true},
                  function(err, model) {
                      if(err){ throw err; }
                      console.log("Notification dodany do usera " + user.id);
                  }
                );
              });
            });
            io.sockets.in(user.id).emit('addFriend', { inviteFromUser: socket.request.user });
          });

          //Dodajemy friendów do obu userów
          User.findOneAndUpdate(
            {_id: userReq.id},
            {$push: {friends: fromUserId}},
            {safe: true, upsert: true},
            function(err, model) {
                if(err){ throw err; }
                console.log("Friend dodany");
            }
          );

          User.findOneAndUpdate(
            {_id: fromUserId},
            {$push: {friends: userReq.id}},
            {safe: true, upsert: true},
            function(err, model) {
                if(err){ throw err; }
                console.log("Friend dodany");
            }
          );

        });

        //decline invite
        socket.on('declineInvite', function(fromUserId) {
          var userReq = socket.request.user;
          console.log(userReq);

          console.log("Usuwamy invite z " + userReq.firstName);
          var element;
          userReq.friendsInvites.forEach((invite, index) => {
            console.log(invite);
            if(invite == fromUserId){
              element = index;
              console.log("TU "+element);
            }
          });

          userReq.friendsInvites.splice(element,1);
          userReq.save();
          //Invite usunięty

          //usuwamy powiadomienie
          Notification.findOne({fromUser: fromUserId, toUser: userReq}, function(err, notification){
            notification.remove();
          });
        });

        //open allFriends chat
        socket.on('allFriendsChatOpen', function(){
          var userReq = socket.request.user;
          console.log('User: '+ userReq.firstName + ' otworzył czat z allFriends');
        });
        //allFriendsChat message sended
        socket.on('allFriendsChatMessageSended', function(text){
          var userReq = socket.request.user;
          var message = text;

          for (var friendID of userReq.friends) {
            io.sockets.in(friendID).emit('allFriendsChatMessageSended', { message: message, whoSended: userReq.firstName });
          }
        });

        //privateChat message sended
        socket.on('privateChatMessageSended', function(text, privateChatWith){
          var userReq = socket.request.user;
          var message = text;

          User.findOne({username: privateChatWith}, function(err, privateChatUser){
            io.sockets.in(privateChatUser.id).emit('privateChatMessageSended', { message: message, whoSendedFirstName: userReq.firstName, whoSendedUsername: userReq.username });
          });
        });

        //like post

        socket.on('postLike', function(postID){
          var userReq = socket.request.user;
          var numberOfLikes = 0;
          Post.findOne({_id: postID}).exec(function(err, post){
            if(post.likes === undefined ){
              console.log("Nie ma lajków!");
              console.log(post.likes);
              Post.findOneAndUpdate(
                {_id: postID},
                {$push: {likes: userReq.id}},
                {safe: true, upsert: true},
                function(err, model) {
                    if(err){ throw err; }
                    console.log("Like dodany do posta " + postID + " przez: " + userReq.firstName);
                    numberOfLikes +=1;
                    socket.emit('postLikeAdded', {numberOfLikes: numberOfLikes, postID: postID});
                }
              );
            } else {
              var isLiked = false;
              console.log(post.likes);
              for (var user of post.likes) {
                console.log("Sprawdzam czy dał już like");
                if(user == userReq.id){
                  console.log("Dał już like");
                  isLiked = true;
                  numberOfLikes +=1;
                }
              }

              //Jeśli dał już like
              if(isLiked === true){
                //To usuwamy like
                var element;
                post.likes.forEach((like, index) => {
                  console.log(like);
                  if(like == userReq.id){
                    element = index;
                    console.log("TU "+element);
                  }
                });

                post.likes.splice(element,1);
                post.save();
                numberOfLikes -=1;
                socket.emit('postLikeAdded',{numberOfLikes: numberOfLikes, postId: postID});

              }else {
                //Jeśli nie to dodajemy like
                Post.findOneAndUpdate(
                  {_id: postID},
                  {$push: {likes: userReq.id}},
                  {safe: true, upsert: true},
                  function(err, model) {
                      if(err){ throw err; }
                      console.log("Like dodany do posta " + postID + " przez: " + userReq.firstName);
                      numberOfLikes +=1;
                      socket.emit('postLikeAdded',{numberOfLikes: numberOfLikes, postID: postID});
                  }
                );
                //ELSE END
              }
              //ELSE END
            }
            //Post.find END
          });
          //Socket END
        });

    //End connection
    });
};
