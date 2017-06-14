/* jshint node: true, esversion: 6 */
/* globals $:false */

$(document).ready(function(){
  var socket = io();

  //Pisanie w chacie allFriendsChat
  $('div').on('keypress', '#allFriendsInput', function(e){
    var chatTable = $('.chatBoxArchive');
     if(e.which === 13){
       var text = $('#allFriendsInput').val();
       $('#allFriendsMessages').append(`<li><b>You:</b> ${text}</li>`);
       chatTable[0].scrollTop = chatTable[0].scrollHeight;
       socket.emit('allFriendsChatMessageSended', text);
       $('#allFriendsInput').val('');
     }
  });

  //Usunięcie czatu
  $('div').on('click','#messageFromAllFriendsRoom', function(){
    $('#messageFromAllFriends').remove();
  });
  //Usunięcie czatu od znajomego z allFriends
  $('div').on('click','#roomID', function(){
    $('#allFriendsChat').remove();
  });

  //Dodanie czatu allFriends
  $('#allFriends').on('click', function(){
    var chatBoxes = $('#chatBoxes');
    //Emitujemy że ktoś otworzył czat
    socket.emit('allFriendsChatOpen');
    var isAppended = $('#allFriendsChat');
    if(isAppended.length){
      console.log('Już otwarte');
    }else {
      chatBoxes.append(`<div class="chatBox" id="allFriendsChat">
                          <div class="chatBoxTitle" id="chatBoxTitle">
                            All friends
                            <button class="fa fa-times" aria-hidden="true" id="roomID"></button>
                          </div>
                          <div class="chatBoxArchive">
                            <ul id="allFriendsMessages">
                            </ul>
                          </div>
                          <div class="chatBoxSendText">
                            <input type="text" id="allFriendsInput" class="" placeholder="..." >
                          </div>
                        </div>`);
    }


      $('#allFriendsInput').focus();
  });

  //Zamkniecie prywatnego czatu
  $('div').on('click', '#privateChat', function(){
    var privateChatWith = $(this).data().user;
    $(`#${privateChatWith}`).remove();
  });

  //Otwarcie prywatnego czatu
  $('.friendsBox').on('click', '.friendUsername', function() {
    var privateChatWith = $(this).data().user;
    var chatBoxes = $('#chatBoxes');
    //Emitujemy że ktoś otworzył czat
    socket.emit('privateChatOpen', privateChatWith);
    var isAppended = $(`#${privateChatWith}`);
    if(isAppended.length){
      console.log('Już otwarte');
    }else {
      chatBoxes.append(`<div class="chatBox" id="${privateChatWith}">
                          <div class="chatBoxTitle" id="chatBoxTitle">
                            ${privateChatWith}
                            <button class="fa fa-times" aria-hidden="true" id="privateChat" data-user="${privateChatWith}"></button>
                          </div>
                          <div class="chatBoxArchive">
                            <ul id="messages${privateChatWith}">
                            </ul>
                          </div>
                          <div class="chatBoxSendText">
                            <input type="text" id="${privateChatWith}Input" data-user="${privateChatWith}" class="" placeholder="..." >
                          </div>
                        </div>`);
    }
    $(`#${privateChatWith}Input`).focus();
  });

  //Wysłanie wiadomości z prywatnego czatu
  $('div').on('keypress', 'input', function(e){
    var chatTable = $('.chatBoxArchive');
    if(e.which === 13){
      var whichInput = $(this).attr('id');
      var privateChatWith = $(this).attr('data-user');
      var text = $(`#${whichInput}`).val();
      $(`#messages${privateChatWith}`).append(`<li><b>You:</b> ${text}</li>`);
      chatTable[0].scrollTop = chatTable[0].scrollHeight;
      if(privateChatWith !== undefined){
          socket.emit('privateChatMessageSended', text, privateChatWith);
      }
      $(`#${whichInput}`).val('');
    }
  });

  //odbieranie wiadomości z prywatnego czatu
  socket.on('privateChatMessageSended', function(data){
    var message = data.message;
    var whoSendedFirstName = data.whoSendedFirstName;
    var whoSendedUsername = data.whoSendedUsername;

    var isAppended = $(`#${whoSendedUsername}`);
    var chatTable = $('.chatBoxArchive');
    var chatBoxes = $('#chatBoxes');

    if(isAppended.length){
      console.log('Już otwarte');
      $(`#messages${whoSendedUsername}`).append(`<li class="messageReciver"><b>${whoSendedFirstName}:</b> ${message}</li>`);
      chatTable[0].scrollTop = chatTable[0].scrollHeight;
    }else {
      chatBoxes.append(`<div class="chatBox" id="${whoSendedUsername}">
                          <div class="chatBoxTitle" id="chatBoxTitle">
                            ${whoSendedFirstName}
                            <button class="fa fa-times" aria-hidden="true" id="privateChat" data-user="${whoSendedUsername}"></button>
                          </div>
                          <div class="chatBoxArchive">
                            <ul id="messages${whoSendedUsername}">
                              <li class="messageReciver"><b>${whoSendedFirstName}:</b> ${message}</li>
                            </ul>
                          </div>
                          <div class="chatBoxSendText">
                            <input type="text" id="${whoSendedUsername}Input" data-user="${whoSendedUsername}" class="" placeholder="..." >
                          </div>
                        </div>`);
    }
  });


//END
});
