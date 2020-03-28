require('dotenv').config()
const utilFunctions = require('./mongo-functions')

const getKeywords = utilFunctions.getKeywords
const save = utilFunctions.save

const main = async () => {
    
    const keywords = await getKeywords(process.env.MONGO_URI)
    
    console.log('keywords: ', keywords)

    const tweets = await searchForTweets(keywords)

    const saved = await save(process.env.MONGO_URI, {someData: "to Save"})

    console.log('saved it! ', saved)

}

main()
