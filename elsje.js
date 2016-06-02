require('./env.js');
var functions = require('./functions');
var Botkit = require('botkit');
var os = require('os');

if (!process.env.TOKEN) {
	console.log('Error: Specify token in environment');
  process.exit(1);
}

var debug = (process.argv[2] !== "production");

var controller = Botkit.slackbot({
	"json_file_store": process.env.STORAGE_LOCATION,
	"debug": debug,
});

var bot = controller.spawn({
  token: process.env.TOKEN,
  retry: Infinity
}).startRTM();

controller.on('rtm_open',function(bot,message){
  if(!debug){
	  functions.postMessage(bot,"Hi, this is a debug message: I just reconnected","C0JTZBACD");
//	  	enable next line to create fresh db
//  		controller.storage.teams.save({id:message.user.team_id,tasks:[],tgif:{}});
  }
});

controller.on('channel_joined',function(bot,message) {
	controller.storage.channels.get(message.channel.id, function(err){
		if(err){
			controller.storage.channels.save({id: message.channel.id, tasks:[]});
		}
	});
});

controller.hears(['hello','hi','hoi','hallo','dag','hey'],'direct_message,direct_mention,mention',function(bot, message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  },function(err,res) {
    if (err) {
      bot.botkit.log('Failed to add emoji reaction :(',err);
    }
  });
  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,'Hoi ' + user.name + '!!');
    } else {
      bot.reply(message,'Hoi');
    }
  });
});


controller.hears(['noem me (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
  var name = message.match[1];
  controller.storage.users.get(message.user,function(err, user) {
    if (!user) {
      user = {
        id: message.user,
      };
    }
    user.name = name;
    controller.storage.users.save(user,function(err, id) {
      bot.reply(message,'Prima, vanaf nu zal ik je ' + user.name + ' noemen.');
    });
  });
});

controller.hears(['what is my name','who am i','wie ben ik','hoe heet ik','wat is mijn naam'],'direct_message,direct_mention,mention',function(bot, message) {
  controller.storage.users.get(message.user,function(err, user) {
    if (user && user.name) {
      bot.reply(message,'Jouw naam is ' + user.name);
    } else {
      bot.startConversation(message, function(err, convo) {
        if (!err) {
          convo.say('Ik weet jouw naam nog niet!');
          convo.ask('Hoe zal ik je noemen?', function(response, convo) {
            convo.ask('Je wilt dat ik je  `' + response.text + '` noem?', [{
              pattern: 'yes',
              callback: function(response, convo) {
                convo.next();
              }
            },{
              pattern: 'no',
              callback: function(response, convo) {
                convo.stop();
              }
            },{
              default: true,
              callback: function(response, convo) {
                convo.repeat();
                convo.next();
              }
            }]);
            convo.next();
          },{
            'key': 'nickname'
          }); // store the results in a field called nickname
          convo.on('end', function(convo) {
            if (convo.status == 'completed') {
              bot.reply(message,'Ok! Dit ga ik even opschrijven...');
              controller.storage.users.get(message.user,function(err, user) {
                if (!user) {
                  user = {id: message.user};
                }
                user.name = convo.extractResponse('nickname');
                controller.storage.users.save(user,function(err, id) {
                  bot.reply(message,'Prima, vanaf nu noem ik je ' + user.name + '.');
                });
              });
            }else{
              bot.reply(message, 'Ok, laat maar!');
            }
          });
        }
      });
    }
  });
});

controller.hears(['help'],'direct_message,direct_mention',function(bot, message){
	bot.startConversation(message,helpMe);	
});
var helpMe = function(response,convo){
	convo.ask('Ik kan helpen met de "takenlijst" en onthouden van "namen"',function(response,convo){
		if(response.text == "Takenlijst" || response.text == "takenlijst"){
			helpWithTakenlijst(response,convo);
		}else if (response.text == "Namen" || response.text == "namen"){
			helpWithNamen(response,convo);
		}else{
			bot.reply(response,"Sorry, daar kan ik je niet mee helpen");
			convo.stop();
		}
	});
};
var helpWithTakenlijst = function(response,convo){
	bot.reply(response,'Vraag me om een taak toe te voegen, dan voeg ik het toe aan de takenlijst van het kanaal waar we op dat moment in zitten.\nAls je me om de lijst vraagt, zal ik je deze geven.\nVraag me om een taak af te ronden of af te vinken dan haal ik deze van de lijst af.');
	convo.stop();
};
var helpWithNamen = function(response,convo){
	bot.reply(response,"Vertel me hoe ik je moet noemen, dan kan ik die naam in de toekomst gebruiken om te weten wie er bedoeld wordt. (bijv. noem me Elsje.)");
	convo.stop();
};

controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot, message) {
  bot.startConversation(message,function(err, convo) {
    convo.ask('Are you sure you want me to shutdown?',[{
      pattern: bot.utterances.yes,
      callback: function(response, convo) {
        convo.say('Bye!');
        convo.next();
        setTimeout(function() {
          process.exit();
        },3000);
      }
    },{
      pattern: bot.utterances.no,
      default: true,
      callback: function(response, convo) {
        convo.say('*Phew!*');
        convo.next();
      }
    }]);
  });
});

