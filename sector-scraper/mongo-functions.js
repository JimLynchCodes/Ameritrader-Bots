/**
 * Mongo-related functions for the sector scraper.
 */

const MongoClient = require('mongodb').MongoClient;

const save = (documentToSave) => {

    return new Promise(resolve => {

        MongoClient.connect(process.env.MONGO_URI, (err, db) => {

            if (err)
                throw new Error(err)

            console.log('connected to mongo for saving results...')

            var dbo = db.db("scrape_db")

            dbo.collection(process.env.SECTORS_SCRAPER_COLLECTION).insertOne(documentToSave,
                (err, res) => {
                    if (err) throw err
                    db.close()
                    resolve(res.result)
                })

        })

    })

}

module.exports = {
    save
}