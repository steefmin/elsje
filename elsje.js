require('./env.js')
var functions = require('./functions')
var api = require('./svlo-api')
var post = require('./post')
var newtask = require('./converstations/newtask')
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
})

controller.hears(['shutdown'], 'direct_message,direct_mention,mention', functions.shutdown(bot, message))

controller.hears(['ken ik jou', 'wie ben jij', 'hoe lang ben je al wakker', 'uptime', 'identify yourself', 'who are you', 'what is your name'], 'direct_message,direct_mention,mention', functions.uptime(bot, message))

controller.hears(['nieuwe taak', 'voeg toe', 'taak (.*)voegen'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.createConversation(message, newtask.conversation)
})

controller.hears(['instanttaak (.*)'], 'direct_message', function (bot, message) {
  var parts = message.match[1].split('|')
  if (parts.length !== 5) {
    bot.reply(message, 'Gebruik instanttaak als volgt: instanttaak taak | @naam | deadline | #kanaal')
  } else {
    var task = parts[0]
    var userId = message.user
    var responsibleId = functions.verifyUserName(parts[1])
    var channelId = functions.verifyChannelName(parts[3])
    var deadline = functions.verifyDate(parts[2])
    if (channelId && responsibleId && deadline) {
      var taskStructure = {
        'channel': channelId,
        'userid': userId,
        'task': task,
        'responsibleid': responsibleId,
        'deadline': deadline
      }
      api.addTask(taskStructure, taskStoreResult)
    } else {
      bot.reply(message, 'Sorry, ik heb iets niet begrepen, probeer het nog een keer.')
    }
  }
})



controller.hears(['taak (.*)afronden', 'taak (.*)afvinken', 'ik ben klaar', 'taak (.*)gedaan'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.startConversation(message, completeTask)
})

var completeTask = function (response, convo) {
  if (!isNaN(parseInt(convo.source_message.match[1], 10))) {
    finishtask(convo, parseInt(convo.source_message.match[1], 10))
  } else {
    showListGetNum(response, convo, TaskDone)
  }
}

var TaskDone = function (response, convo) {
  convo.on('end', function (convo) {
    if (convo.status === 'completed') {
      var res = convo.extractResponses()
      var number = parseInt(res['Kan je mij het nummer geven van de taak die van de lijst af mag?'], 10)
      finishtask(convo, number)
    }
  })
}

var finishtask = function (convo, taskNumber) {
  var userId = convo.source_message.user
  api.showSingleTask(taskNumber, function (err, task) {
    if (err) {
      functions.postMessage(bot, 'Er is iets misggegaan bij het weergeven van de taak', convo.source_message.channel)
    } else {
      api.completeTask(taskNumber, function (error) {
        if (error) {
          functions.postMessage(bot, 'Er is iets misgegaan bij het bijwerken van de taak.', convo.source_message.channel)
        } else {
          task.status = 1
          var message = {
            'fallback': 'Taak van <@' + task.responsibleid + '> door <@' + userId + '> afgerond: ' + task.task,
            'color': 'good',
            'pretext': 'Taak afgerond door <@' + userId + '>.'
          }
          functions.postSingleTask(bot, task, message)
        }
      })
    }
  })
  convo.stop()
}

controller.hears(['update deadline', 'deadline veranderen', 'andere deadline'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.startConversation(message, DeadlineNumber)
})

var DeadlineNumber = function (response, convo) {
  showListGetNum(response, convo, NewDeadline)
}

var showListGetNum = function (response, convo, cb) {
  var channel, send
  if (functions.verifyChannelId(convo.source_message.channel)) {
    channel = convo.source_message.channel
    send = channel
  } else {
    channel = 'all'
    send = convo.source_message.user
  }
  ShowList(channel, 'all', send)
  convo.ask('Kan je mij het nummer geven van de taak?', function (response, convo) {
    if (!isNaN(parseInt(response.text, 10))) {
      cb(response, convo)
      convo.next()
    }
  })
}

var NewDeadline = function (response, convo) {
  convo.ask('Wat is de nieuwe deadline?', function (response, convo) {
    var date = functions.verifyDate(response.text)
    if (date) {
      response.text = date
  //    convo.say('Ik zal het onthouden.')
      UpdateDeadline(response, convo)
      convo.next()
    }
  })
}

var UpdateDeadline = function (response, convo) {
  convo.on('end', function (convo) {
    if (convo.status === 'completed') {
      var res = convo.extractResponses()
      var taskid = parseInt(res['Kan je mij het nummer geven van de taak waarvan je de deadline wilt wijzigen?'], 10)
      var deadline = res['Wat is de nieuwe deadline?']
      api.updateTask({taskid: taskid, deadline: deadline}, function (err) {
        if (err) {
          functions.postMessage(bot, 'Er is iets misgegaan bij het bijwerken van de taak.', convo.source_message.channel)
        } else {
          api.showSingleTask(taskid, function (err, task) {
            if (!err) {
              var message = {
                'fallback': 'Taak van <@' + task.responsibleid + '> heeft nieuwe deadline: ' + task.deadline,
                'pretext': 'Deze taak heeft een nieuwe deadline.'
              }
              functions.postSingleTask(bot, task, message)
              bot.reply(response, 'Ok, nieuwe deadline genoteerd.')
            }
          })
        }
      })
    }
  })
}

controller.hears(['newherinneringen', 'sendreminder'], 'direct_message', function (bot, message) {
  NewSendReminders()
})

var NewSendReminders = function () {
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
      functions.getTeamId(function (team) {
        controller.storage.teams.save({'id': team, 'db': tasks, 'timestamp': new Date()})
      })
    }
  })
}

controller.hears(['takenlijst(.*)', 'testlist(.*)', 'lijst(.*)', 'list(.*)'], 'direct_message,direct_mention,mention', function (bot, message) {
  var send
  var userid = functions.verifyUserName(message.match[1])
  var channelid = functions.verifyChannelName(message.match[1])
  if (functions.verifyChannelId(message.channel)) {
    send = message.channel
  } else {
    send = message.user
  }
  if (userid && channelid) {
    ShowList(channelid, userid, send)
  } else {
    if (userid) {
      ShowList('all', userid, send)
      return true
    } else if (channelid) {
      ShowList(channelid, 'all', send)
      return true
    } else if (functions.verifyChannelId(message.channel)) {
      ShowList(send, 'all', send)
    } else {
      ShowList('all', 'all', send)
    }
  }
})

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
    userID = functions.verifyUserId(sendto)
    if (userID) {
      sendTo(formatted, userID)
    }
    channelID = functions.verifyChannelId(sendto)
    if (channelID) {
      sendTo(formatted, channelID)
    }
  })
}

var sendTo = function (formatted, sendToID) {
  if (functions.verifyUserId(sendToID)) {
    bot.api.im.open({'user': sendToID}, function (err, response) {
      if (!err) {
        functions.postMessage(bot, formatted, response.channel.id)
      }
    })
  } else if (functions.verifyChannelId(sendToID)) {
    functions.postMessage(bot, formatted, sendToID)
  } else {
    return false
  }
}

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
