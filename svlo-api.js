var request = require('request')

var addTask = function (taskItems, cb) {
  var requestStructure = newRequestStructure()
  requestStructure.method = 'addtask'
  Object.assign(requestStructure, taskItems)
  xmlcall(requestStructure, cb)
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

var showChannelTasks = function (channelid, cb) {
  var options = newRequestStructure()
  options.channel = channelid
  getTasks(options, cb)
}

var showUserTasks = function (userid, cb) {
  var options = newRequestStructure()
  options.userid = userid
  getTasks(options, cb)
}

var showAllTasks = function (cb) {
  var options = newRequestStructure()
  getTasks(options, cb)
}

var showSingleTask = function (taskid, cb) {
  showAllTasks(function (err, response) {
    if (!err) {
      var singletask = response.body.tasks.map(function (task) {
        if (task.taskid === taskid) {
          return task
        } else {
          return false
        }
      })
      cb(err, singletask[0])
    } else {
      cb(err, null)
    }
  })
}

function getTasks (options, cb) {
  options.method = 'showTasks'
  xmlcall(options, cb)
}

function newRequestStructure () {
  return {
    'action': 'ToDo',
    'bot': 'Elsje',
    'token': process.env.TOKEN
    // 'method': '',
    // 'channel': '',
    // 'task': '',
    // 'userid': '',
    // 'responsibleid': '',
    // 'deadline': ''
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

module.exports = {
  addTask: addTask,
  updateTask: updateTask,
  completeTask: completeTask,
  showChannelTasks: showChannelTasks,
  showUserTasks: showUserTasks,
  showAllTasks: showAllTasks,
  showSingleTask: showSingleTask
}
