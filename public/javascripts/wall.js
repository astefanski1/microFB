/* jshint node: true, esversion: 6 */
/* globals $:false */

$(document).ready(function(){

  var socket = io();

  $('#addPost').click(function(){
    var profileUsername = $(this).data().user;

    //Czy dodajemy z profilowego?
    //Jesli nie
    if(profileUsername === undefined){
      socket.emit('addPost', $('#postTextArea').val());
      $('#postTextArea').val('');
    }else {
      //Jeśli dodajemy z profilowego
      socket.emit('addPostOnProfile', $('#postTextArea').val(), profileUsername);
      $('#postTextArea').val('');
    }
  });

  //listening adding post
  socket.on('addPost', function(data){
    var wall = $('.profilePosts');
    var user = data.user;
    var text = data.text;
    var time = data.time;
    var postID = data.postID;

    $('#profilePost').hide();

    wall.prepend(`
      <div class="profilePost">
        <div class="postAuthor">
          <img src="https://cdn0.iconfinder.com/data/icons/iconshock_guys/512/andrew.png" >
          <p>${user.firstName} ${user.lastName}</p>
        </div>
        <div class="profilePostText">
          ${text}
        </div>
        <div class="profilePostOptions" id="profilePostOptions">
          <i><button class="fa fa-heart" aria-hidden="true" id="likePost" value="${postID}"> Like</button></i> |
          <i><button class="fa fa-share" aria-hidden="true" id="sharePost" value="${postID}"> Share it</button></i>
          <i class="profilePostTime"> ${time} </i>
        </div>
      </div>
      `);
  });

  //listening adding post on friend profile
  socket.on('addPostOnProfile', function(data){
    var wall = $('.profilePosts');
    var user = data.user;
    var text = data.text;
    var time = data.time;

    var postID = data.postID;

    $('#profilePost').hide();

    wall.prepend(`
      <div class="profilePost">
        <div class="postAuthor">
          <img src="https://cdn0.iconfinder.com/data/icons/iconshock_guys/512/andrew.png" >
          <p>${user.firstName} ${user.lastName}</p>
        </div>
        <div class="profilePostText">
          ${text}
        </div>
        <div class="profilePostOptions" id="profilePostOptions">
          <i><button class="fa fa-heart" aria-hidden="true" id="likePost" value="${postID}"> Like</button></i> |
          <i><button class="fa fa-share" aria-hidden="true" id="sharePost" value="${postID}"> Share it</button></i>
          <i class="profilePostTime"> ${time} </i>
        </div>
      </div>
      `);
  });

  //Liking post
  $(".profilePosts").on('click','.fa-heart', function(){
    var postID = $(this).val();
    var notificationBox = $('#notificationsBox');
    console.log(postID);
    socket.emit('postLike', postID);
    if($(this).attr('class') === 'fa fa-heart liked'){
      $(this).attr('class', 'fa fa-heart');

      notificationBox.prepend(`
        <div id="${postID}" class="notificationShow">
          <div class="info-image">
            <i class="fa fa-heart" aria-hidden="true"></i>
          </div>
          <div class="notification-text">
            U just unliked post!
          </div>
        </div>`);

        setTimeout(function(){
          $(`div[id^=${postID}]`).remove();
        }, 2000);


    }else {
      $(this).attr('class', 'fa fa-heart liked');

      notificationBox.prepend(`
        <div id="${postID}" class="notificationShow">
          <div class="info-image">
            <i class="fa fa-heart" aria-hidden="true"></i>
          </div>
          <div class="notification-text">
            U just liked post!
          </div>
        </div>`);

        setTimeout(function(){
          $(`div[id^=${postID}]`).remove();
        }, 2000);
    }
  });

  //Sharing post
  $('.profilePosts').on('click', '.fa-share', function(){
    var postID = $(this).val();
    socket.emit('postShare', postID);

    var notificationBox = $('#notificationsBox');

    notificationBox.prepend(`
      <div id="${postID}" class="notificationShow">
        <div class="info-image">
          <i class="fa fa-info" aria-hidden="true"></i>
        </div>
        <div class="notification-text">
          U just shared post!
        </div>
      </div>`);

      setTimeout(function(){
        $(`div[id^=${postID}]`).remove();
      }, 4000);
  });

  socket.on('postShare', function(data){
    var userReq = data.user;
    var sharedPost = data.sharedPost;
    var time = data.time;
    var author = data.author;
    var postID = data.postID;
    var wall = $('.profilePosts');

    wall.prepend(`
      <div class="profilePost isShared">
        <div class="postAuthor">
          <img src="https://cdn0.iconfinder.com/data/icons/iconshock_guys/512/andrew.png" >
          <p>${userReq.firstName} ${userReq.lastName} > ${author.firstName} ${author.lastName}</p>
        </div>
        <div class="profilePostText">
          ${sharedPost.text}
        </div>
        <div class="profilePostOptions" id="profilePostOptions">
          <i><button class="fa fa-heart" aria-hidden="true" id="likePost" value="${sharedPost._id}"> Like</button></i> |
          <i><button class="fa fa-share" aria-hidden="true" id="sharePost" value="${postID}"> Share it</button></i>
          <i class="profilePostTime"> ${time} </i>
        </div>
      </div>
      `);
  });

});
