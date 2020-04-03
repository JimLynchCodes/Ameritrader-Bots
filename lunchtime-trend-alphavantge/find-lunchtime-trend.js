
const getIntradayData = require('./get-intraday-data-alphavantage').getIntradayData
const analyzeResultsData = require('./analyze-lunchtime-data').analyzeResultsData

// Tickers of the stocks we want to get data for
const stockTickers = [
    'UVXY',
    // 'TVIX',  // Not Updated?
    'VIX',
    'SPY',
    'XOP'
    // 'QQQ', // Not Updated?
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
