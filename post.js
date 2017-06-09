var ordinal = require('ordinal-numbers')

var reconnect = function (bot, reconnectcounter, debug, cb) {
  if (!debug) {
    var reconnecttext = 'Hi, this is a debug message: I '
    if (reconnectcounter === 0) {
      reconnecttext += 'just connected.'
    } else {
      reconnecttext += 'reconnected for the ' + ordinal(reconnectcounter) + ' time.'
    }
    var attachment = [{
      'fallback': reconnecttext,
      'color': 'danger',
      'text': reconnecttext
    }]
    attachment(bot, attachment, process.env.RESTART_MESSAGE_CHANNEL)
    cb(reconnectcounter++)
  }
}

var attachment = function (bot, attachment, channel) {}

module.exports = {
  'reconnect': reconnect,
  'attachment': attachment
}
