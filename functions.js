var formatUptime = function(uptime){
	var unit = 'seconde';
  var days;
	if(uptime >= 1.5){
		unit = unit + 'n';
	}
	if(uptime > 60) {
		uptime = uptime / 60;
		unit = 'minuut';
		if(uptime >= 1.5){
			unit = 'minuten';
		}
    if(uptime > 60) {
      uptime = uptime / 60;
      unit = 'uur';
      if(uptime > 24) {
        days = uptime / 24;
        unit = 'dag';
        if(uptime >= 1.5){
          unit = unit + 'en';
        }
      }
    }
	}
  if(days) {
    uptime = Math.floor(days) + ' ' + unit + ' en ' + Math.round(uptime-Math.floor(days)*24) + ' uur';
  }else{
    uptime = Math.round(uptime) + ' ' + unit;
  }
	return uptime;
};

var verifyDate = function(text){
  var date = new Date();
  var current_date = date;
  if (regexp(/vandaag\s*/i,text)){
  }else if(regexp(/morgen\s*/i,text)){
    date.setDate(date.getDate() + 1);
  }else if(regexp(/week\s*/i,text)){
    date.setDate(date.getDate() + 7);
  }else if(regexp(/maand\s*/i,text)){
    date.setDate(date.getDate() + 30);
  }else{
    date = parseDate(text);
  }
  if(date != "Invalid Date" && date.getTime()>=current_date.getTime()){
    return date;
  }else{
    return false;
  }
};

var parseDate = function(text){
  text = text.replace(/-/g,"/");
  var split = text.split('/');
  if(typeof split[1] != "undefined" && typeof split[2] != "undefined"){
    text = split[1]+'/'+split[0]+'/'+split[2];
  }
  text = text.replace("maa","mar");
  text = text.replace("mei","may");
  text = text.replace("okt","oct");
  var date = new Date(Date.parse(text));
  date.setDate(date.getDate() + 1);
  return date;
};

var addSpaces = function(numberOfSpaces){
  var spaces = "";
  for(i=0; i<numberOfSpaces;i++){
    spaces+=" ";
  }
  return spaces;
};

var verifyUserName = function(input){
  var patern = /<@.{9}>/;
  var userid = patern.exec(input);
  if(userid){
    userid = userid[0].substr(2,9);
  }
  return userid;
};

var verifyChannelName = function(input){
  var patern = /<#.{9}>/;
  var channelid = patern.exec(input);
  if(channelid){
    channelid = channelid[0].substr(2,9);
  }
  return channelid;
};

var verifyUserId = function(input){
  var patern = /U.{8}/;
  var userid = patern.exec(input);
  if(userid){
    return userid[0];
  }else{
    return false;
  }
};

var verifyChannelId = function(input){
  var patern = /C.{8}/;
  var channelid = patern.exec(input);
  if(channelid){
    return channelid[0];
  }else{
    return false;
  }
};

var regexp = function(patern,string){
  if(patern.exec(string)){
    return true;
  }else{
    return false;
  }
};

var getBotImg = function(bot,callback){
  bot.api.users.info({"user":bot.identity.id},function(err,reply){
    var img = reply.user.profile.image_original;
    callback(img);
  });
};

var getTeamId = function(bot,callback){
  bot.api.users.info({"user":bot.identity.id},function(err,reply){
    var teamId = reply.user.team_id;
    callback(teamId);
  });
};

module.exports = {
  formatUptime: formatUptime,
  verifyDate: verifyDate,
  addSpaces: addSpaces,
  verifyUserId: verifyUserId,
  verifyChannelId: verifyChannelId,
  verifyUserName: verifyUserName,
  verifyChannelName: verifyChannelName,
  getBotImg: getBotImg
};
