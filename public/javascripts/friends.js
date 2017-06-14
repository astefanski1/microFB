/* jshint node: true, esversion: 6 */
/* globals $:false */

$(document).ready(function() {

  var socket = io();

  //searchBox input showing users
  $('#searchBox').on('keyup', function() {
    var text = $('#searchBox').val();
    var data = {};
    $.ajax({
      type: 'GET',
      contentType: 'application/json',
      url: '/searchFriends/' + text,
      success: function(data)
      {
        $('#searchResults').hide();
        for(let user of data){
            $('#searchResults').append(`<li id="${user._id}"><a href="/users/profile/${user.username}">${user.firstName} ${user.lastName}</a></li>`);
            $('#searchResults').show();
          }
      },
      error: function(){
          $('#searchResults').hide();
      }
      });

      $('#searchResults').empty();
    });

    //Clicking at user from searchBox
    $('#searchResults').on('click','li',function(data){
      console.log(data.currentTarget.id);
      var userId = data.currentTarget.id;
    });

    //adding friend
    $('#addFriend').on('click', function(){
      var username = $('#username').text();
      $('#noNotificationsLi').hide();
      $('#addFriend').attr("disabled", true);
      $('#addFriend').html('Invite Sended');
      socket.emit('addFriend', username);
    });

    $('.fa-globe').on('click', function(){
      $(this).attr('class', 'fa fa-globe');
    });

    //invite to friends
    socket.on('addFriendInviteNotification', function(data){
      var inviteFromUser = data.inviteFromUser;
      var notificationBox = $('#notificationsBox');

      notificationBox.prepend(`
        <div id="${inviteFromUser._id}" class="notificationShow">
          <div class="info-image">
            <i class="fa fa-info" aria-hidden="true"></i>
          </div>
          <div class="notification-text">
            U have invite to friends from ${inviteFromUser.firstName} ${inviteFromUser.lastName}!
          </div>
        </div>`);

        setTimeout(function(){
          $(`div[id^=${inviteFromUser._id}]`).remove();
        }, 5000);

      var globeNotification = $('.fa-globe');

      globeNotification.attr('class', 'fa fa-globe new-notification');

      var notificationsList = $('#notifications');
      notificationsList.prepend(`<li data-notification="${inviteFromUser._id}">
                                  <p>${inviteFromUser.firstName} ${inviteFromUser.lastName}</p> invited u to friends!
                                  <button id="acceptInvite" data-notification="${inviteFromUser._id}"><i class="fa fa-check" aria-hidden="true"></i></button>
                                  <button id="declineInvite" data-notification="${inviteFromUser._id}"><i class="fa fa-times" aria-hidden="true"></i></button>
                                </li>`);
      $('#noNotificationsLi').hide();

    });

    //accepted invite to friends notification
    socket.on('addedFriendNotification', function(data){
      var inviteFromUser = data.inviteFromUser;
      var posts = data.posts;
    });

    //accepting invite dynamic
    $('div').on('click','#acceptInvite', function(){
      var fromUser = $('#acceptInvite').data("notification");
      socket.emit('acceptedInvite', fromUser);
      $(`*[data-notification="${fromUser}"]`).hide();
      $('#acceptInvite').attr('disabled', true);
      $('#declineInvite').attr('disabled', true);
    });

    //Dodanie dynamicznie frienda do czat listy
    socket.on('addedFriendDynamic', function(data){
      var user = data.user;
      var userPosts = data.userPosts;
      var chatList = $('#friendsList');

      var globeNotification = $('.fa-globe');

      globeNotification.attr('class', 'fa fa-globe new-notification');

      var notificationsList = $('#notifications');
      notificationsList.prepend(`<li><p>${user.firstName} ${user.lastName}</p> is your new friend! </li>
                                 <li role="separator" class="divider"></li>`);

     var notificationBox = $('#notificationsBox');

     notificationBox.prepend(`
       <div id="${user._id}" class="notificationShow">
         <div class="info-image">
           <i class="fa fa-info" aria-hidden="true"></i>
         </div>
         <div class="notification-text">
           U have new friend!
         </div>
       </div>`);

       setTimeout(function(){
         $(`div[id^=${user._id}]`).remove();
       }, 5000);

       //posts
       var profilePosts = $('.profilePosts');
       var profileWall = $('.profile-wall');
       var addProfilePost = $('.addProfilePost');
       if(userPosts.length !== 0){
         $('#profilePost').hide();
         $('#noFriend').hide();

         userPosts.forEach((post, index) => {
           profilePosts.prepend(`
             <div class="profilePost">
               <div class="postAuthor">
                 <img src="https://cdn0.iconfinder.com/data/icons/iconshock_guys/512/andrew.png" >
                 <p>${post.author.firstName} ${post.author.lastName}</p>
               </div>
               <div class="profilePostText">
                 ${post.text}
               </div>
               <div class="profilePostOptions" id="profilePostOptions">
                 <i><button class="fa fa-heart" aria-hidden="true" id="likePost" value="${post._id}"> Like</button></i> |
                 <i><button class="fa fa-share" aria-hidden="true" id="sharePost" value="${post._id}"> Share it</button></i>
                 <i class="profilePostTime"> ${post.time} </i>
               </div>
             </div>
             `);
         });
       }
       else{
         $('#noFriend').html('<h1> No posts yet! Add some or add friends to see posts! ;)</h1>');
         $('#addFriend').hide();

       }
      chatList.append(`<li class="friendUsername" data-user="${user.username}">${user.firstName} ${user.lastName}</li>`);
    });

    //accepting invite no-dynamic
    $('#acceptInvite').on('click', function(){
      var fromUser = $('#acceptInvite').data("notification");
      socket.emit('acceptedInvite', fromUser);
      $(`*[data-notification="${fromUser}"]`).hide();
      $('#acceptInvite').attr('disabled', true);
      $('#declineInvite').attr('disabled', true);
    });

    //decline invite dynamic
    $('div').on('click','#declineInvite', function(){
      var fromUser = $('#acceptInvite').data("notification");
      console.log("Usuwamy invite od "+fromUser);
      socket.emit('declineInvite', fromUser);
      $(`*[data-notification="${fromUser}"]`).hide();
      $('#acceptInvite').attr('disabled', true);
      $('#declineInvite').attr('disabled', true);
    });

    //decline invite no-dynamic
    $('#declineInvite').on('click', function(){
      var fromUser = $('#acceptInvite').data("notification");
      console.log("Usuwamy invite od "+fromUser);
      socket.emit('declineInvite', fromUser);
      $(`*[data-notification="${fromUser}"]`).hide();
      $('#acceptInvite').attr('disabled', true);
      $('#declineInvite').attr('disabled', true);
    });

    //following friend
    $('#followFriend').on('click', function(){
      var usernameToFollow = $(this).data('user');
      var notificationBox = $('#notificationsBox');
      socket.emit('followFriend', usernameToFollow);
      if($(this).attr('class') === 'fa fa-heart followed'){
        $(this).attr('class', 'fa fa-heart follow');

        notificationBox.prepend(`
          <div id="${usernameToFollow}" class="notificationShow">
            <div class="info-image">
              <i class="fa fa-heart" aria-hidden="true"></i>
            </div>
            <div class="notification-text">
              U unfollowed ${usernameToFollow}!
            </div>
          </div>`);

          setTimeout(function(){
            $(`div[id^=${usernameToFollow}]`).remove();
          }, 3000);
      } else {
        $(this).attr('class', 'fa fa-heart followed');

        notificationBox.prepend(`
          <div id="${usernameToFollow}" class="notificationShow">
            <div class="info-image">
              <i class="fa fa-heart" aria-hidden="true"></i>
            </div>
            <div class="notification-text">
              U followed ${usernameToFollow}!
            </div>
          </div>`);

          setTimeout(function(){
            $(`div[id^=${usernameToFollow}]`).remove();
          }, 3000);
      }
    });

});
