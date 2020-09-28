
require('dotenv').config()
const moment = require('moment')
const mongoFunctions = require('./mongo-functions')
const save = mongoFunctions.save
const read = mongoFunctions.read

const logger = require('./logger')

/**
 *  Analyzes scraped US sector data (triple gainer's algo) for the current day.
 */

const main = async () => {

    return new Promise(async resolve => {

        const currentDay = moment().format('MMMM Do YYYY')
        const currentTime = moment().format('h:mm:ss a')

        logger.info(`Starting the TG Analyzer! ${currentDay} ${currentTime}\n`)

        const scrapedData = await read(currentDay)

        const stockCategories = Object.keys(scrapedData['categories'])

        logger.info('TG Categories: ', stockCategories)

        const tgReport = {}

        const volumeRatioMap = {}

        stockCategories.forEach(stockCategory => {
            
            // Build up tgReport, the final object that gets saved to the db.
            tgReport[stockCategory] = {}
            
            const occurrenceCount = {}
            
            const gOrL = ['gainers', 'losers']
            gOrL.forEach(gainerOrLoserString => {
                
                tgReport[stockCategory][gainerOrLoserString] = []
                
                occurrenceCount[gainerOrLoserString] = {}
                let volm_ratio

                scrapedData['categories'][stockCategory][gainerOrLoserString]['today'].forEach(rowOfTodayData => {

                    if (occurrenceCount[gainerOrLoserString][rowOfTodayData[0]] === undefined)
                        occurrenceCount[gainerOrLoserString][rowOfTodayData[0]] = {
                            count: {
                                [gainerOrLoserString]: 1
                            }
                        }
                    else
                        occurrenceCount[gainerOrLoserString][rowOfTodayData[0]].count[gainerOrLoserString] = occurrenceCount[gainerOrLoserString][rowOfTodayData[0]].count[gainerOrLoserString] + 1

                    // for "today" on barchart, use the "%Chg" (index 4)
                    occurrenceCount[gainerOrLoserString][rowOfTodayData[0]].gainOrLoss1d = rowOfTodayData[4]

                    // calculating volume ratio ("Vol" - index 7, divided by historical 20d vol, index 17)
                    const volume_1d = parseInt(rowOfTodayData[7].replace(/,/g, ''))
                    const volume_20d = parseInt(rowOfTodayData[17].replace(/,/g, ''))

                    // logger.info(`comparing ${gainerOrLoserString} ${rowOfTodayData[0]} ${volume_1d} and ${volume_20d}`)

                    volm_ratio = (volume_1d / volume_20d).toFixed(2).toString()

                    volumeRatioMap[rowOfTodayData[0]] = volm_ratio

                    // logger.info(`calculating volm ratio: ${volume_1d} / ${volume_20d} = ${volm_ratio}`)

                })

                scrapedData['categories'][stockCategory][gainerOrLoserString]['5d'].forEach(rowOf5dData => {

                    if (occurrenceCount[gainerOrLoserString][rowOf5dData[0]] === undefined)
                        occurrenceCount[gainerOrLoserString][rowOf5dData[0]] = { count: { [gainerOrLoserString]: 1 } }
                    else
                        occurrenceCount[gainerOrLoserString][rowOf5dData[0]].count[gainerOrLoserString] = occurrenceCount[gainerOrLoserString][rowOf5dData[0]].count[gainerOrLoserString] + 1

                    // for 5d on barchart, use the "5D %Chg" (index 2)
                    occurrenceCount[gainerOrLoserString][rowOf5dData[0]].gainOrLoss5d = rowOf5dData[2]

                })

                scrapedData['categories'][stockCategory][gainerOrLoserString]['1m'].forEach((rowOf1mData, rowIndex) => {

                    if (occurrenceCount[gainerOrLoserString][rowOf1mData[0]] === undefined)
                        occurrenceCount[gainerOrLoserString][rowOf1mData[0]] = { count: { [gainerOrLoserString]: 1 } }
                    else
                        occurrenceCount[gainerOrLoserString][rowOf1mData[0]].count[gainerOrLoserString] = occurrenceCount[gainerOrLoserString][rowOf1mData[0]].count[gainerOrLoserString] + 1

                    // for 1m on barchart, use the "1m %Chg" (index 2)
                    occurrenceCount[gainerOrLoserString][rowOf1mData[0]].gainOrLoss1m = rowOf1mData[2]

                    if (occurrenceCount[gainerOrLoserString][rowOf1mData[0]].count[gainerOrLoserString] === 3) {

                        const gainOrLoss1dString = occurrenceCount[gainerOrLoserString][rowOf1mData[0]].gainOrLoss1d
                        const gainOrLoss5dString = occurrenceCount[gainerOrLoserString][rowOf1mData[0]].gainOrLoss5d
                        const gainOrLoss1mString = occurrenceCount[gainerOrLoserString][rowOf1mData[0]].gainOrLoss1m

                        const gainOrLoss1d = parseFloat(occurrenceCount[gainerOrLoserString][rowOf1mData[0]].gainOrLoss1d.replace(/\+|\%/ig, ''))
                        const gainOrLoss5d = parseFloat(occurrenceCount[gainerOrLoserString][rowOf1mData[0]].gainOrLoss5d.replace(/\+|\%/ig, ''))
                        const gainOrLoss1m = parseFloat(occurrenceCount[gainerOrLoserString][rowOf1mData[0]].gainOrLoss1m.replace(/\+|\%/ig, ''))

                        // for 20 Day Relative Strength on barchart, use the "20 Day Rel Str" (index 16)
                        const rsi_20d = rowOf1mData[16]

                        const weightedChangePercentage = (((
                            3 * gainOrLoss1d * 100 +
                            2 * gainOrLoss5d * 100 +
                            1 * gainOrLoss1m * 100
                        ) / 6) / 100)
                            .toFixed(2)

                        const weightedChangePercentageString = weightedChangePercentage + '%'

                        tgReport[stockCategory][gainerOrLoserString].push({
                            'Symbol': rowOf1mData[0].trim(),
                            '1d_change_%': gainOrLoss1dString,
                            '5d_change_%': gainOrLoss5dString,
                            '1m_change_%': gainOrLoss1mString,
                            'tg_weighted_change_%': weightedChangePercentageString,
                            'BC_Opinion': rowOf1mData[15],
                            '20d_rsi: ': rsi_20d,
                            '1D Volm / 20D Volm: ': volumeRatioMap[rowOf1mData[0]]
                        })

                        // Use to log the core data object saved to mongo.
                        // logger.info(`final tgReport:  ${JSON.stringify(tgReport, null, 2)}`)

                    }

                })

            })

            // logger.info(`final occurence count map: \n${JSON.stringify(occurrenceCount, null, 2)}`)

        })

        const results = await save({
            'date_scraped': currentDay,
            'time_scraped': currentTime,
            results: tgReport
        })

        const numberOfGainers = tgReport['large_cap_us'].gainers.length
        const numberOfLosers = tgReport['large_cap_us'].losers.length

        logger.info(`\n\nLarge Cap: Found ${numberOfGainers} Gainers and ${numberOfLosers} Losers!\n\nSaved tg analysis to mongo! 🤓\n`)

        resolve(null)

    })
}

main()
    .then(() => {
        process.exit()
    })
    .catch(err => {
        logger.error(err)
    })
