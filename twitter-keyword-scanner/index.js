require('dotenv').config()
const utilFunctions = require('./functions')

const getKeywords = utilFunctions.getKeywords


const main = async () => {
    
    const keywords = await getKeywords(process.env.MONGO_URI)
    
    console.log('keywords: ', keywords)

}

main()
