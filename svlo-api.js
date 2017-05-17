var request = require('request')

var addTask = function (taskItems, cb) {
  var requestStructure = newRequestStructure()
  requestStructure.method = 'addtask'
  Object.assign(requestStructure, taskItems)
  xmlcall(requestStructure, function (err, response) {
    if (err) {
      cb(err, null)
    } else {
      cb(null, response.body.taskid)
    }
  })
}

var updateTask = function (taskItems, cb) {
  var requestStructure = newRequestStructure
  requestStructure.method = 'updateTask'
  Object.assign(requestStructure, taskItems)
  xmlcall(requestStructure, cb)
}

var completeTask = function (taskid, cb) {
  var taskStructure = newRequestStructure()
  taskStructure.taskid = taskid
  taskStructure.status = 1
  updateTask(taskStructure, cb)
}

var showAllTasks = function (cb) {
  var options = newRequestStructure()
  getTasks(options, cb)
}

var showSingleTask = function (taskid, cb) {
  showAllTasks(function (err, tasks) {
    if (!err) {
      var singletask = tasks.map(function (task) {
        if (task.taskid === taskid) {
          return task
        } else {
          return false
        }
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
    'action': 'ToDo',
    'bot': 'Elsje',
    'token': process.env.TOKEN
    // 'method': ''
  }
}

function xmlcall (params, cb) {
  var headers = {
    'Content-Type': 'application/json'
  }
  var options = {
    url: process.env.TASK_API_URL,
    method: 'POST',
    headers: headers,
    form: params
  }
  request(options, function (error, response, body) {
    var res
    res.response = response
    res.body = body
    cb(error, res)
  })
}

var getSingleScore = function (userid, cb) {
  getScore(function (err, scoreboard) {
    if (err) {
      cb(err, null)
    } else {
      var score = scoreboard.map(function (entry) {
        if (entry.id === userid) {
          return entry.score
        }
      })
      cb(null, score[0])
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

var changeScore = function (userid, score, cb) {
  getSingleScore(userid, function (err, singleScore) {
    if (err) {
      cb(err, null)
    } else {
      var options = newRequestStructure()
      options.method = 'changeScore'
      options.userid = userid
      options.score = singleScore + score
      xmlcall(options, cb)
    }
  })
}

module.exports = {
  addTask: addTask,
  updateTask: updateTask,
  completeTask: completeTask,
  showAllTasks: showAllTasks,
  showSingleTask: showSingleTask,
  getScore: getScore,
  getSingleScore: getSingleScore,
  changeScore: changeScore
}
