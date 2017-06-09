require('./env.js')

var functions = require('./functions')
var post = require('./post')
var newtask = require('./conversations/newtask')
var instant = require('./conversations/instant')
var completetask = require('./conversations/completetask')
var updatedeadline = require('./conversations/updatedeadline')
var tasklist = require('./conversations/tasklist')
var cc = require('./conversations/cc')
var score = require('./conversations/score')

var Botkit = require('botkit')

if (!process.env.TOKEN) {
  console.log('Error: Specify token in environment')
  process.exit(1)
}

var debug = (process.argv[2] !== 'production')

var controller = Botkit.slackbot({
  'json_file_store': process.env.STORAGE_LOCATION,
  'debug': debug
})

var bot = controller.spawn({
  token: process.env.TOKEN,
  retry: Infinity
}).startRTM()

var reconnectcounter = 0
controller.on('rtm_open', post.reconnect(bot, reconnectcounter, debug, function (increasedCounter) {
  reconnectcounter = increasedCounter
}))

controller.hears(['shutdown'], 'direct_message,direct_mention,mention', functions.shutdown)

controller.hears(['ken ik jou', 'wie ben jij', 'hoe lang ben je al wakker', 'uptime', 'identify yourself', 'who are you', 'what is your name'], 'direct_message,direct_mention,mention', functions.uptime)

controller.hears(['instanttaak (.*)'], 'direct_message', instant.taak)

controller.hears(['nieuwe taak', 'voeg toe', 'taak (.*)voegen'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.createConversation(message, newtask.conversation)
})

controller.hears(['taak (.*)afronden', 'taak (.*)afvinken', 'ik ben klaar', 'taak (.*)gedaan'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.createConversation(message, completetask.conversation)
})

controller.hears(['update deadline (.*)', 'deadline (.*) veranderen', 'andere deadline (.*)'], 'direct_mention,mention,direct_message', function (bot, message) {
  bot.createConversation(message, updatedeadline.conversation)
})

controller.hears(['newherinneringen', 'sendreminder'], 'direct_message', function (bot, message) {
  post.reminders(function (team, tasks) {
    controller.storage.teams.save({'id': team, 'db': tasks, 'timestamp': new Date()})
  })
})

controller.hears(['takenlijst(.*)', 'testlist(.*)', 'lijst(.*)', 'list(.*)'], 'direct_message,direct_mention,mention', tasklist.conversation)

controller.hears(['cc:(.*)', 'cc: (.*)', 'cc (.*)'], 'ambient', cc.conversation)

controller.on('reaction_added', score.reactionAdded)

controller.on('reaction_removed', score.reactionRemoved)

controller.hears(['(.*)\\+\\+', '(.*)\\-\\-'], 'ambient', score.votes)

controller.hears(['check(.*)', 'score(.*)'], 'mention,direct_mention,direct_message', score.check)

controller.hears(['leaderboard'], 'mention,direct_mention,direct_message', score.leaderboard)

module.exports = bot
