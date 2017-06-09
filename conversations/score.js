module.exports = function (bot) {
  var module = {}
  var api = require('./../svlo-api')
  var verify = require('./../verify')
  var post = require('./../post')(bot)

  var Colormap = require('colormap')

  module.reactionAdded = function (bot, message) {
    if (message.item_user !== message.user) {
      if (message.reaction === '+1' || message.reaction === '-1') {
        api.changeScore(message.item_user, parseInt(message.reaction, 10))
      }
    }
  }

  module.reactionRemoved = function (bot, message) {
    if (message.item_user !== message.user) {
      if (message.reaction === '+1' || message.reaction === '-1') {
        api.changeScore(message.item_user, -1 * parseInt(message.reaction, 10))
      }
    }
  }

  module.votes = function (bot, message) {
    var userId = verify.username(message.match[1])
    var input = message.match[0].replace(':', '').replace(' ', '')
    var modifier = input.substring(12, 14)
    if (userId && userId !== message.user) {
      if (modifier === '++') {
        api.changeScore(userId, 1)
      }
      if (modifier === '--') {
        api.changeScore(userId, -1)
      }
    }
  }

  module.check = function (bot, message) {
    var userId = verify.username(message.match[1])
    if (userId) {
      api.getSingleScore(userId, function (err, singleScore) {
        if (!err) {
          post.score(userId, singleScore, message.channel)
        }
      })
    }
  }

  module.leaderboard = function (bot, message) {
    api.getScore(function (err, scoreboard) {
      if (!err) {
        var attachment = []
        scoreboard.forEach(function (value) {
          if (verify.userid(value.userid)) {
            var item = {
              'text': '<@' + value.userid + '>: ' + value.score,
              'fallback': '<@' + value.userid + '>: ' + value.score,
              'score': value.score
            }
            attachment.push(item)
          }
        })
        attachment.sort(function (a, b) {
          return b.score - a.score
        })
        var lowScore = attachment[attachment.length - 1].score
        var options = {
          'colormap': 'jet',
          'nshades': Math.max(attachment[0].score - lowScore + 1, 6),
          'format': 'hex',
          'alpha': 1
        }
        var cg = Colormap(options)
        for (var i = 0; i < attachment.length; i++) {
          attachment[i].color = cg[attachment[i].score - lowScore]
        }
        post.attachment(attachment, message.channel)
      }
    })
  }

  return module
}
