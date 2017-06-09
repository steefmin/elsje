var os = require('os')

var formatUptime = function (seconds) {
  seconds = (seconds < 1) ? 1 : seconds
  var data = {
    'base': [1, 60, 60 * 60, 60 * 60 * 24],
    'singular': ['seconde', 'minuut', 'uur', 'dag'],
    'plural': ['seconden', 'minuten', 'uren', 'dagen']
  }
  var uptimes = data.base.filter(function (base) {
    return seconds >= base
  }).map(function (base, index) {
    var value = Math.round(seconds / base)
    var unit = (value === 1) ? data.singular[index] : data.plural[index]
    return value + ' ' + unit
  })
  return uptimes.pop()
}

var addSpaces = function (numberOfSpaces) {
  var spaces = ''
  for (var i = 0; i < numberOfSpaces; i++) {
    spaces += ' '
  }
  return spaces
}

var verifyChannelId = function (input) {
  var patern = /C.{8}/
  var channelid = patern.exec(input)
  if (channelid) {
    return channelid[0]
  } else {
    return false
  }
}

var getBotImg = function (bot, callback) {
  bot.api.users.info({'user': bot.identity.id}, function (err, reply) {
    if (!err) {
      callback(reply.user.profile.image_original)
    }
  })
}

var getTeamId = function (bot, callback) {
  bot.api.users.info({'user': bot.identity.id}, function (err, reply) {
    if (!err) {
      callback(reply.user.team_id)
    }
  })
}

var filterTasks = function (filterOn, tasks, filterFor) {
  if (filterFor === 'all') {
    return tasks
  } else {
    return tasks.filter(function (val) {
      return val[filterOn] === filterFor
    })
  }
}

var sortTasks = function (tasks, sortBy) {
  var sorted = tasks.sort(function (taska, taskb) {
    if (taska[sortBy] < taskb[sortBy]) {
      return 1
    }
    if (taska[sortBy] > taskb[sortBy]) {
      return -1
    }
    return 0
  })
  return sorted
}

var formatTasks = function (tasks) {
  var formatted = 'Takenlijst\n```'
  tasks.forEach(function (task, index, array) {
    var addtostring = ''
    if (task.status !== 'done') {
      addtostring =
        '<#' + task.channelid + '>' +
        addSpaces(2) +
        task.taskid +
        addSpaces(4 - task.taskid.toString().length) +
        '<@' + task.responsibleid + '>' +
        addSpaces(2) +
        task.deadline +
        addSpaces(2) +
        task.task +
        '\n'
      formatted += addtostring
    }
  })
  formatted += '```'
  return formatted
}

var postMessage = function (bot, message, channel) {
  postGeneral(bot, {'text': message}, channel)
}

var postAttachment = function (bot, attachmentArray, channel) {
  postGeneral(bot, {'attachments': attachmentArray}, channel)
}

var postGeneral = function (bot, something, channel) {
  getBotImg(bot, function (image) {
    var general = {
      'channel': channel,
      'username': bot.identity.name,
      'icon_url': image
    }
    Object.assign(general, something)
    bot.api.chat.postMessage(general)
  })
}

var postSingleTask = function (bot, taskStructure, message) {

}

var sendScore = function (bot, userId, score, channel) {
  var plural = Math.abs(score) > 1 || score === 0 ? 'en' : ''
  var smiley = getScoreSmiley(score)
  var attachment = [{
    'fallback': '<@' + userId + '> heeft nu ' + score + ' punt' + plural + ' ' + smiley,
    'text': ' <@' + userId + '> heeft nu ' + score + ' punt' + plural + ' ' + smiley
  }]
  attachment.color = score >= 0 ? 'good' : 'danger'
  postAttachment(bot, attachment, channel)
}

var getScoreSmiley = function (score) {
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

var shutdown = function (bot, message) {
  bot.startConversation(message, function (err, convo) {
    if (!err) {
      convo.ask('Are you sure you want me to shutdown?', [{
        pattern: bot.utterances.yes,
        callback: function (response, convo) {
          convo.say('Bye!')
          convo.next()
          setTimeout(function () {
            process.exit()
          }, 3000)
        }
      }, {
        'pattern': bot.utterances.no,
        'default': true,
        'callback': function (response, convo) {
          convo.say('*Phew!*')
          convo.next()
        }
      }])
    }
  })
}

var uptime = function (bot, message) {
  var hostname = os.hostname()
  var uptime = formatUptime(process.uptime())
  bot.reply(message, ':robot_face: Ik ben een bot genaamd <@' + bot.identity.name + '>. Ik draai al ' + uptime + ' op ' + hostname + '.')
}

module.exports = {
  'formatUptime': formatUptime,
  'addSpaces': addSpaces,
  'verifyChannelId': verifyChannelId,
  'verifyUserName': verifyUserName,
  'getBotImg': getBotImg,
  'getTeamId': getTeamId,
  'formatTasks': formatTasks,
  'sortTasks': sortTasks,
  'filterTasks': filterTasks,
  'postMessage': postMessage,
  'postAttachment': postAttachment,
  'postSingleTask': postSingleTask,
  'sendScore': sendScore,
  'shutdown': shutdown,
  'uptime': uptime
}
