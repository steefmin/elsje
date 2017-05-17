require('./env.js')
var functions = require('./functions')
var api = require('./svlo-api')
var Botkit = require('botkit')
var Colormap = require('colormap')
var ordinal = require('ordinal-numbers')
var os = require('os')

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
controller.on('rtm_open', function (bot, message) {
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
    functions.postAttachment(bot, attachment, process.env.RESTART_MESSAGE_CHANNEL)
  }
})

controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function (bot, message) {
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
        pattern: bot.utterances.no,
        default: true,
        callback: function (response, convo) {
          convo.say('*Phew!*')
          convo.next()
        }
      }])
    }
  })
})

controller.hears(['ken ik jou', 'wie ben jij', 'hoe lang ben je al wakker', 'uptime', 'identify yourself', 'who are you', 'what is your name'], 'direct_message,direct_mention,mention', function (bot, message) {
  var hostname = os.hostname()
  var uptime = functions.formatUptime(process.uptime())
  bot.reply(message, ':robot_face: Ik ben een bot genaamd <@' + bot.identity.name + '>. Ik draai al ' + uptime + ' op ' + hostname + '.')
})

controller.hears(['nieuwe taak', 'voeg toe', 'taak (.*)voegen'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.startConversation(message, voegTaakToe)
})

var voegTaakToe = function (response, convo) {
  convo.ask('Wat moet er gedaan worden?', function (response, convo) {
    convo.say('Ja, dat moet nodig gebeuren.')
    voorWie(response, convo)
    convo.next()
  })
}

var voorWie = function (reponse, convo) {
  convo.ask('Wie gaat dit doen? (@naam graag)', function (response, convo) {
    var userid
    if (response.text === 'ik') {
      console.log(response)
      userid = functions.verifyUserId(response.user)
    } else {
      userid = functions.verifyUserName(response.text)
    }
    if (userid) {
      response.text = userid
      convo.say('Ha, gesjaakt!')
      wanneerKlaar(response, convo)
      convo.next()
    }
  })
}

var wanneerKlaar = function (response, convo) {
  convo.ask('Wanneer moet het klaar zijn?', function (response, convo) {
    var date = functions.verifyDate(response.text)
    if (date) {
      response.text = date
      convo.say('Ik zal het onthouden.')
      if (convo.task.source_message.event === 'direct_message') {
        welkKanaal(response, convo)
        convo.next()
      } else {
        opslaanVanTaak(response, convo)
        convo.next()
      }
    }
  })
}

var welkKanaal = function (response, convo) {
  convo.ask('In welke lijst zal ik dit zetten?', function (response, convo) {
    var channelid = functions.verifyChannelName(response.text)
    if (channelid) {
      convo.say('Kijk in het kanaal voor de lijst.')
      opslaanVanTaak(response, convo)
      convo.next()
    }
  })
}

var opslaanVanTaak = function (response, convo) {
  convo.on('end', function (convo) {
    if (convo.status === 'completed') {
      var res = convo.extractResponses()
      var channelId = functions.verifyChannelName(res['In welke lijst zal ik dit zetten?'])
      if (!channelId) {
        channelId = response.channel
      }
      var userId = response.user
      var task = res['Wat moet er gedaan worden?']
      var responsibleId = res['Wie gaat dit doen? (@naam graag)']
      var deadline = res['Wanneer moet het klaar zijn?']
      var isStored = storeNewTask(userId, channelId, task, responsibleId, deadline)
      if (isStored) {
        bot.reply(response, 'Ok, taak toegevoegd aan de lijst.')
      } else {
        bot.reply(response, 'Sorry, ik heb iets niet begrepen, probeer het nog een keer.')
      }
    }
  })
}

controller.hears(['instanttaak (.*)'], 'direct_message', function (bot, message) {
  var parts = message.match[1].split('|')
  if (parts.length !== 5) {
    bot.reply(message, 'Gebruik instanttaak als volgt: instanttaak taak | @naam | deadline | #kanaal')
    return false
  }
  var task = parts[0]
  var userId = message.user
  var responsibleId = functions.verifyUserName(parts[1])
  var channelId = functions.verifyChannelName(parts[3])
  var deadline = functions.verifyDate(parts[2])
  if (channelId && responsibleId && deadline) {
    var isStored = storeNewTask(userId, channelId, task, responsibleId, deadline)
    if (isStored) {
      bot.reply(message, 'Ok, taak toegevoegd aan de lijst.')
    } else {
      bot.reply(message, 'Sorry, er is iets misgegaan bij het opslaan.')
    }
  } else {
    bot.reply(message, 'Sorry, ik heb iets niet begrepen, probeer het nog een keer.')
  }
})

var storeNewTask = function (userId, channelId, task, responsibleId, deadline) {
  var newTask = {
    'channel': channelId,
    'user': userId,
    'task': task,
    'responsibleid': responsibleId,
    'deadline': deadline
  }
  api.addTask(newTask, function (err, response) {
    if (err) {
      console.log(err)
    } else {
      newTask.taskid = response.body.taskid
      newTask.status = 0
      var message = {
        'fallback': 'Taak toegevoegd voor <@' + responsibleId + '>: ' + task,
        'pretext': 'Nieuwe taak aangemaakt.'
      }
      functions.postSingleTask(bot, newTask, message)
    }
  })
  return true
}

controller.hears(['taak (.*)afronden', 'taak (.*)afvinken', 'ik ben klaar', 'taak (.*)gedaan'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.startConversation(message, completeTask)
})

