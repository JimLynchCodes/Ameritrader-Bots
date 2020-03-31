# Ameritrader Bots

Each folder here represents a different script that does something with the TD Ameritrade api. Each is its own independent little project.

## _get-quote_

Takes a security symbol (equity, etf, etc.) and gets a current quote for it.

## _twitter-keyword-scraper_

Reads a list of keywords from MongoDB (really, "keyword phrases"), searches the Twitter universe for tweets made in the past day containing these keywords, and then saves the results back into MongoDB.
