var userid = function (input) {
  var userid = /U.{8}/.exec(input)
  return userid ? userid[0] : false
}

var username = function (text) {
  var userid = /<@.{9}>/.exec(text)
  return userid ? userid[0].substr(2, 9) : false
}

var date = function (text) {
  var date = new Date()
  var currentDate = date
  if (regexp(/vandaag\s*/i, text)) {
  } else if (regexp(/morgen\s*/i, text)) {
    date.setDate(date.getDate() + 1)
  } else if (regexp(/week\s*/i, text)) {
    date.setDate(date.getDate() + 7)
  } else if (regexp(/maand\s*/i, text)) {
    date.setDate(date.getDate() + 30)
  } else {
    date = parseDate(text)
  }
  if (date !== 'Invalid Date' && date.getTime() >= currentDate.getTime()) {
    return date.toISOString().substr(0, 10)
  } else {
    return false
  }
}

function parseDate (text) {
  if (regexp(/\d{2}-\d{2}-\d{4}/, text)) {
    text = text.split('-').reverse().join('-')
  }
  text = text.replace('maa', 'mar').replace('mei', 'may').replace('okt', 'oct')
  var date = new Date(Date.parse(text))
  date.setDate(date.getDate() + 1)
  return date
}

function regexp (patern, string) {
  return patern.exec(string)
}

var tasknumber = function (text) {
  var num = parseInt(text, 10)
  return Number.isInteger(num) ? num : false
}

var channelname = function (text) {
  var channelid = /<#.{9}/.exec(text)
  return channelid ? channelid[0].substr(2, 9) : false
}

var channelid = function (input) {
  var channelid = /C.{8}/.exec(input)
  return channelid ? channelid[0] : false
}

module.exports = {
  'userid': userid,
  'username': username,
  'date': date,
  'tasknumber': tasknumber,
  'channelname': channelname,
  'channelid': channelid
}
