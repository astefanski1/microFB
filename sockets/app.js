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
    //End connection
    });
};
