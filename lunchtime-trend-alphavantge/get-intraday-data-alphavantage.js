require('dotenv').config()
const axios = require('axios');

/**
 * 
 * Takes a stock / etf ticker, calls to Alphavantage API, and returns an array of time series data between 11:30am and 12:15pm
 * 
 * @param {string} ticker 
 * 
 * @returns Array<Alphavantage-Time-Series-Data>
 */
const getIntradayData = (ticker) => {

    const alphaPriceHistoryEndpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=1min&apikey=${process.env.KEY}&outputsize=full`

    return new Promise(async resolve => {

        try {

            const response = await axios.get(alphaPriceHistoryEndpoint)

            const timeSeriesData = response.data['Time Series (1min)']

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

            const lunchtimeEntries = []

            for (let [key, value] of Object.entries(timeSeriesData)) {

                timeSeriesDate = new Date(key)

                if (timeSeriesDate >= elevenThirtyDate && timeSeriesDate <= twelveFifteenDate)
                    lunchtimeEntries.unshift({
                        open: value['1. open'],
                        high: value['2. high'],
                        low: value['3. low'],
                        close: value['4. close'],
                        volume: value['5. volume'],
                        time: key
                    })
            }

            resolve(lunchtimeEntries)

        }

        catch (err) {

            console.log('error: ', err)
            reject(err)

        }

    })

}

module.exports = {
    getIntradayData
}