var api = require('./../svlo-api')
var newtask = require('./newtask')
var verify = require('./../verify')

module.exports = function taak (bot, message) {
  var parts = message.match[1].split('|')
  if (parts.length !== 5) {
    bot.reply(message, 'Gebruik instanttaak als volgt: instanttaak taak | @naam | deadline | #kanaal')
  } else {
    var task = parts[0]
    var userId = message.user
    var responsibleId = verify.username(parts[1])
    var channelId = verify.channelname(parts[3])
    var deadline = verify.date(parts[2])
    if (channelId && responsibleId && deadline) {
      var taskStructure = {
        'channel': channelId,
        'userid': userId,
        'task': task,
        'responsibleid': responsibleId,
        'deadline': deadline
      }
      api.addTask(taskStructure, newtask.taskStoreResult)
    } else {
      bot.reply(message, 'Sorry, ik heb iets niet begrepen, probeer het nog een keer.')
    }
  }
}
