module.exports = function (bot) {
  var module = {}
  var api = require('./../svlo-api')
  var post = require('./../post')(bot)
  var verify = require('./../verify')

  module.conversation = function (err, convo) {
    if (!err) {
      var insertedNumber = verify.tasknumber(convo.source_message.match[1])
      if (insertedNumber) {
        finishtask(convo, insertedNumber)
        convo.stop()
      } else {
        post.tasklist(err, convo)
        convo.addQuestion('Kan je mij het nummer geven van de taak die van de lijst af mag?', pass)
      }
      convo.on('end', TaskDone)
      convo.activate()
    }
  }

  function pass (response, convo) {
    var num = verify.tasknumber(response.text)
    if (num) {
      response.text = num
      convo.next()
    }
  }

  function TaskDone (response, convo) {
    if (convo.status === 'completed') {
      var res = convo.extractResponses()
      var number = parseInt(res['Kan je mij het nummer geven van de taak die van de lijst af mag?'], 10)
      finishtask(convo, number)
    }
  }

  function finishtask (convo, taskNumber) {
    var userId = convo.source_message.user
    api.showSingleTask(taskNumber, function (err, task) {
      if (err) {
        post.message('Er is iets misgegaan bij het zoeken van de taak', convo.source_message.channel)
      } else {
        api.completeTask(taskNumber, function (error) {
          if (error) {
            post.message('Er is iets misgegaan bij het bijwerken van de taak.', convo.source_message.channel)
          } else {
            task.status = 1
            var message = {
              'fallback': 'Taak van <@' + task.responsibleid + '> door <@' + userId + '> afgerond: ' + task.task,
              'color': 'good',
              'pretext': 'Taak afgerond door <@' + userId + '>.'
            }
            post.singleTask(task, message)
            post.message('Taak afgerond in <#' + task.channelid + '>', convo.source_message.channel)
          }
        })
      }
    })
  }

  return module
}
