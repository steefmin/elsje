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
    attachment(attachment, process.env.RESTART_MESSAGE_CHANNEL)
    cb(reconnectcounter++)
  }
}

var attachment = function (attachmentArray, channel) {
  bot.say({
    'attachment': attachmentArray,
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
  attachment(attachmentArray, task.channelid)
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

var score = function (userId, score, channel) {
  var plural = Math.abs(score) > 1 || score === 0 ? 'en' : ''
  var smiley = getScoreSmiley(score)
  var attachmentArray = [{
    'fallback': '<@' + userId + '> heeft nu ' + score + ' punt' + plural + ' ' + smiley,
    'text': ' <@' + userId + '> heeft nu ' + score + ' punt' + plural + ' ' + smiley
  }]
  attachmentArray.color = score >= 0 ? 'good' : 'danger'
  attachment(attachmentArray, channel)
}

function getScoreSmiley (score) {
  var level = {
    high: 100,
    low: -20
  }
  var positiveSmileys = [
    ':slightly_smiling_face:',
    ':grinning:',
    ':dizzy_face:',
    ':the_horns:',
    ':heart_eyes:'
  ]
  var negativeSmileys = [
    ':slightly_frowning_face:',
    ':cry:',
    ':sob:',
    ':confounded:',
    ':scream:',
    ':ghost:'
  ]
  var relativeScore
  score = score > level.high ? level.high : score
  score = score < level.low ? level.low : score
  if (score > 0) {
    relativeScore = Math.round((positiveSmileys.length - 1) / (level.high) * (score - 1))
    return positiveSmileys[relativeScore]
  } else if (score < 0) {
    relativeScore = Math.round((negativeSmileys.length - 1) / (-level.low - 1) * (-score - 1))
    return negativeSmileys[relativeScore]
  } else {
    return ':no_mouth:'
  }
}

module.exports = {
  'reconnect': reconnect,
  'attachment': attachment,
  'message': message,
  'singleTask': singleTask,
  'tasklist': tasklist,
  'reminders': reminders,
  'ShowList': ShowList,
  'score': score
}
