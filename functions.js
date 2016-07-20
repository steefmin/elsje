var formatUptime = function (uptime) {
  var unit = 'seconde'
  var days
  if (uptime >= 1.5) {
    unit = unit + 'n'
  }
  if (uptime > 60) {
    uptime = uptime / 60
    unit = 'minuut'
    if (uptime >= 1.5) {
      unit = 'minuten'
    }
    if (uptime > 60) {
      uptime = uptime / 60
      unit = 'uur'
      if (uptime > 24) {
        days = uptime / 24
        unit = 'dag'
        if (uptime >= 1.5) {
          unit = unit + 'en'
        }
      }
    }
  }
  if (days) {
    uptime = Math.floor(days) + ' ' + unit + ' en ' + Math.round(uptime - Math.floor(days) * 24) + ' uur'
  } else {
    uptime = Math.round(uptime) + ' ' + unit
  }
  return uptime
}

var verifyDate = function (text) {
  var date = new Date()
  var currentDate = date
  if (regexp(/vandaag\s*/i, text)) {
  } else if (regexp(/morgen\s*/i, text)) {
    date.setDate(date.getDate() + 1)
  } else if (regexp(/week\s*/i, text)) {
    date.setDate(date.getDate() + 7)
  } else if (regexp(/maand\s*/i, text)) {
    date.setDate(date.getDate() + 30)
  } else {
    date = parseDate(text)
  }
  if (date !== 'Invalid Date' && date.getTime() >= currentDate.getTime()) {
    return date
  } else {
    return false
  }
}

var parseDate = function (text) {
  text = text.replace(/-/g, '/')
  var split = text.split('/')
  if (typeof split[1] !== 'undefined' && typeof split[2] !== 'undefined') {
    text = split[1] + '/' + split[0] + '/' + split[2]
  }
  text = text.replace('maa', 'mar')
  text = text.replace('mei', 'may')
  text = text.replace('okt', 'oct')
  var date = new Date(Date.parse(text))
  date.setDate(date.getDate() + 1)
  return date
}

var addSpaces = function (numberOfSpaces) {
  var spaces = ''
  for (var i = 0; i < numberOfSpaces; i++) {
    spaces += ' '
  }
  return spaces
}

var verifyUserName = function (input) {
  var patern = /<@.{9}>/
  var userid = patern.exec(input)
  if (userid) {
    userid = userid[0].substr(2, 9)
  }
  return userid
}

var verifyChannelName = function (input) {
  var patern = /<#.{9}>/
  var channelid = patern.exec(input)
  if (channelid) {
    channelid = channelid[0].substr(2, 9)
  }
  return channelid
}

var verifyUserId = function (input) {
  var patern = /U.{8}/
  var userid = patern.exec(input)
  if (userid) {
    return userid[0]
  } else {
    return false
  }
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

var regexp = function (patern, string) {
  if (patern.exec(string)) {
    return true
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
  var newtasks
  if (filterFor === 'all') {
    return tasks
  } else {
    newtasks = []
    if (filterOn === 'channel' || filterOn ===	'responsible') {
      tasks.forEach(function (value, index, array) {
        if (value[filterOn].id === filterFor) {
          newtasks.push(value)
        }
        return newtasks
      })
      return newtasks
    } else {
      tasks.forEach(function (value, index, array) {
        if (value[filterOn] === filterFor) {
          newtasks.push(value)
        }
        return newtasks
      })
      return newtasks
    }
  }
}

var sortTasks = function (tasks, sortBy) {
  var sorted = tasks.sort(function (taska, taskb) {
    if (taska[sortBy].id < taskb[sortBy].id) {
      return 1
    }
    if (taska[sortBy].id > taskb[sortBy].id) {
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
    var deadline = new Date(task.deadline)
    if (task.status !== 'done') {
      addtostring =
        '<#' + task.channel.id + '>' +
        addSpaces(2) +
        task.taskid +
        addSpaces(4 - task.taskid.toString().length) +
        '<@' + task.responsible.id + '>' +
        addSpaces(2) +
        deadline.toUTCString().substr(5, 11) +
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
  getBotImg(bot, function (image) {
    bot.api.chat.postMessage({
      'channel': channel,
      'text': message,
      'username': bot.identity.name,
      'icon_url': image
    })
  })
}

var postAttachment = function (bot, attachmentArray, channel) {
  getBotImg(bot, function (image) {
    bot.api.chat.postMessage({
      'channel': channel,
      'attachments': attachmentArray,
      'username': bot.identity.name,
      'icon_url': image
    })
  })
}

var postSingleTask = function (bot, taskStructure, message) {
  console.log(taskStructure)
  if (typeof message.color === 'undefined') {
    message.color = '#3090C7'
  }
  if (typeof message.fallback === 'undefined') {
    message.fallback = message.pretext
  }
  var deadline = new Date(taskStructure.deadline)
  var attachmentArray = [{
    'fallback': message.fallback,
    'color': message.color,
    'pretext': message.pretext,
    'fields': [
      {
        'title': 'Taak',
        'value': taskStructure.task,
        'short': false
      },
      {
        'title': 'Verantwoordelijke',
        'value': '<@' + taskStructure.responsible.id + '>',
        'short': true
      },
      {
        'title': 'Status',
        'value': taskStructure.status,
        'short': true
      },
      {
        'title': 'Deadline',
        'value': deadline.toUTCString().substr(5, 11),
        'short': true
      },
      {
        'title': 'Taaknummer',
        'value': taskStructure.taskid,
        'short': true
      }
    ]
  }]
  postAttachment(bot, attachmentArray, taskStructure.channel.id)
}

var changeScore = function (bot, controller, userId, change, channel) {
  controller.storage.users.get(userId, function (err, user) {
    if (!err) {
      if (!user || !user.score) {
        user = {'id': userId, 'name': '', 'score': 0}
      }
      user.score = user.score + change
      controller.storage.users.save(user, function (err, id) {
        if (!err) {
          var attachment = {
            'fallback': '<@' + userId + '> heeft ' + user.score + 'punten.',
            'text': '<@' + userId + '> heeft ' + user.score + 'punten.'
          }
          if (user.score > 0) {
            attachment.color = 'good'
          }
          if (user.score < 0) {
            attachment.color = 'danger'
          }
          postAttachment(bot, attachment, channel)
        }
      })
    }
  })
}

module.exports = {
  formatUptime: formatUptime,
  verifyDate: verifyDate,
  addSpaces: addSpaces,
  verifyUserId: verifyUserId,
  verifyChannelId: verifyChannelId,
  verifyUserName: verifyUserName,
  verifyChannelName: verifyChannelName,
  getBotImg: getBotImg,
  getTeamId: getTeamId,
  formatTasks: formatTasks,
  sortTasks: sortTasks,
  filterTasks: filterTasks,
  postMessage: postMessage,
  postAttachment: postAttachment,
  postSingleTask: postSingleTask,
  changeScore: changeScore
}
