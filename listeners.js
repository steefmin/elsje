var ordinal = require('ordinal-numbers')
var os = require('os')

var functions = require('./functions')

var debug = (process.argv[2] !== 'production')

var reconnectcounter = 0

var restart = function (bot, message) {
  if (!debug) {
    var reconnecttext = 'Hi, this is a debug message: I '
    if (reconnectcounter === 0) {
      reconnecttext += 'just connected.'
    } else {
      reconnecttext += 'reconnected for the ' + ordinal(reconnectcounter) + ' time.'
    }
    reconnectcounter++
    var attachment = [{
      'fallback': reconnecttext,
      'color': 'danger',
      'text': reconnecttext
    }]
    postAttachment(bot, attachment, process.env.RESTART_MESSAGE_CHANNEL)
  }
}

var uptime = function (bot, message) {
  var hostname = os.hostname()
  var uptime = functions.formatUptime(process.uptime())
  bot.reply(message, ':robot_face: Ik ben een bot genaamd <@' + bot.identity.name + '>. Ik draai al ' + uptime + ' op ' + hostname + '.')
}

// function postMessage (bot, message, channel) {
//   postGeneral(bot, {'text': message}, channel)
// }

function postAttachment (bot, attachmentArray, channel) {
  postGeneral(bot, {'attachments': attachmentArray}, channel)
}

function postGeneral (bot, something, channel) {
  var general = {
    'channel': channel
  }
  Object.assign(general, something)
  bot.say(general)
}

module.exports = {
  'restart': restart,
  'uptime': uptime
}
