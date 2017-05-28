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
            $('#searchResults').append(`<li id="${user._id}">${user.firstName} ${user.lastName}</li>`);
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


});
