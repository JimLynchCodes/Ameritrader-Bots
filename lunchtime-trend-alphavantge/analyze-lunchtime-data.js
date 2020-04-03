/**
 *  Takes the (slightly transformed) data from alphavantage for ONE security, and returns an analysis object
 * 
 * @param {Array} lunchtimeEntries 
 */
const analyzeResultsData = (lunchtimeEntries, ticker) => {

    let lowestLow = Infinity
    let lowestLowIndex = 0
    let highestHigh = 0
    let highestHighIndex = 0

    lunchtimeEntries.forEach((entry, index) => {

        if (entry.low < lowestLow) {
            lowestLow = entry.low
            lowestLowIndex = index
        }

        if (entry.high > highestHigh) {
            highestHigh = entry.high
            highestHighIndex = index
        }

    })

    const lunchtimeOpen = lunchtimeEntries[0].open
    const lunchtimeClose = lunchtimeEntries[lunchtimeEntries.length - 1].close

    const lunchtimeOpenToCloseChange = (lunchtimeClose - lunchtimeOpen).toFixed(2)
    const lunchtimeOpenToCloseChangePercentage = (lunchtimeOpenToCloseChange / lunchtimeClose).toPrecision(4) * 100

    const lunchtimeHighMinusLow = (highestHigh - lowestLow).toFixed(2)
    const lunchtimeHighMinusLowPercentage = (lunchtimeHighMinusLow / lunchtimeClose).toPrecision(4) * 100

    return {
        [ticker]: {
            'high_minus_low_$': lunchtimeHighMinusLow,
            'high_minus_low_%': lunchtimeHighMinusLowPercentage,
            'open_to_close_change_$': lunchtimeOpenToCloseChange,
            'open_to_close_change_%': lunchtimeOpenToCloseChangePercentage,
            'highest_high': highestHigh,
            'highest_high_time': lunchtimeEntries[highestHighIndex].time,
            'lowest_low': lowestLow,
            'lowest_low_time': lunchtimeEntries[lowestLowIndex].time,
        }
    }

}

module.exports = {
    analyzeResultsData
}