const MongoClient = require('mongodb').MongoClient;
const moment = require('moment')

const getKeywords = () => {
    console.log('uri is: ', process.env.MONGO_URI)

    return new Promise((resolve, reject) => {

        MongoClient.connect(process.env.MONGO_URI, (err, db) => {
            if (err) throw err

            console.log('connected to mongo for reading keywords..')

            var dbo = db.db("eon-data")

            dbo.collection("twitter-keyword-scanner-config").findOne({}, (err, mainDoc) => {
                if (err) throw err

                const keywords = mainDoc.keywords
                db.close()
                resolve(keywords)
            })
        })
    })
}

const save = (tweetsFound) => {

    return new Promise(resolve => {

        MongoClient.connect(process.env.MONGO_URI, (err, db) => {

            if (err)
                throw new Error(err)

            console.log('connected to mongo for saving results...')

            var dbo = db.db("eon-data")

            const currentTime = moment().format('MMMM Do YYYY, h:mm:ss a')

            dbo.collection('twitter-keyword-scanner-results').insertOne({
                date_scraped: currentTime,
                tweets_by_keyword: tweetsFound
            }, (err, res) => {
                if (err) throw err
                db.close()
                resolve(res.result)
            })

        })

    })

}

module.exports = {
    getKeywords,
    save
}