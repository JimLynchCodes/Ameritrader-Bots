
const getIntradayData = require('./get-intraday-data-alphavantage').getIntradayData
const analyzeResultsData = require('./analyze-lunchtime-data').analyzeResultsData

// Tickers of the stocks we want to get data for
const stockTickers = [
    'UVXY',
    // 'TBIX',
    // '/VX',
    'SPY',
    'QQQ',
]


const findLunchTimeTrend = async () => {

    const promises = stockTickers.map( ticker => {
        return getIntradayData(ticker)
    })

    const rawLunchtimeData = await Promise.all(promises)

    const analyzedLunchtimeData = rawLunchtimeData.map( (rawLunchtimeDataSingleTicker, index) => {
        
        return analyzeResultsData(rawLunchtimeDataSingleTicker, stockTickers[index])

    }) 
  
    console.log('done.\n\n', JSON.stringify(analyzedLunchtimeData, null, 2))

}

findLunchTimeTrend()









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
            `${alphaPriceHistoryEndpoint}/${symbolArg}/pricehistory`,
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

// if (symbolArg)
//     getQuote()

// else {
//     console.log('Please pass a symbol to this script in all caps!')
// }

