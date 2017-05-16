var addTask = function (taskStructure, cb) {
  var err = false
  var response = false
  cb(err, response)
}

var updateTask = function (taskStructure, cb) {
  var err = false
  var response = false
  cb(err, response)
}

var completeTask = function (taskid, cb) {
  var taskStructure = newTaskStructure()
  updateTask(taskStructure, cb)
}

var showChannelTasks = function (channelid, cb) {
  var err = false
  var response = false
  cb(err, response)
}

var showUserTasks = function (userid, cb) {
  var err = false
  var response = false
  cb(err, response)
}

var showAllTasks = function (cb) {
  var err = false
  var response = false
  cb(err, response)
}

var newTaskStructure = function () {
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

module.exports = {
  addTask: addTask,
  updateTask: updateTask,
  completeTask: completeTask,
  showChannelTasks: showChannelTasks,
  showUserTasks: showUserTasks,
  showAllTasks: showAllTasks,
  newTaskStructure: newTaskStructure
}
