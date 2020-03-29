require('dotenv').config()

const mongoFunctions = require('./mongo-functions')
const twitFunctions = require('./twit-functions')

const getKeywords = mongoFunctions.getKeywords
const save = mongoFunctions.save
const initializeTwitter = twitFunctions.initializeTwitter
const getTweets = twitFunctions.getTweets

const main = async () => {

    const keywords = await getKeywords(process.env.MONGO_URI)

    await initializeTwitter()

    const tweetCallPromises = keywords.map(keywordObject => {
        return getTweets(keywordObject.keyword, keywordObject.exact_match)
    })

    Promise.all(tweetCallPromises).then(async (resolvedPromises) => {

        const tweetsFound = keywords.map((keywordObject, i) => {
            keywordObject.tweets_found = resolvedPromises[i]
            return keywordObject
        })

        const saved = await save(process.env.MONGO_URI, tweetsFound)

        console.log('Tweets saved! ', saved)
    });

}

main()
