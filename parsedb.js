require('./env.js')
var fs = require('fs')
var api = require('./svlo-api')

const teamdb = '/teams/db.bak'

var db = fs.readFileSync(process.env.STORAGE_LOCATION + teamdb)

var json = JSON.parse(db)

json.tasks.forEach(function (oldtask, index, array) {
  if (oldtask.status === 'new') {
    var deadline = new Date(oldtask.deadline)
    var taskStructure = {
      'task': oldtask.task,
      'channel': oldtask.channel.id,
      'userid': oldtask.user.id,
      'responsibleid': oldtask.responsible.id,
      'deadline': deadline.toISOString().substr(0, 10)
    }
    console.log('transfering task ' + index + ' out of ' + array.length)
    api.addTask(taskStructure, function (err, newtask) {
      if (err) {
        console.log(err)
      } else {
        console.log('succes')
      }
    })
  }
})
