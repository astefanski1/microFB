/*jshint node: true, esversion: 6 */
var Post = require('../Models/Post');
var User = require('../Models/User');
var SharedPost = require('../Models/SharedPost');
var Notification = require('../Models/Notification');

module.exports = function(io) {
    //connection
    io.on('connection', function(socket) {
        socket.join(socket.request.user.id);
        console.log('user connected to room '+socket.request.user.id);

        //adding post
        socket.on('addPost', function(text){
          var userReq = socket.request.user;
          var newPost = new Post({
            text: text,
            author: socket.request.user.id,
            numberOfLikes: 0,
            time: Date.now()
          });

          newPost.save(function(err){
            if(err){throw err;}
            console.log('Succesfully added post! Text: ' + text +  "by user: " + socket.request.user.id + "username: " + socket.request.user.firstName);
            Post.findOne({text: text, author: userReq}, function(err, post){
              if(err){ throw err;}
              //console.log(post);
              User.findOne({username: userReq.username}).populate('friendsFollowing').populate('friends').exec(function(err, user){
                if(err){ throw err;}
                user.friends.forEach((friend, index) =>{
                  User.findOne({_id: friend.id}).populate('friendsFollowing').exec(function(err, userFriend){
                    userFriend.friendsFollowing.forEach((following, index) => {
                      if(following._id.equals(user._id)){
                        io.sockets.in(friend._id).emit('addPost', { text: text, user: userReq, time: 'Just now', postID: post._id });
                      }
                    });
                  });
                });
              });
              socket.emit('addPost', {text: text, user: userReq, time: 'Just now', postID: post._id} );
            });
          });
        });

        //adding post on profile
        socket.on('addPostOnProfile', function(text, profileUsername){
          var userReq = socket.request.user;
          User.findOne({username: profileUsername}, function(err, user){
            if(err){throw err;}
            var newPost = new Post({
              text: text,
              author: userReq.id,
              numberOfLikes: 0,
              onWall: user.id,
              time: Date.now()
            });

            newPost.save(function(err){
              if(err){throw err;}
              console.log('Succesfully added post! Text: ' + text +  "by user: " + userReq + "username: " + userReq.firstName);
              Post.findOne({text: text, author: userReq}, function(err, post){
                if(err){ throw err;}
                io.sockets.in(user._id).emit('addPost', { text: text, user: userReq, time: 'Just now', postID: post._id });
                socket.emit('addPostOnProfile', {text: text, user: userReq, time: 'Just now', postID: post._id} );
              });
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
            if(invite.equals(fromUserId)){
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
            Post.find({author: userReq._id}).populate('author').exec(function(err, posts){
              io.sockets.in(user.id).emit('addedFriendNotification', { inviteFromUser: socket.request.user, posts: posts });
            });
            Post.find({author: fromUserId}).populate('author').exec(function(err, posts){
              io.sockets.in(userReq._id).emit('addedFriendNotification', { inviteFromUser: socket.request.user, posts: posts });
            });
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

          //Dodajemy dynamicznie do chat listy
          User.findOne({_id: fromUserId}).exec(function(err, user){
              Post.find({}).populate('sharedPost').populate('author').exec(function(err, posts){
                var userPostsToSend = [];
                var userReqPostsToSend = [];
                posts.forEach((post, index) => {
                  if(post.author.equals(user.id)){
                    userPostsToSend.push(post);
                  }
                  if(post.author.equals(userReq.id)){
                    userReqPostsToSend.push(post);
                  }
                  post.sharedPost.forEach((shared, index) => {
                    if(shared.author.equals(user.id)){
                      userPostsToSend.push(shared);
                    }
                    if(shared.author.equals(userReq.id)){
                      userReqPostsToSend.push(shared);
                    }
                  });
                });
                io.sockets.in(userReq.id).emit('addedFriendDynamic', { user: user, userPosts: userPostsToSend });
                io.sockets.in(user.id).emit('addedFriendDynamic', { user: userReq, userPosts: userReqPostsToSend });
              });

          });



        });

        //decline invite
        socket.on('declineInvite', function(fromUserId) {
          var userReq = socket.request.user;
          console.log(userReq);

          console.log("Usuwamy invite z " + userReq.firstName);
          var element;
          userReq.friendsInvites.forEach((invite, index) => {
            console.log(invite);
            if(invite.equals(fromUserId)){
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
            io.sockets.in(friendID).emit('privateChatMessageSended', { message: message, whoSendedFirstName: userReq.firstName, whoSendedUsername: userReq.username });
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
            if(post === null){
              console.log("NULL");
              SharedPost.findOne({_id: postID}).exec(function(err, post){
                console.log(post);

                if(post.likes === undefined ){
                  console.log("Nie ma lajków!");
                  console.log(post.likes);
                  post.likes.push(userReq.id);
                  numberOfLikes = post.numberOfLikes;
                  post.numberOfLikes = numberOfLikes + 1;
                  post.save(function(err){
                    console.log("Like dodany do share posta " + postID + " przez: " + userReq.firstName);
                    socket.emit('postLikeAdded',{numberOfLikes: numberOfLikes, postID: postID});
                  });
                } else {
                  var isLiked = false;
                  console.log(post.likes);
                  for (var user of post.likes) {
                    console.log("Sprawdzam czy dał już like");
                    if(user.equals(userReq.id)){
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
                      if(like.equals(userReq.id)){
                        element = index;
                        console.log("TU "+element);
                      }
                    });

                    post.likes.splice(element,1);
                    numberOfLikes = post.numberOfLikes;
                    post.numberOfLikes = numberOfLikes -1;
                    post.save();
                    socket.emit('postLikeAdded',{numberOfLikes: numberOfLikes, postId: postID});

                  }else {
                    //Jeśli nie to dodajemy like
                    post.likes.push(userReq.id);
                    numberOfLikes = post.numberOfLikes;
                    post.numberOfLikes = numberOfLikes + 1;
                    post.save(function(err){
                      console.log("Like dodany do share posta " + postID + " przez: " + userReq.firstName);
                      socket.emit('postLikeAdded',{numberOfLikes: numberOfLikes, postID: postID});
                    });
                    //ELSE END
                  }
                  //ELSE END
                }
              });
            } else {
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
                      socket.emit('postLikeAdded', {numberOfLikes: numberOfLikes, postID: postID});
                  }
                );
              } else {
                var isLiked = false;
                console.log(post.likes);
                for (var user of post.likes) {
                  console.log("Sprawdzam czy dał już like");
                  if(user.equals(userReq.id)){
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
                    if(like.equals(userReq.id)){
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
            }
            //Post.find END
          });
          //Socket END
        });

        //SHARING POST
        socket.on('postShare', function(postID){
          var userReq = socket.request.user;
          Post.findOne({_id: postID}).populate('author').exec(function(err, post){
            //saving share
            var newShare = new SharedPost({
              text: post.text,
              author: post.author._id,
              numberOfLikes: 0,
              sharedByWho: userReq.id,
              originalPostId: post.id,
              time: Date.now()
            });
            //share save
            newShare.save(function(err){
              if(err){ throw err;}
              //Searching added shared post
              SharedPost.findOne({ $or: [ { sharedByWho: userReq.id }, { text: post.text } ] }).sort({_id: -1}).exec(function(err, sharedPost){
                console.log(sharedPost);
                //updating post
                Post.findOneAndUpdate(
                  {_id: postID},
                  {$push: {sharedPostId: sharedPost._id}},
                  {safe: true, upsert: true},
                  function(err, model) {
                      if(err){ throw err; }
                      //console.log("Shared dodany");
                      //Emit to all friends userReq
                      User.findOne({username: userReq.username}).populate('friends').exec(function(err, user){
                        user.friends.forEach((friend, index) => {
                          io.sockets.in(friend._id).emit('postShare', { sharedPost: sharedPost, user: userReq, time: 'Just now', author: post.author, postID: postID});
                        });
                      });
                    //emit on own Wall
                    socket.emit('postShare', { sharedPost: sharedPost, user: userReq, time: 'Just now', author: post.author, postID: postID});
                  });
              });
            });

          });
        });
        //END REGION

        //FOLLOWING FRIEND
        socket.on('followFriend', function(usernameToFollow){
          console.log("Próbuję pofollowować: " + usernameToFollow);
          var userReq = socket.request.user;
          var isFriend = false;
          var followFound = false;
          var followFoundIndex;
          User.findOne({username: userReq.username}).populate('friends').populate('friendsFollowing').exec(function(err, userRequest){
            User.findOne({username: usernameToFollow}).exec(function(err, userToFollow){
              //Sprawdzamy czy jest naszym friendem
              userRequest.friends.forEach((friend, index) => {
                if(friend.equals(userToFollow._id)){
                  console.log(userRequest.username + " ma w znajomych: " + userToFollow.username);
                  isFriend = true;
                }
              });
              //Jeśli ma w znajomych
              if(isFriend === true){
                //Szukamy czy już followujemy
                userRequest.friendsFollowing.forEach((follow, index) => {
                  if(follow.equals(userToFollow._id)){
                    console.log(userRequest.username + " już followuje "  + userToFollow.username);
                    //Wtedy unfollow
                    followFoundIndex = index;
                    followFound = true;
                  }
                });
                if(followFound === true){
                  userRequest.friendsFollowing.splice(followFoundIndex,1);
                  userRequest.save(function(){
                    console.log("Follow usunięty");
                  });
                }
                else {
                  userRequest.friendsFollowing.push(userToFollow._id);
                  userRequest.save(function(){
                    console.log("Follow dodany");
                  });
                }
              }
            });
          });
        });

        //END REGION
    //End connection
    });
};
