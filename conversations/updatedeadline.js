var api = require('./../svlo-api')
var post = require('./../post')
var verify = require('./../verify')

var startConversation = function (err, convo) {
  if (!err) {
    var insertedNumber = parseInt(convo.source_message.match[1], 10)
    if (!Number.isInteger(insertedNumber)) {
      post.tasklist(err, convo)
      convo.addQuestion('Kan je mij het nummer geven van de taak die van de lijst af mag?', taskNumber)
    }
    convo.addQuestion('Wat is de nieuwe deadline?', NewDeadline)
    convo.on('end', UpdateDeadline)
    convo.activate()
  }
}

var taskNumber = function (response, convo) {
  convo.next()
}

var NewDeadline = function (response, convo) {
  var date = verify.date(response.text)
  if (date) {
    response.text = date
    convo.next()
  } else {
    convo.repeat()
  }
}

var UpdateDeadline = function (response, convo) {
  if (convo.status === 'completed') {
    var res = convo.extractResponses()
    var taskid = parseInt(res['Kan je mij het nummer geven van de taak waarvan je de deadline wilt wijzigen?'], 10) || parseInt(convo.source_message.match[1], 10)
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

module.exports = {
  'conversation': startConversation // done
}
