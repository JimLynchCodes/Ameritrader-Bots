
require('dotenv').config()
const axios = require('axios');
var util = require('util')

const getQuotesEndpoint = 'https://api.tdameritrade.com/v1/marketdata'

const commandLinArgs = process.argv.slice(2)

const symbolArg = commandLinArgs[0]

const getQuote = async () => {

    console.log('\n\nGetting price history...\n\n')

    const today = new Date()

    const elevenThirtyDateString = (today.getMonth() + 1) + '/' +
        today.getDate() + '/' +
        today.getFullYear() +
        ' 11:30:00 GMT-0400'

    const twelveFifteenDateString = (today.getMonth() + 1) + '/' +
        today.getDate() + '/' +
        today.getFullYear() +
        ' 12:15:00 GMT-0400'

    const elevenThirtyDate = new Date(elevenThirtyDateString)
    const twelveFifteenDate = new Date(twelveFifteenDateString)

    console.log(`sending:\n${new Date(elevenThirtyDate.getTime())}\n${new Date(twelveFifteenDate.getTime())}`)
    console.log(`sending epochs:\n${elevenThirtyDate.getTime()}\n${twelveFifteenDate.getTime()}`)
    
    try {

        const response = await axios.get(
            `${getQuotesEndpoint}/${symbolArg}/pricehistory`,
            {
                params: {
                    'apikey': process.env.key,
                    'startDate': elevenThirtyDate.getTime(),
                    'endDate': twelveFifteenDate.getTime(),
                    'frequency': 1
                }
            }
        )

        // console.log('Quote: ', JSON.stringify(response))
        const priceHistory = response.data.candles

        // console.log('Price history: ', util.inspect(priceHistory))

        const firstCandleDate = new Date(priceHistory[0].datetime)

        const lastCandleDate = new Date(priceHistory[priceHistory.length - 1].datetime)

        console.log(`between dates:\n${firstCandleDate}\n${lastCandleDate}`)

        console.log(`between dates:\n${JSON.stringify(priceHistory[priceHistory.length - 1])}\n${JSON.stringify(priceHistory[priceHistory.length - 2])}\n${JSON.stringify(priceHistory[priceHistory.length - 3])}`)

    }

    catch (err) {

        console.log('Oh no! An Error happened: ', err)

    }

}

if (symbolArg)
    getQuote()

else {
    console.log('Please pass a symbol to this script in all caps!')
}

