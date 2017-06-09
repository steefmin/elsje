var ordinal = require('ordinal-numbers')
var bot = require('./elsje')

var reconnect = function (bot, reconnectcounter, debug, cb) {
  if (!debug) {
    var reconnecttext = 'Hi, this is a debug message: I '
    if (reconnectcounter === 0) {
      reconnecttext += 'just connected.'
    } else {
      reconnecttext += 'reconnected for the ' + ordinal(reconnectcounter) + ' time.'
    }
    var attachment = [{
      'fallback': reconnecttext,
      'color': 'danger',
      'text': reconnecttext
    }]
    attachment(bot, attachment, process.env.RESTART_MESSAGE_CHANNEL)
    cb(reconnectcounter++)
  }
}

var attachment = function (attachmentArray, channel, optionaltext) {
  bot.say({
    'attachment': attachmentArray,
    'text': optionaltext,
    'channel': channel
  })
}

var message = function (message, channel) {
  bot.say({
    'text': message,
    'channel': channel
  })
}

var singleTask = function (task, message) {
  message.color = message.color || '#3090C7'
  message.fallback = message.fallback || message.pretext
  var status = task.status !== 1 ? 'new' : 'done'
  var attachmentArray = [{
    'fallback': message.fallback,
    'color': message.color,
    'pretext': message.pretext,
    'fields':
      [
        ['Taak', task.task, false],
        ['Verantwoordelijke', '<@' + task.responsibleid + '>', true],
        ['Status', status, true],
        ['Deadline', task.deadline, true],
        ['Taaknummer', task.taskid, true]
      ].map(function (obj) {
        return {'title': obj[0], 'value': obj[1], 'short': obj[2]}
      })
  }]
  attachment(bot, attachmentArray, task.channelid)
}

module.exports = {
  'reconnect': reconnect, // done
  'attachment': attachment, // done
  'message': message, // done
  'singleTask': singleTask // done
}
