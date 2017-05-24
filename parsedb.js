require('./env.js')
var fs = require('fs')
var api = require('./svlo-api')

const teamid = ''

var db = fs.readFileSync(process.env.STORAGE_LOCATION + teamid)

var json = JSON.parse(db)

json.tasks.forEach(function (oldtask, index, array) {
  var deadline = new Date(oldtask.deadline)
  var taskStructure = {
    task: oldtask.task,
    channel: oldtask.channel.id,
    userid: oldtask.user.id,
    responsibleid: oldtask.responsible.id,
    deadline: deadline.toISOString().substr(0, 10)
  }
  console.log('transfering task ' + index + ' out of ' + array.length)
  api.addTask(taskStructure, function (err, newtask) {
    if (!err) {
      if (oldtask.status === 'done') {
        console.log('also marking the task done')
        api.completeTask(newtask.taskid, function (err) {
          if (!err) {
            console.log('succes')
          }
        })
      } else {
        console.log('succes')
      }
    }
  })
})
