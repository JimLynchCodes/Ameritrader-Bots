var MongoClient = require('mongodb').MongoClient;

const getKeywords = async (uri) => {
    console.log('uri is: ', uri)

    MongoClient.connect(uri, function (err, db) {
        if (err) throw err

        console.log('connected...')

        var dbo = db.db("eon-data")

        dbo.collection("twitter-keyword-scanner").find({}).toArray(function (err, mainDoc) {
            if (err) throw err
            
            const keywords = mainDoc[0].config.keywordsToLookFor
            console.log('got keywords. ', keywords)
            db.close()
            return keywords
        })
    })
}

module.exports = {
    getKeywords
}