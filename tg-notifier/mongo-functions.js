/**
 * Mongo-related functions for the Triple Gainers notifier.
 */

const MongoClient = require('mongodb').MongoClient;

const readSectors = () => {
    // console.log('Reading data from: ', process.env.MONGO_URI, '\nFor the day: ', day)

    return new Promise((resolve, reject) => {

        MongoClient.connect(process.env.MONGO_URI, async (err, db) => {
            if (err) throw err

            console.log('connected to mongo collection to read sector scrapes from: ', process.env.TG_ANALYSIS_COLLECTION)

            var dbo = db.db(process.env.DATABASE_NAME)

            const days_scraped_data = await dbo.collection(process.env.TG_ANALYSIS_COLLECTION)
                .find()
                .sort({ '_id': -1 })
                .limit(1)
                .next()

            resolve(days_scraped_data)

        })
    })
}

module.exports = {
    readSectors
}