var completeTask = function (response, convo) {
  if (!isNaN(parseInt(convo.source_message.match[1], 10))) {
    finishtask(convo, parseInt(convo.source_message.match[1], 10))
  } else {
    var channel, send
    if (functions.verifyChannelId(convo.source_message.channel)) {
      channel = convo.source_message.channel
      send = channel
    } else {
      channel = 'all'
      send = convo.source_message.user
    }
    ShowList(channel, 'all', send)
    convo.ask('Kan je mij het nummer geven van de taak die van de lijst af mag?', function (response, convo) {
      if (!isNaN(parseInt(response.text, 10))) {
        convo.say('BAM, weer wat gedaan. Goed werk <@' + response.user + '>.\n')
        TaskDone(response, convo)
        convo.next()
      }
    })
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
  api.showAllTasks(function (error, res) {
    if (error) {
      console.log(error)
    } else {
      api.showSingleTask(taskNumber, function (err, task) {
        if (!err) {
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
  var channel, send
  if (functions.verifyChannelId(convo.source_message.channel)) {
    channel = convo.source_message.channel
    send = channel
  } else {
    channel = 'all'
    send = convo.source_message.user
  }
  ShowList(channel, 'all', send)
  convo.ask('Kan je mij het nummer geven van de taak waarvan je de deadline wilt wijzigen?', function (response, convo) {
    if (!isNaN(parseInt(response.text, 10))) {
      NewDeadline(response, convo)
      convo.next()
    }
  })
}

var NewDeadline = function (response, convo) {
  convo.ask('Wat is de nieuwe deadline?', function (response, convo) {
    var date = functions.verifyDate(response.text)
    if (date) {
      response.text = date
      convo.say('Ik zal het onthouden.')
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
      api.updateTask({taskid: taskid, deadline: deadline}, function (err, res) {
        if (err) {
          console.log(err)
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
}

controller.hears(['takenlijst(.*)', 'testlist(.*)', 'lijst(.*)'], 'direct_message,direct_mention,mention', function (bot, message) {
  var send
  var userid = functions.verifyUserName(message.match[1])
  var channelid = functions.verifyChannelName(message.match[1])
  if (functions.verifyChannelId(message.channel)) {
    send = message.channel
  } else {
    send = message.user
  }
  if (userid && channelid) {
    console.log('beide')
    ShowList(channelid, userid, send)
  } else {
    if (userid) {
      console.log('user')
      ShowList('all', userid, send)
      return true
    } else if (channelid) {
      console.log('channel')
      ShowList(channelid, 'all', send)
      return true
    } else if (functions.verifyChannelId(message.channel)) {
      console.log('none -> channel')
      ShowList(send, 'all', send)
    } else {
      console.log('none -> dm')
      ShowList('all', 'all', send)
    }
  }
})

var ShowList = function (channelName, userName, sendto) {
  api.showAllTasks(function (err, response) {
    if (err) {
      return false
    }
    var sortedtasks, formatted, userID, channelID
    var usertasks = functions.filterTasks('status', functions.filterTasks('channel', functions.filterTasks('responsible', response.body.tasks, userName), channelName), 'new')
    if (usertasks.length === 0) {
      console.log('empty tasks')
      return false
    }
    sortedtasks = functions.sortTasks(usertasks, 'channel')
    formatted = functions.formatTasks(sortedtasks)
    userID = functions.verifyUserId(sendto)
    if (userID) {
      sendTo(formatted, userID)
      console.log('sending to user')
    }
    channelID = functions.verifyChannelId(sendto)
    if (channelID) {
      sendTo(formatted, channelID)
      console.log('sending to channel')
    }
  })
}

var sendTo = function (formatted, sendToID) {
  if (functions.verifyUserId(sendToID)) {
    bot.api.im.open({'user': sendToID}, function (err, response) {
      if (!err) {
        functions.postMessage(bot, formatted, response.channel)
      }
    })
  } else if (functions.verifyChannelId(sendToID)) {
    functions.postMessage(bot, formatted, sendToID)
  } else {
    console.log('err, no valid sendToID')
    return false
  }
}

controller.hears(['cc:(.*)', 'cc: (.*)', 'cc (.*)'], 'ambient', function (bot, message) {
  var isChannel = functions.verifyChannelId(message.match[1])
  var originalChannel = message.channel
  var timestamp = message.ts
  if (isChannel) {
    bot.api.team.info({}, function (err, response) {
      if (!err) {
        var domain = response.team.domain
        bot.api.channels.info({'channel': originalChannel}, function (err, response) {
          if (!err) {
            var channelName = response.channel.name
            var send = 'Er is een <http://' + domain + '.slack.com/archives/' + channelName + '/p' + timestamp.replace('.', '') + '|bericht> geplaatst in <#' + message.channel + '> wat jullie misschien ook interessant vinden.'
            functions.postMessage(bot, send, isChannel)
          }
        })
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
      api.changeScore(userId, -1)
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
        if (functions.verifyUserId(value.id)) {
          var item = {
            'text': '<@' + value.id + '>: ' + value.score,
            'fallback': '<@' + value.id + '>: ' + value.score,
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
        'nshades': attachment[0].score - lowScore + 1 || 1,
        'format': 'hex',
        'alpha': 1
      }
      var cg = Colormap(options)
      console.log(cg)
      for (var i = 0; i < attachment.length; i++) {
        attachment[i].color = cg[attachment[i].score - lowScore]
      }
      functions.postAttachment(bot, attachment, message.channel)
    }
  })
})
