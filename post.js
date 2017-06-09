var ordinal = require('ordinal-numbers')
var bot = require('./elsje')
var verify = require('./verify')
var functions = require('./functions')
var api = require('./svlo-api')

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

var tasklist = function (response, convo) {
  var channel, send
  if (verify.channelid(convo.source_message.channel)) {
    channel = convo.source_message.channel
    send = channel
  } else {
    channel = 'all'
    send = convo.source_message.user
  }
  ShowList(channel, 'all', send)
}

var ShowList = function (channelName, userName, sendto) {
  api.showAllTasks(function (err, tasks) {
    if (err) {
      return false
    }
    var sortedtasks, formatted, userID, channelID
    var usertasks = functions.filterTasks('channelid', functions.filterTasks('responsibleid', tasks, userName), channelName)
    if (usertasks.length === 0) {
      return false
    }
    sortedtasks = functions.sortTasks(usertasks, 'channelid')
    formatted = functions.formatTasks(sortedtasks)
    userID = verify.userid(sendto)
    if (userID) {
      sendList(formatted, userID)
    }
    channelID = verify.channelid(sendto)
    if (channelID) {
      sendList(formatted, channelID)
    }
  })
}

function sendList (formatted, sendToID) {
  if (verify.userid(sendToID)) {
    bot.api.im.open({'user': sendToID}, function (err, dm) {
      if (!err) {
        message(formatted, dm.channel.id)
      }
    })
  } else if (verify.channelid(sendToID)) {
    message(formatted, sendToID)
  } else {
    return false
  }
}

var reminders = function (backupcallback) {
  bot.api.users.list({}, function (err, reply) {
    if (!err) {
      reply.members.forEach(function (value, index, array) {
        if (value.deleted === false && value.is_bot === false) {
          ShowList('all', value.id, value.id)
        }
      })
    }
  })
  api.showAllTasks(function (err, tasks) {
    if (!err) {
      functions.getTeamId(bot, function (team) {
        backupcallback(team, tasks)
      })
    }
  })
}

module.exports = {
  'reconnect': reconnect, // done
  'attachment': attachment, // done
  'message': message, // done
  'singleTask': singleTask, // done
  'tasklist': tasklist, // done
  'reminders': reminders, // done
  'ShowList': ShowList // done
}
