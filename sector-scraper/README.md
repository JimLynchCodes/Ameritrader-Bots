# Sector Scraper

This is a quick little node.js script that pulls information from the Alphavantage API about US sector performance and saves it into Mongo.


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

## 3) Schedule as Cron Job

By running the super-scraper.sh file on the given cron interval, it will run every weekday at 5:00pm. 

Running the commands straight in the crontab file is not advised because you need to set up the environment again each time which can get very cluttered quickly and doesn't offer bash commands. We can keep our crontab list clean and leverage bash running the project's bash script at the desired interval. 

```
0 17 * * 1-5 ~/Git-Projects/Ameritrader-Bots/sector-scraper/sector-scraper.sh >> /home/ubuntu/Git-Projects/Ameritrader-Bots/sector-scraper/logs/`date +\%Y-\%m-\%d`-cron.log 2>&1
```

Note the double side carots `>>` which is needed to append the output to the logs file, and the `2>&1` tells it to write both the standard console logs and errors to the logs file.
