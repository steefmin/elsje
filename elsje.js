require('./env.js')

var functions = require('./functions')
var api = require('./svlo-api')
var post = require('./post')
var newtask = require('./conversations/newtask')
var instant = require('./conversations/instant')
var completetask = require('./conversations/completetask')
var updatedeadline = require('./conversations/updatedeadline')
var tasklist = require('./conversations/tasklist')

var Botkit = require('botkit')
var Colormap = require('colormap')

if (!process.env.TOKEN) {
  console.log('Error: Specify token in environment')
  process.exit(1)
}

var debug = (process.argv[2] !== 'production')

var controller = Botkit.slackbot({
  'json_file_store': process.env.STORAGE_LOCATION,
  'debug': debug
})

var bot = controller.spawn({
  token: process.env.TOKEN,
  retry: Infinity
}).startRTM()

var reconnectcounter = 0
controller.on('rtm_open', post.reconnect(bot, reconnectcounter, debug, function (increasedCounter) {
  reconnectcounter = increasedCounter
}))

controller.hears(['shutdown'], 'direct_message,direct_mention,mention', functions.shutdown)

controller.hears(['ken ik jou', 'wie ben jij', 'hoe lang ben je al wakker', 'uptime', 'identify yourself', 'who are you', 'what is your name'], 'direct_message,direct_mention,mention', functions.uptime)

controller.hears(['instanttaak (.*)'], 'direct_message', instant.taak)

controller.hears(['nieuwe taak', 'voeg toe', 'taak (.*)voegen'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.createConversation(message, newtask.conversation)
})

controller.hears(['taak (.*)afronden', 'taak (.*)afvinken', 'ik ben klaar', 'taak (.*)gedaan'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.createConversation(message, completetask.conversation)
})

controller.hears(['update deadline (.*)', 'deadline (.*) veranderen', 'andere deadline (.*)'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.createConversation(message, updatedeadline.conversation)
})

controller.hears(['newherinneringen', 'sendreminder'], 'direct_message', function (bot, message) {
  post.reminders(function (team, tasks) {
    controller.storage.teams.save({'id': team, 'db': tasks, 'timestamp': new Date()})
  })
})

controller.hears(['takenlijst(.*)', 'testlist(.*)', 'lijst(.*)', 'list(.*)'], 'direct_message,direct_mention,mention', tasklist.conversation)

controller.hears(['cc:(.*)', 'cc: (.*)', 'cc (.*)'], 'ambient', function (bot, message) {
  var isChannel = functions.verifyChannelId(message.match[1])
  if (isChannel) {
    bot.api.team.info({}, function (err, response) {
      if (!err) {
        var send = 'Er is een <http://' + response.team.domain + '.slack.com/archives/' + message.channel + '/p' + message.ts.replace('.', '') + '|bericht> geplaatst in <#' + message.channel + '> wat jullie misschien ook interessant vinden.'
        functions.postMessage(bot, send, isChannel)
      }
    })
  }
})

controller.on('reaction_added', function (bot, message) {
  if (message.item_user !== message.user) {
    if (message.reaction === '+1') {
      api.changeScore(message.item_user, 1)
    }
    if (message.reaction === '-1') {
      api.changeScore(message.item_user, -1)
    }
  }
})

controller.on('reaction_removed', function (bot, message) {
  if (message.item_user !== message.user) {
    if (message.reaction === '+1') {
      api.changeScore(message.item_user, -1)
    }
    if (message.reaction === '-1') {
      api.changeScore(message.item_user, 1)
    }
  }
})

controller.hears(['(.*)\\+\\+', '(.*)\\-\\-'], 'ambient', function (bot, message) {
  var userId = functions.verifyUserName(message.match[1])
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
})

controller.hears(['check(.*)', 'score(.*)'], 'mention,direct_mention,direct_message', function (bot, message) {
  var userId = functions.verifyUserName(message.match[1])
  if (userId) {
    api.getSingleScore(userId, function (err, singleScore) {
      if (!err) {
        functions.sendScore(bot, userId, singleScore, message.channel)
      }
    })
  }
})

controller.hears(['leaderboard'], 'mention,direct_mention,direct_message', function (bot, message) {
  api.getScore(function (err, scoreboard) {
    if (!err) {
      var attachment = []
      scoreboard.forEach(function (value) {
        if (functions.verifyUserId(value.userid)) {
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
      functions.postAttachment(bot, attachment, message.channel)
    }
  })
})

module.exports = {'bot': bot}
