var verify = require('./../verify')
var post = require('./../post')

var startConversation = function (bot, message) {
  var userid = verify.username(message.match[1])
  var channelid = verify.channelname(message.match[1])
  var send = verify.channelid(message.channel) ? message.channel : message.user
  if (userid && channelid) {
    post.ShowList(channelid, userid, send)
  } else {
    if (userid) {
      post.ShowList('all', userid, send)
      return true
    } else if (channelid) {
      post.ShowList(channelid, 'all', send)
      return true
    } else if (verify.channelid(message.channel)) {
      post.ShowList(send, 'all', send)
    } else {
      post.ShowList('all', 'all', send)
    }
  }
}

module.exports = {'conversation': startConversation}
