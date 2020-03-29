require('dotenv').config()

const mongoFunctions = require('./mongo-functions')
const twitFunctions = require('./twit-functions')

const getKeywords = mongoFunctions.getKeywords
const save = mongoFunctions.save
const initializeTwitter = twitFunctions.initializeTwitter
const getTweets = twitFunctions.getTweets

const main = async () => {

    const keywords = await getKeywords()

    await initializeTwitter()

    const tweetCallPromises = keywords.map(keywordObject => {
        return getTweets(keywordObject.keyword, keywordObject.exact_match)
    })

    const resolvedPromises = await Promise.all(tweetCallPromises)

    const tweetsFound = keywords.map((keywordObject, i) => {
        keywordObject.tweets_found = resolvedPromises[i]
        return keywordObject
    })

    await save(tweetsFound)

    console.log('Tweets saved! ')

}

main()
