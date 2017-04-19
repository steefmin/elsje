# Elsje 
[![bitHound Overall Score](https://www.bithound.io/github/steefmin/elsje/badges/score.svg)](https://www.bithound.io/github/steefmin/elsje)
[![Known Vulnerabilities](https://snyk.io/test/github/steefmin/elsje/f8a7d435684e6f105be64a31db6dc78d7f7533f8/badge.svg)](https://snyk.io/test/github/steefmin/elsje/f8a7d435684e6f105be64a31db6dc78d7f7533f8)

[![Waffle planned](https://badge.waffle.io/steefmin/elsje.svg?label=planned&title=Planned)](http://waffle.io/steefmin/elsje)
[![Waffle busy](https://badge.waffle.io/steefmin/elsje.svg?label=busy&title=Busy)](http://waffle.io/steefmin/elsje)

A node.js bot for slack, that maintains a tasklist for all channels. Built with [Botkit](https://github.com/howdyai/botkit). Only in Dutch. 

# History
A lot of development work has been done on the [fork of botkit](https://github.com/steefmin/botkit). Restarted using this repo after using botkit as submodule in stead of hardcoding it in the repo and now moved on to a proper [npm](http://npmjs.com) setup. 

Elsje has been named after the [comic figure of Scouting Nederland](https://www.facebook.com/scoutingnederland/photos/a.10150459525454253.383474.324002099252/10151409808859253/)

# Install
Install dependencies `git` and `nodejs`. 
```
  $ git clone https://github.com/steefmin/elsje
  $ cd elsje
  $ npm install
```

# Config
Create `env.js` from `env.js.example` and add your Slack API Token and storage folder path.

# Run
From your `elsje/` folder, run:
```node bot.js```

# Integrations
Current integrations:
- [Slackwolf](https://github.com/chrisgillis/slackwolf) 