controller.hears(['ken ik jou','wie ben jij','hoe lang ben je al wakker','uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot, message) {
	var hostname = os.hostname();
	var uptime = functions.formatUptime(process.uptime());
	bot.reply(message,':robot_face: Ik ben een bot genaamd <@' + bot.identity.name + '>. Ik draai al ' + uptime + ' op ' + hostname + '.');
});

controller.hears(['nieuwe taak','voeg toe','taak (.*)voegen'],'direct_mention,mention,direct_message',function(bot,message){
	bot.startConversation(message,voegTaakToe);
});
var voegTaakToe = function(response, convo){
	convo.ask("Wat moet er gedaan worden?",function(response,convo){
		convo.say("Ja, dat moet nodig gebeuren.");
		voorWie(response,convo);
		convo.next();
	});
};
var voorWie = function(reponse,convo){
  convo.ask("Wie gaat dit doen? (@naam graag)", function(response,convo){
    var userid = functions.verifyUserName(response.text);
    if(userid){
      response.text = userid;
      convo.say("Ha, gesjaakt!");
      wanneerKlaar(response,convo);
      convo.next();
    }
  });
};
var wanneerKlaar = function(response,convo){
  convo.ask("Wanneer moet het klaar zijn?",function(response,convo){
    var date = functions.verifyDate(response.text);
    if(date){
      response.text = date;
      convo.say("Ik zal het onthouden.");
      if(convo.task.source_message.event=="direct_message"){
        welkKanaal(response,convo);
        convo.next();
      }else{
        opslaanVanTaak(response,convo);
        convo.next();
      }
    }
  });
};
var welkKanaal = function(response,convo){
  convo.ask("In welke lijst zal ik dit zetten?",function(response,convo){
    var channelid = functions.verifyChannelName(response.text);
    if(channelid){
      convo.say('Kijk in het kanaal voor de lijst.');
      opslaanVanTaak(response,convo);
      convo.next();
    }
  });
};
var opslaanVanTaak = function(response,convo){
  convo.on('end',function(convo){
    if(convo.status=='completed'){
      var res = convo.extractResponses();
      var channelid = functions.verifyChannelName(res['In welke lijst zal ik dit zetten?']);
      if(channelid){
        response.channel = channelid;
      }
      var id = response.team;
      console.log(response);
      controller.storage.teams.get(id, function(err, team_data){
        if(!err){
          var list = team_data;
          bot.api.users.info({"user":res['Wie gaat dit doen? (@naam graag)']},function(err,reply){
            if(!err){
              var name = reply.user.name;
              list.tasks.push({
                channel: {id: response.channel},
                taskid: list.tasks.length+1,
                user: {id: response.user},
                task: res['Wat moet er gedaan worden?'],
                responsible: {id: res['Wie gaat dit doen? (@naam graag)']},
                deadline: res['Wanneer moet het klaar zijn?'],
                status: "new",
              });
              controller.storage.teams.save({
                id: response.team,
                tasks: list.tasks,
              });
            }else{
              return false;
            }
          });
        }else{
          return false;
        }
      });
      bot.reply(response,"Ok, taak toegevoegd aan de lijst.");
    }else{
      bot.reply(response,"Sorry, ik heb iets niet begrepen, probeer het nog een keer.");
    }
  });
};

controller.hears(['taak (.*)afronden','taak (.*)afvinken','ik ben klaar','taak (.*)gedaan'],'direct_mention,mention,direct_message',function(bot,message){
  bot.startConversation(message,completeTask);
});
var completeTask = function(response,convo){
  var channel,send;
  if(functions.verifyChannelId(convo.source_message.channel)){
    channel = convo.source_message.channel;
    send = channel;
  }else{
    channel = "all";
    send = convo.source_message.user;
  }
  ShowList(channel,"all",send);
  convo.ask("Kan je mij het nummer geven van de taak die van de lijst af mag?",function(response,convo){
    if(!isNaN(parseInt(response.text))){
      convo.say("BAM, weer wat gedaan. Goed werk <@"+response.user+">.\n");
      TaskDone(response,convo);
      convo.next();
    }
  });
};
var TaskDone = function(response,convo){
  convo.on('end',function(convo){
    if(convo.status=='completed'){
      var res = convo.extractResponses();
      var number = parseInt(res['Kan je mij het nummer geven van de taak die van de lijst af mag?']);
      var id = response.team;
		    controller.storage.teams.get(id, function(err, channel_data){
          channel_data.tasks.forEach(function(value,index,array){
            if(value.taskid == number){
              value.status = "done";
            }
          });
          controller.storage.teams.save(channel_data);
        });
        bot.reply(response,"Ok, verwijderd van de lijst.");
    }else{
      bot.reply(response,"Sorry, ik heb iets niet begrepen, probeer het nog een keer.");
    }
  });
};

