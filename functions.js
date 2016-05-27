module.exports = {
	formatUptime: function(uptime){
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
	},
	verifyDate: function(text){
		var date;
		var current_date;
		var split;
		if (text == "vandaag" || text == "Vandaag"){
			date = new Date();
		}else if(text == "morgen" || text == "Morgen"){
			date = new Date();
			date.setDate(date.getDate() + 1);
		}else if(text == "Volgende week" || text == "volgende week" || text == "Week" || text == "week"){
			date = new Date();
			date.setDate(date.getDate() + 7);
		}else if(text == "Over een maand" || text == "over een maand" || text == "Maand" || text == "maand"){
			date = new Date();
			date.setDate(date.getDate() + 30);
		}else{
			text = text.replace(/-/g,"/");
			split = text.split('/');
			if(typeof split[1] != "undefined" && typeof split[2] != "undefined"){
				text = split[1]+'/'+split[0]+'/'+split[2];
			}
			text = text.replace("maa","mar");
			text = text.replace("mei","may");
			text = text.replace("okt","oct");
			date = new Date(Date.parse(text));
			date.setDate(date.getDate() + 1);
		}
		current_date= new Date(Date.parse(current_date.toDateString()));
		if(date != "Invalid Date" && date.getTime()>=current_date.getTime()){
			return date;
		}else{
			return false;
		}
	},
	addSpaces: function(numberOfSpaces){
		var spaces = "";
		for(i=0; i<numberOfSpaces;i++){
			spaces+=" ";
		}
		return spaces;
	},
	verifyUserName: function(input){
		var patern = /<@.{9}>/;
		var userid = patern.exec(input);
		if(userid){
			userid = userid[0].substr(2,9);
		}
		return userid;
	},
	verifyChannelName:function(input){
		var patern = /<#.{9}>/;
		var channelid = patern.exec(input);
		if(channelid){
			channelid = channelid[0].substr(2,9);
		}
		return channelid;
	},
	verifyUserId: function(input){
		var patern = /U.{8}/;
		var userid = patern.exec(input);
		if(userid){
			return userid[0];
		}else{
			return false;
		}
	},
	verifyChannelId:function(input){
		var patern = /C.{8}/;
		var channelid = patern.exec(input);
		if(channelid){
			return channelid[0];
		}else{
			return false;
		}
	}
};
