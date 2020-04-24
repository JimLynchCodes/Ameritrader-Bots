/**
 * Mongo-related functions for the sector scraper.
 */

const MongoClient = require('mongodb').MongoClient;

const save = (documentToSave) => {

    return new Promise((resolve, reject) => {

        MongoClient.connect(process.env.MONGO_URI, (err, db) => {

            if (err)
                throw new Error(err)

            var dbo = db.db(process.env.DATABASE_NAME)

            console.log('connecting to MongoDB at: ', process.env.MONGO_URI, ', database: ', process.env.DATABASE_NAME)
            console.log('Intserting sector data doc to collection: ', process.env.SECTORS_SCRAPER_COLLECTION)

            dbo.collection(process.env.SECTORS_SCRAPER_COLLECTION).insertOne(documentToSave,
                (err, res) => {
                    db.close()
                    if (err) reject(err)
                    resolve(res.result)
                })

        })

    })

}

module.exports = {
    save
}