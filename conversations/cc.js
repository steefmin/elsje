var post = require('./../post')
var verify = require('./../verify')

var cc = function (bot, message) {
  var isChannel = verify.channelname(message.match[1])
  if (isChannel) {
    bot.api.team.info({}, function (err, response) {
      if (!err) {
        var send = 'Er is een <http://' + response.team.domain + '.slack.com/archives/' + message.channel + '/p' + message.ts.replace('.', '') + '|bericht> geplaatst in <#' + message.channel + '> wat jullie misschien ook interessant vinden.'
        post.message(send, isChannel)
      }
    })
  }
}

module.exports = {
  'conversation': cc
}
