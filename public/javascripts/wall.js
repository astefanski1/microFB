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
              <i class="fa fa-share" aria-hidden="true"> Share it</i>
              <i class="profilePostTime"> ${time} </i>
            </div>
          </div>
          `);
      });
    }else {
      //Jeśli dodajemy z profilowego
      socket.emit('addPostOnProfile', $('#postTextArea').val(), profileUsername);
      $('#postTextArea').val('');

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
              <i class="fa fa-share" aria-hidden="true"> Share it</i>
              <i class="profilePostTime"> ${time} </i>
            </div>
          </div>
          `);
      });

    }
  });

  //Liking post
  $(".profilePosts").on('click','.fa-heart', function(){
    var postID = $(this).val();
    console.log(postID);
    socket.emit('postLike', postID);
    if($(this).attr('class') === 'fa fa-heart liked'){
      $(this).attr('class', 'fa fa-heart');
    }else {
      $(this).attr('class', 'fa fa-heart liked');
    }
  });

  //Sharing post
  $('.profilePosts').on('click', '.fa-share', function(){
    var postID = $(this).val();
    console.log(postID);
  });

});
