module.exports = function (bot) {
  var module = {}

  var api = require('./../svlo-api')
  var post = require('./../post')(bot)
  var verify = require('./../verify')

  module.conversation = function (err, convo) {
    if (!err) {
      var insertedNumber = verify.tasknumber(convo.source_message.match[1])
      if (!insertedNumber) {
        post.tasklist(err, convo)
        convo.addQuestion('Kan je mij het nummer geven van de taak die van de lijst af mag?', taskNumber)
      }
      convo.addQuestion('Wat is de nieuwe deadline?', NewDeadline)
      convo.on('end', UpdateDeadline)
      convo.activate()
    }
  }

  var taskNumber = function (response, convo) {
    var tasknumber = verify.tasknumber(response.text)
    if (tasknumber) {
      response.text = tasknumber
      convo.next()
    }
  }

  var NewDeadline = function (response, convo) {
    var date = verify.date(response.text)
    if (date) {
      response.text = date
      convo.next()
    }
  }

  var UpdateDeadline = function (response, convo) {
    if (convo.status === 'completed') {
      var res = convo.extractResponses()
      var taskid = verify.tasknumber(res['Kan je mij het nummer geven van de taak waarvan je de deadline wilt wijzigen?']) || verify.tasknumber(convo.source_message.match[1])
      var deadline = res['Wat is de nieuwe deadline?']
      api.updateTask({'taskid': taskid, 'deadline': deadline}, function (err) {
        if (err) {
          post.message('Er is iets misgegaan bij het bijwerken van de taak.', convo.source_message.channel)
        } else {
          api.showSingleTask(taskid, function (err, task) {
            if (!err) {
              var message = {
                'fallback': 'Taak van <@' + task.responsibleid + '> heeft nieuwe deadline: ' + task.deadline,
                'pretext': 'Deze taak heeft een nieuwe deadline.'
              }
              post.singleTask(task, message)
              post.message('Ok, nieuwe deadline genoteerd.', convo.source_message.channel)
            }
          })
        }
      })
    }
  }

  return module
}
