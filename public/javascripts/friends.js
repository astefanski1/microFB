/* jshint node: true, esversion: 6 */
/* globals $:false */

$(document).ready(function() {

  var socket = io();

  //searchBox input showing users
  $('#searchBox').on('keydown', function() {
    console.log('Szukam znajomych');
    var text = $('#searchBox').val();
    console.log(text);
    var data = {};
    $.ajax({
      type: 'GET',
      contentType: 'application/json',
      url: '/searchFriends/' + text,
      success: function(data)
      {
        console.log(data);
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
      socket.emit('addFriend', username);
    });

    //invite to friends
    socket.on('addFriendInviteNotification', function(data){
      var inviteFromUser = data.inviteFromUser;

      var notificationsList = $('#notifications');
      notificationsList.prepend(`<li>
                                  <p>${inviteFromUser.firstName} ${inviteFromUser.lastName}</p> invited u to friends!
                                  <button id="acceptInvite" value="${inviteFromUser._id}"><i class="fa fa-check" aria-hidden="true"></i></button>
                                  <button id="declineInvite" value="${inviteFromUser._id}"><i class="fa fa-times" aria-hidden="true"></i></button>
                                </li>`);
      $('#noNotificationsLi').hide();
    });

    //accepted invite to friends notification
    socket.on('addFriend', function(data){
      var inviteFromUser = data.inviteFromUser;

      var notificationsList = $('#notifications');
      notificationsList.prepend(`<li><p>${inviteFromUser.firstName}</p> accepted u invite to friends </li>
                                 <li role="separator" class="divider"></li>`);
    });

    //accepting invite dynamic
    $('div').on('click','#acceptInvite', function(){
      var firstName = $('#acceptInvite').attr("value");
      socket.emit('acceptedInvite', firstName);
      $('#acceptInvite').attr('disabled', true);
      $('#declineInvite').attr('disabled', true);
    });

    //accepting invite no-dynamic
    $('#acceptInvite').on('click', function(){
      var firstName = $('#acceptInvite').attr("value");
      socket.emit('acceptedInvite', firstName);
      $('#acceptInvite').attr('disabled', true);
      $('#declineInvite').attr('disabled', true);
    });

    //decline invite dynamic
    $('div').on('click','#declineInvite', function(){
      var firstName = $('#declineInvite').attr("value");
      console.log("Usuwamy invite od "+firstName);
      socket.emit('declineInvite', firstName);
      $('#acceptInvite').attr('disabled', true);
      $('#declineInvite').attr('disabled', true);
    });

    //decline invite no-dynamic
    $('#declineInvite').on('click', function(){
      var firstName = $('#declineInvite').attr("value");
      console.log("Usuwamy invite od "+firstName);
      socket.emit('declineInvite', firstName);
      $('#acceptInvite').attr('disabled', true);
      $('#declineInvite').attr('disabled', true);
    });

});
