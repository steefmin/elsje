# Elsje
A node.js bot for slack, that maintains a tasklist for all channels. Built with https://github.com/howdyai/botkit. Only in Dutch. 

# History
A lot of work has been done on the fork of botkit on: https://github.com/steefmin/botkit. Restarted using this repo after using botkit as submodule in stead of hardcoding it in the repo. 

Elsje has been named after the comic figure of Scouting Nederland https://www.facebook.com/scoutingnederland/photos/a.10150459525454253.383474.324002099252/10151409808859253/

# Install
Install dependencies `git` and `nodejs`. 
```
  $ git clone https://github.com/steefmin/elsje
  $ cd elsje
  $ git submodule init
  $ git submodule update
  $ cd botkit
  $ sudo npm install
```

# Config
Create `env.js` from `env.js.example` and add your Slack API Token and storage folder path.

# Run
From your `elsje/` folder, run:
```node bot.js```
