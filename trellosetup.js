var Trello = require('node-trello')
var functions = require('./functions')

var askTrelloBoard = function (response, convo) {
  convo.trello = new Trello(process.env.TRELLO_KEY, convo.trelloToken)
  convo.trello.get('/1/members/me/boards/open', function (err, data) {
    if (err) {
      throw err
    }
    // bouw array van boards en boardId's
    //var array = {
    //  name: boardname1
    //  text: boardname1
    //  value: boardId1
    //  type: 'button'
    //}  ... etc...
    convo.ask({
      attachments: [
        {
          title: 'Welk board?', 
          callback_id: 1,
          attachment_type: 'default',
          actions: //eerdere array
        }
      ]
    }, function (response, convo){
      convo.say('Ok')
      askSlackChannel(response, convo)
      convo.next()
    })
  })
}

var askSlackChannel = function (response, convo) {
  convo.ask('slack channel', function (response, convo) {
    var channelId = functions.verifyChannelName(response.text)
    if (channelId) {
      response.text = channelId
      linkBoardToChannel(response, convo)
      convo.next()
    }
  })
}

var linkBoardToChannel = function (response, convo) {
  convo.on('end', function (convo) {
    //link die shit en store 
  })
}

module.exports = {
  askBoard: askBoard
}
