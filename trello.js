var Trello = require('node-trello')

var trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN)

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
  newTrelloCard: newTrelloCard
}