controller.hears(['update deadline','deadline veranderen','andere deadline'],'direct_mention,mention,direct_message',function(bot,message){
  bot.startConversation(message,DeadlineNumber);
});
var DeadlineNumber = function(response,convo){
  var channel,send;
  if(functions.verifyChannelId(convo.source_message.channel)){
    channel = convo.source_message.channel;
    send = channel;
  }else{
    channel = "all";
    send = convo.source_message.user;
  }
  ShowList(channel,"all",send);
  convo.ask("Kan je mij het nummer geven van de taak waarvan je de deadline wilt wijzigen?",function(response,convo){
    if(!isNaN(parseInt(response.text))){
      NewDeadline(response,convo);
      convo.next();
    }
  });
};
var NewDeadline = function(response,convo){
  convo.ask("Wat is de nieuwe deadline?",function(response,convo){
    date = functions.verifyDate(response.text);
    if(date){
      response.text = date;
      convo.say("Ik zal het onthouden.");
      UpdateDeadline(response,convo);
      convo.next();
    }
  });
};
var UpdateDeadline = function(response,convo){
  convo.on('end',function(convo){
    if(convo.status=='completed'){
      var res = convo.extractResponses();
      controller.storage.teams.get(response.team, function(err, channel_data){
        channel_data.tasks.forEach(function(value,index,array){
          if(value.taskid==parseInt(res['Kan je mij het nummer geven van de taak waarvan je de deadline wilt wijzigen?'])){
            value.deadline = res['Wat is de nieuwe deadline?'];
          }
        });
        controller.storage.teams.save(channel_data);
      });
      bot.reply(response,"Ok, nieuwe deadline genoteerd.");
    }
  });
};

controller.hears(['newherinneringen','sendreminder'],'direct_message',function(bot,message){
  NewSendReminders();
});

var NewSendReminders = function(){
  bot.api.users.list({},function(err,reply){
    reply.members.forEach(function(value,index,array){
      console.log(value);
      if(value.deleted === false && value.is_bot === false ){
        ShowList("all",value.id,value.id);
      }
    });
  });
};
controller.hears(['takenlijst(.*)','testlist(.*)','lijst(.*)'],'direct_message,direct_mention,mention',function(bot,message){
  var send;
  var type = message.match[1];
  var userid = functions.verifyUserName(type);
  var channelid = functions.verifyChannelName(type);
  if(functions.verifyChannelId(message.channel)){
    send = message.channel;
  }else{
    send = message.user;
  }
  console.log(message);
  if(userid && channelid){
    console.log("beide");
    ShowList(channelid,userid,send);
  }else{
    if(userid){
      console.log("user");
      ShowList("all",userid,send);
      return true;
    }else if(channelid){
      console.log("channel");
      ShowList(channelid,"all",send);
      return true;
    }else if(functions.verifyChannelId(message.channel)){
      console.log("none -> channel");
      ShowList(send,"all",send);
    }else{
      console.log("none -> dm");
      ShowList("all","all",send);
    }
  }
});
var ShowList = function(channelName,userName,sendto){
  functions.getTeamId(bot,function(teamid){
    controller.storage.teams.get(teamid,function(err,team_data){
      if(err){
        return false;
      }
      var sortedtasks, formatted, userID, channelID;
      var usertasks = functions.filterTasks('status',functions.filterTasks('channel',functions.filterTasks('responsible',team_data.tasks,userName),channelName),'new');
      if(usertasks.length === 0){
        console.log("empty tasks");
        return false;
      }
      sortedtasks = functions.sortTasks(usertasks,'channel');
      formatted = functions.formatTasks(sortedtasks);
      userID = functions.verifyUserId(sendto);
      if(userID){
        sendTo(formatted,userID);
        console.log('sending to user');
      }
      channelID = functions.verifyChannelId(sendto);
      if(channelID){
        sendTo(formatted,channelID);
        console.log('sending to channel');
      }
    });
  });
};
var sendTo = function(formatted,sendToID){
  if(functions.verifyUserId(sendToID)){
    bot.api.im.open({"user":sendToID},function(err,response){
      functions.postMessage(bot,formatted,response.channel.id);
    });
  }else if(functions.verifyChannelId(sendToID)){
    functions.postMessage(bot,formatted,sendToID);
  }else{
    console.log('err, no valid sendToID');
    return false;
  }
};

controller.hears(['TGIF'],'direct_message',function(bot,message){
  sendTGIF();
}

var sendTGIF = function(){
  functions.getTeamId(bot,function(teamid){
    controller.storage.teams.get(teamid, function(err, data) {
      console.log(data);
      for (var channel in data){
        
        console.log(channel);
        //functions.postMessage(bot,key,channel);
      };
    });
  });
};

controller.hears(['setTGIF(.*)'],'direct_message',function(bot,message){
  var text = message.match[1];
  var isChannel = functions.verifyChannelName(text);
  if(isChannel){
    functions.getTeamId(bot,function(teamId){
      controller.storage.teams.get(teamId, function(err, channel_data){
        channel_data.tgif[isChannel] = text.replace(isChannel,'');
        controller.storage.teams.save(channel_data);
      });
    });
  }
}
