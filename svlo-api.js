var request = require('request')

var addTask = function (taskItems, cb) {
  var requestStructure = newRequestStructure()
  requestStructure.method = 'addTask'
  Object.assign(requestStructure, taskItems)
  xmlcall(requestStructure, function (err, response) {
    if (err) {
      cb(err, null)
    } else {
      taskItems.taskid = response.body.taskid
      taskItems.channelid = taskItems.channel
      cb(null, taskItems)
    }
  })
}

var updateTask = function (taskItems, cb) {
  var requestStructure = newRequestStructure()
  requestStructure.method = 'updateTask'
  Object.assign(requestStructure, taskItems)
  xmlcall(requestStructure, cb)
}

var completeTask = function (taskid, cb) {
  var taskStructure = {
    'taskid': taskid,
    'status': 1
  }
  updateTask(taskStructure, cb)
}

var showAllTasks = function (cb) {
  var options = newRequestStructure()
  getTasks(options, function (err, tasks) {
    var goodtasks = tasks.map(function (task) {
      task.deadline = task.deadline.substr(0, 10)
      return task
    })
    cb(err, goodtasks)
  })
}

var showSingleTask = function (taskid, cb) {
  showAllTasks(function (err, tasks) {
    if (!err) {
      var singletask = tasks.filter(function (task) {
        return task.taskid === taskid
      })
      cb(null, singletask[0])
    } else {
      cb(err, null)
    }
  })
}

function getTasks (options, cb) {
  options.method = 'showTasks'
  xmlcall(options, function (err, response) {
    if (err) {
      cb(err, null)
    } else {
      cb(null, response.body.tasks)
    }
  })
}

function newRequestStructure () {
  return {
    'action': 'Slack',
    'bot': 'Elsje',
    'token': process.env.TOKEN
    // 'method': ''
  }
}

function xmlcall (params, cb) {
  var options = {
    'url': process.env.TASK_API_URL,
    'json': true,
    'body': params
  }
  request.post(options, function (error, response, body) {
    var res = {
      'body': '',
      'response': {}
    }
    if (error) {
      cb(error, null)
    } else if (body.action === 'error') {
      console.log('api returned auth error')
      cb('auth error', null)
    } else if (body.succes === 1 && body.operation === 'error') {
      console.log('api returned submethod error')
      cb('submethod error', null)
    } else if (body.operation === 'ok') {
      // succes
      console.log('api returned succesfully')
      res.response = response
      res.body = body
      cb(null, res)
    } else {
      console.log('api returned unknown error')
      cb('undefined error', null)
    }
  })
}

var getSingleScore = function (userid, cb) {
  getScore(function (err, scoreboard) {
    if (err) {
      cb(err, null)
    } else {
      var score = scoreboard.filter(function (entry) {
        return entry.userid === userid
      })
      if (score[0]) {
        cb(null, score[0].score)
      } else {
        cb(null, 0)
      }
    }
  })
}

var getScore = function (cb) {
  var options = newRequestStructure()
  options.method = 'getScore'
  xmlcall(options, function (err, res) {
    if (err) {
      cb(err, null)
    } else {
      cb(null, res.body.scoreboard)
    }
  })
}

var changeScore = function (userid, score, cb=function(){}) {
  getSingleScore(userid, function (err, singleScore) {
    if (err) {
      cb(err, null)
    } else {
      singleScore = singleScore || 0
      var options = newRequestStructure()
      options.method = 'changeScore'
      options.userid = userid
      options.score = singleScore + score
      xmlcall(options, cb)
    }
  })
}

module.exports = {
  'addTask': addTask,
  'updateTask': updateTask,
  'completeTask': completeTask,
  'showAllTasks': showAllTasks,
  'showSingleTask': showSingleTask,
  'getScore': getScore,
  'getSingleScore': getSingleScore,
  'changeScore': changeScore
}
