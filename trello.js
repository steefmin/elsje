var Trello = require('node-trello')

var trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN)

var checkUserToken = function (bot, controller, userId, callback) {
  controller.storage.users.get(userId, function (err, userinfo) {
    if (!err) {
      if (userinfo.trellotoken) {
        callback(trellotoken)
      } else {
        bot.startPrivateConversation({user: userId}, function (err, convo) {
          convo.ask('Open de volgende link en geef mij de code terug: https://trello.com/1/connect?key=' + process.env.TRELLO_KEY + '&name=Elsje&response_type=token. Als je dat niet wilt, zeg \"Nee\"', function (response, convo) {
            if (response.text !== 'Nee' || response.text !== 'nee') {
              storeToken(bot, controller, userId, response.text, callback)
            }
          })
        })
      }
    }
  })
}

var storeToken = function (bot, controller, userId, token, callback) {
    controller.storage.users.get({user: userId}, function (err, userdata) {
      if (!err){
      userdata.trellotoken = token
        controller.storage.users.save(userdata, function (err, response) {
          if (!err){
            callback(userdata.trellotoken)
          }
        })
      }
    })
}
                               
var newTrelloCard = function (struct) {
  var taskStructure = struct.data
  var cardname = taskStructure.id + ': ' + taskStructure.task
  var newCard = {
    name: cardname,
    due: taskStructure.deadline,
    idList: struct.trelloNewCardsList
  }
  trello.post('/cards/', newCard, function (err, data) {
    if (err) {
      throw err
    }
    console.log(data)
  })
}

module.exports = {
  checkUserToken: checkToken,
  newTrelloCard: newTrelloCard
}
