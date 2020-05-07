/**
 * Mongo-related functions for the sector analyzer.
 */

const MongoClient = require('mongodb').MongoClient;

const read = (day) => {
    console.log('Reading data from: ', process.env.MONGO_URI, '\nFor the day: ', day)

    return new Promise((resolve, reject) => {

        MongoClient.connect(process.env.MONGO_URI, async (err, db) => {
            if (err) throw err

            console.log('connected to mongo collection to read sector scrapes from: ', process.env.SECTORS_SCRAPES_COLLECTION)

            var dbo = db.db(process.env.DATABASE_NAME)

            const days_scraped_data = await dbo.collection(process.env.SECTORS_SCRAPES_COLLECTION)
                .find()
                .sort({ '_id': -1 })
                .limit(1)
                .next()

            // console.log('data ', days_scraped_data['categories']['large_cap_us']['gainers']['today'])

            resolve(days_scraped_data)

        })
    })
}

const save = (documentToSave) => {

    return new Promise(resolve => {

        MongoClient.connect(process.env.MONGO_URI, (err, db) => {

            if (err)
                throw new Error(err)

            console.log('connected to mongo for saving results...')

            var dbo = db.db(process.env.DATABASE_NAME)

            dbo.collection(process.env.SECTORS_ANALYSIS_COLLECTION).insertOne(documentToSave,
                (err, res) => {
                    if (err) throw err
                    db.close()
                    resolve(res.result)
                })

        })

    })

}

module.exports = {
    read,
    save
}