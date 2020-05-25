
# Sector Analyzer

This is a quick little node.js script that pulls the "US Sectors" scraped data collection information from Mongo, computed the average gains according to "triple gainers algo", and saves the results in the US sectors analysis mongo collection.


# Usage

## 0) Use Node v12
```
nvm use
```

## Other 0) Create a .env File

(Use `.env_EXAMPLE` as an example)

You can get a free api key from here: https://www.alphavantage.co/support/#api-key


## 1) Install Dependencies
```
npm i
```


## 2) Run the script
```
npm start
```


# Deploying

## Use the Bash Script
The bash script loads the profiles again (allowing usage of node and nvm), runs `nvm use`, and then runs `npm start`. 


Clone this repo on your server and navigate into it.


Allow your current shell user to execute the file:
```
chmod +x run-analyzer.sh
```

Then run it like this:
```
./run-analyzer.sh
```

To schedule and a cronjob, edit the crontab file:
```
crontab -e
```

Then add an entry on a new line that runs the bash file (saving any logs to the logs folder).

This cron schedule will run every weekday at 5:00pm
```
0 5 * * 1-5 cd ~/Git-Projects/Ameritrader-Bots/triple-gainers-analyzer/run-analyzer.sh >> ~/Git-Projects/Ameritrader-Bots/triple-gainers-analyzer/logs/cron-logs_`date +\%Y-\%m-\%d`.log 2>&1
```