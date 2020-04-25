# Ameritrader Bots

Each folder here represents a different script that does something with the TD Ameritrade api. Each is its own independent little project.

## _get-quote_

Takes a security symbol (equity, etf, etc.) and gets a current quote for it.

## _twitter-keyword-scraper_

Reads a list of keywords from MongoDB (really, "keyword phrases"), searches the Twitter universe for tweets made in the past day containing these keywords, and then saves the results back into MongoDB.

## _lunchtime-trend_

Looks at price movements for a few securities between 11:20am and 12:15 pm in an attempt to find the "daily trend".

## _news-watcher_

Uses superfeedr to watch for incoming rss feeds.

## _rss-feed-listener_

Uses [rss-feed-emitter](https://github.com/filipedeschamps/rss-feed-emitter) to watch for incoming rss feeds.
