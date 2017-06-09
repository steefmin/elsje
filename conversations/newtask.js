module.exports = function (bot) {
  var module = {}

  var verify = require('./../verify')
  var api = require('./../svlo-api')
  var post = require('./../post')(bot)

  module.conversation = function (err, convo) {
    if (!err) {
      convo.addQuestion('Wat moet er gedaan worden?', collectTask)
      convo.addQuestion('Wie gaat dit doen? (@naam graag)', collectResponsible)
      convo.addQuestion('Wanneer moet het klaar zijn?', collectDeadline)
      if (convo.task.source_message.event === 'direct_message') {
        convo.addQuestion('In welke lijst zal ik dit zetten?', collectChannel)
      }
      convo.on('end', endCollection)
      convo.activate()
    }
  }

  function collectTask (response, convo) {
    convo.say('Ja, dat moet nodig gebeuren.')
    convo.next()
  }

  function collectResponsible (response, convo) {
    var userid
    if (response.text === 'ik') {
      userid = verify.userid(response.user)
    } else {
      userid = verify.userid(response.text)
    }
    if (userid) {
      response.text = userid
      convo.say('Ha, gesjaakt!')
      convo.next()
    }
  }

  function collectDeadline (response, convo) {
    var date = verify.date(response.text)
    if (date) {
      response.text = date
      convo.say('Ik zal het noteren.')
      convo.next()
    }
  }

  function collectChannel (response, convo) {
    var channelid = verify.channelname(response.text)
    if (channelid) {
      response.text = channelid
      convo.say('Kijk in <#' + channelid + '>.')
      convo.next()
    }
  }

  function endCollection (response, convo) {
    switch (convo.status) {
      case 'completed':
        compileTask(response, convo)
        break
      case 'stopped':
        break
      case 'timeout':
        break
      default:

    }
  }

  function compileTask (response, convo) {
    var res = convo.extractResponses()
    var task = {
      'channel': res['In welke lijst zal ik dit zetten?'] || response.channel,
      'userid': response.user,
      'task': res['Wat moet er gedaan worden?'],
      'responsibleid': res['Wie gaat dit doen? (@naam graag)'],
      'deadline': res['Wanneer moet het klaar zijn?']
    }
    api.addTask(task, module.taskStoreResult)
  }

  module.taskStoreResult = function (err, task) {
    if (err) {
      post.message('Sorry, er is iets misgegaan bij het opslaan.', task.channel)
    } else {
      var taskmessage = {
        'fallback': 'Taak toegevoegd voor <@' + task.responsibleid + '>: ' + task.task,
        'pretext': 'Nieuwe taak aangemaakt.'
      }
      post.singleTask(task, taskmessage)
    }
  }

  return module
}
