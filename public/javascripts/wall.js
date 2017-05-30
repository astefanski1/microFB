/* jshint node: true, esversion: 6 */
/* globals $:false */

$(document).ready(function(){

  var socket = io();

  $('#addPost').click(function(){
    socket.emit('addPost', $('#postTextArea').val());
    $('#postTextArea').val('');

    socket.on('addPost', function(data){
      var wall = $('.profilePosts');
      var user = data.user;
      var text = data.text;
      var time = data.time;

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
          <div class="profilePostOptions">
            <i class="fa fa-heart" aria-hidden="true"> Like</i> |
            <i class="fa fa-share" aria-hidden="true"> Share it</i>
            <i class="profilePostTime"> ${time} </i>
          </div>
        </div>
        `);
    });
  });

  $(".profilePosts").on('click','.fa-heart', function(){
    console.log($(this).val());
  });



});
