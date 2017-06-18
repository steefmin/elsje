var ordinal = require('ordinal-numbers')
var os = require('os')
var Colormap = require('colormap')

var functions = require('./functions')
var api = require('./svlo-api')

var debug = (process.argv[2] !== 'production')

var reconnectcounter = 0

var restart = function (bot, message) {
  if (!debug) {
    var reconnecttext = 'Hi, this is a debug message: I '
    if (reconnectcounter === 0) {
      reconnecttext += 'just connected.'
    } else {
      reconnecttext += 'reconnected for the ' + ordinal(reconnectcounter) + ' time.'
    }
    reconnectcounter++
    var attachment = [{
      'fallback': reconnecttext,
      'color': 'danger',
      'text': reconnecttext
    }]
    postAttachment(bot, attachment, process.env.RESTART_MESSAGE_CHANNEL)
  }
}

var uptime = function (bot, message) {
  var hostname = os.hostname()
  var uptime = functions.formatUptime(process.uptime())
  bot.reply(message, ':robot_face: Ik ben een bot genaamd <@' + bot.identity.name + '>. Ik draai al ' + uptime + ' op ' + hostname + '.')
}

// function postSingleTask (bot, taskStructure, message) {
//   message.color = message.color || '#3090C7'
//   message.fallback = message.fallback || message.pretext
//   var status = taskStructure.status !== 1 ? 'new' : 'done'
//   var attachmentArray = [{
//     'fallback': message.fallback,
//     'color': message.color,
//     'pretext': message.pretext,
//     'fields':
//       [
//         ['Taak', taskStructure.task, false],
//         ['Verantwoordelijke', '<@' + taskStructure.responsibleid + '>', true],
//         ['Status', status, true],
//         ['Deadline', taskStructure.deadline, true],
//         ['Taaknummer', taskStructure.taskid, true]
//       ].map(function (obj) {
//         return {'title': obj[0], 'value': obj[1], 'short': obj[2]}
//       })
//   }]
//   postAttachment(bot, attachmentArray, taskStructure.channelid)
// }

// function postMessage (bot, message, channel) {
//   postGeneral(bot, {'text': message}, channel)
// }

function postAttachment (bot, attachmentArray, channel) {
  postGeneral(bot, {'attachments': attachmentArray}, channel)
}

function postGeneral (bot, something, channel) {
  var general = {
    'channel': channel
  }
  Object.assign(general, something)
  bot.say(general)
}

var checkscore = function (bot, message) {
  var userId = functions.verifyUserName(message.match[1])
  if (userId) {
    api.getSingleScore(userId, function (err, score) {
      if (!err) {
        sendScore(bot, userId, score, message.channel)
      }
    })
  }
}

function sendScore (bot, userId, score, channel) {
  var plural = Math.abs(score) > 1 || score === 0 ? 'en' : ''
  var smiley = functions.getScoreSmiley(score)
  var attachment = [{
    'fallback': '<@' + userId + '> heeft nu ' + score + ' punt' + plural,
    'text': ' <@' + userId + '> heeft nu ' + score + ' punt' + plural + ' ' + smiley
  }]
  attachment.color = score >= 0 ? 'good' : 'danger'
  postAttachment(bot, attachment, channel)
}

var leaderboard = function (bot, message) {
  api.getScore(function (err, scoreboard) {
    if (!err) {
      var activeuserlist = scoreboard.map(function (value) {
        if (functions.verifyUserId(value.userid)) {
          return {
            'text': '<@' + value.userid + '>: ' + value.score,
            'fallback': '<@' + value.userid + '>: ' + value.score,
            'score': value.score
          }
        } else {
          return false
        }
      }).sort(function (a, b) {
        return b.score - a.score
      })
      var lowScore = activeuserlist[activeuserlist.length - 1].score
      var options = {
        'colormap': 'jet',
        'nshades': Math.max(activeuserlist[0].score - lowScore + 1, 6),
        'format': 'hex',
        'alpha': 1
      }
      var cg = Colormap(options)
      var coloredlist = activeuserlist.map(function (entry) {
        entry.color = cg[entry.score - lowScore]
        return entry
      })
      postAttachment(bot, coloredlist, message.channel)
    }
  })
}

var scoreReactions = function (bot, message) {
  console.log(message)
  if (message.item_user !== message.user) {
    var score = 1
    if (message.reaction === '+1') {
      score = score * 1
    }
    if (message.reaction === '-1') {
      score = score * -1
    }
    if (true) {
      score = score * 1
    }
    if (false) {
      score = score * -1
    }
    api.changeScore(message.item_user, score)
  }
}

var scoreVotes = function (bot, message) {
  var userId = functions.verifyUserName(message.match[1])
  var modifier = message.match[0].replace(':', '').replace(' ', '').substring(12, 14)
  if (userId && userId !== message.user) {
    if (modifier === '++') {
      api.changeScore(userId, 1)
    }
    if (modifier === '--') {
      api.changeScore(userId, -1)
    }
  }
}

module.exports = {
  'restart': restart,
  'uptime': uptime,
  'checkscore': checkscore,
  'leaderboard': leaderboard,
  'scoreReactions': scoreReactions,
  'scoreVotes': scoreVotes
}
