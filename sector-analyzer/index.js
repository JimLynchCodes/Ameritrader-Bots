
require('dotenv').config()
const moment = require('moment')
const mongoFunctions = require('./mongo-functions')
const save = mongoFunctions.save
const read = mongoFunctions.read

/**
 *  Analyzes scraped US sector data (triple gainer's algo) for the current day.
 */

const main = async () => {

    return new Promise(async resolve => {

        const currentDay = moment().format('MMMM Do YYYY')
        const currentTime = moment().format('h:mm:ss a')
        
        console.log('Pulling the most recent analyzed us sector data for triple gainers...')
        const scrapedData = await read(currentDay)
        
        console.log(`Analyzing scraped sectors data from: ${scrapedData[date_scraped]} ${scrapedData[time_scraped]}`)

        const data_1d = scrapedData['1_day']

        ranked_sectors = []

        Object.keys(data_1d).forEach(sectorName => {

            // Remove % sign from the end and parse to float, multiply by 100 for easier math
            const sector_data_1d = parseFloat(scrapedData['1_day'][sectorName].slice(0, -1)) * 100
            const sector_data_5d = parseFloat(scrapedData['5_day'][sectorName].slice(0, -1)) * 100
            const sector_data_1m = parseFloat(scrapedData['1_month'][sectorName].slice(0, -1)) * 100

            const trueAvgTotalDataPoints = 3
            const trueAvg = (sector_data_1d + sector_data_5d + sector_data_1m) / trueAvgTotalDataPoints / 100

            const weigthedAvgTotalPoints = 6
            const weightedAvg = (3 * sector_data_1d + 2 * sector_data_5d + sector_data_1m) / weigthedAvgTotalPoints / 100

            const trueAvgPretty = trueAvg.toFixed(2) + '%'
            const weightedAvgPretty = weightedAvg.toFixed(2) + '%'

            console.log('sect: ', sectorName, 'tg_score: ', weightedAvgPretty)

            ranked_sectors.push({
                'sector': sectorName,
                'triple_gainers_average': trueAvgPretty,
                'weighted_gainers_average': weightedAvgPretty,
            })

        })

        dataToSave = new Map()

        dataToSave.set('date_scraped', currentDay)
        dataToSave.set('time_scraped', currentTime)

        dataToSave.set('ranked_triple_gainers_averages',
            ranked_sectors.sort((a, b) => a['triple_gainers_average'] < b['triple_gainers_average'] ? 1 : -1))

        dataToSave.set('ranked_weighted_triple_gainers',
            ranked_sectors.sort((a, b) => a['weighted_gainers_average'] < b['weighted_gainers_average'] ? 1 : -1))

        const results = await save(dataToSave)

        console.log('Saved analysis to mongo!\n', results)


        resolve(null)

    })
}

main()
