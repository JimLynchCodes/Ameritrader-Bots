
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

        // console.log('got some data! ', scrapedData)
        // console.log('got some data! ')
        // pull out various pieces into their own arrays
        const stockCategories = Object.keys(scrapedData['categories'])

        console.log('stock categories ', stockCategories)

        const tgReport = {}

        stockCategories.forEach(stockCategory => {

            // set up final object to save things into
            // dataToSave = new Map()

            tgReport[stockCategory] = {}

            // Symbols that occur in all three lists, using stock symbol as the key
            const occurrenceCountGainers = {}
            const occurrenceCountLosers = {}

            // const identifiedTripleLosers = []
            // const identifiedTripleGainers = []


            // console.log('category: ', scrapedData['categories'][stockCategory])
            // console.log('category gainers: ', scrapedData['categories'][stockCategory]['gainers'])

            // -- calculate triple gainers for each category

            const gOrL = ['gainers', 'losers']
            gOrL.forEach(gainerOrLoserString => {

                tgReport[stockCategory][gainerOrLoserString] = []

                scrapedData['categories'][stockCategory][gainerOrLoserString]['today'].forEach(rowOfTodayData => {

                    // console.log('um: ', scrapedData['categories'][stockCategory]['gainers'])
                    // console.log('checking stock: ', rowOfTodayData[0], ' ', occurrenceCountGainers[rowOfTodayData[0]])
                    if (occurrenceCountGainers[rowOfTodayData[0]] === undefined) {
                        occurrenceCountGainers[rowOfTodayData[0]] = { count: 1 }
                    } else {
                        occurrenceCountGainers[rowOfTodayData[0]].count = occurrenceCountGainers[rowOfTodayData[0]].count + 1

                    }

                    // for "today" on barchart, use the "%Chg" (index 4)
                    // console.log(`Adding today\'s  ${scrapedData['categories'][stockCategory]['gainers']['today'][0][4]}, ${rowOfTodayData[4]}`)
                    occurrenceCountGainers[rowOfTodayData[0]].gainOrLoss1d = rowOfTodayData[4]

                })

                scrapedData['categories'][stockCategory][gainerOrLoserString]['5d'].forEach(rowOf5dData => {

                    if (occurrenceCountGainers[rowOf5dData[0]] === undefined) {
                        occurrenceCountGainers[rowOf5dData[0]] = { count: 1 }
                    } else {
                        occurrenceCountGainers[rowOf5dData[0]].count = occurrenceCountGainers[rowOf5dData[0]].count + 1
                    }
                    // for 5d on barchart, use the "5D %Chg" (index 2)
                    console.log(`Adding 5d\'s  ${scrapedData['categories'][stockCategory][gainerOrLoserString]['5d'][0][2]}, ${rowOf5dData[2]}`)
                    occurrenceCountGainers[rowOf5dData[0]].gainOrLoss5d = rowOf5dData[2]

                })

                scrapedData['categories'][stockCategory][gainerOrLoserString]['1m'].forEach(rowOf1mData => {

                    if (occurrenceCountGainers[rowOf1mData[0]] === undefined) {
                        occurrenceCountGainers[rowOf1mData[0]] = { count: 1 }
                    } else {
                        occurrenceCountGainers[rowOf1mData[0]].count = occurrenceCountGainers[rowOf1mData[0]].count + 1
                    }

                    // for 1m on barchart, use the "1m %Chg" (index 2)
                    console.log(`Adding 1m\'s  ${scrapedData['categories'][stockCategory][gainerOrLoserString]['1m'][0][2]}, ${rowOf1mData[2]}`)
                    occurrenceCountGainers[rowOf1mData[0]].gainOrLoss1m = rowOf1mData[2]

                    if (occurrenceCountGainers[rowOf1mData[0]].count === 3) {
                        console.log('triple gainer identified! ', rowOf1mData[0])

                        const gainOrLoss1dString = occurrenceCountGainers[rowOf1mData[0]].gainOrLoss1d
                        const gainOrLoss5dString = occurrenceCountGainers[rowOf1mData[0]].gainOrLoss5d
                        const gainOrLoss1mString = occurrenceCountGainers[rowOf1mData[0]].gainOrLoss1m

                        const gainOrLoss1d = occurrenceCountGainers[rowOf1mData[0]].gainOrLoss1d.replace(/\+|\%/ig, '')

                        // console.log('gain or loss 1d: ', gainOrLoss1d)

                        const gainOrLoss5d = parseFloat(occurrenceCountGainers[rowOf1mData[0]].gainOrLoss5d.replace(/\+|\%/ig, ''))
                        const gainOrLoss1m = parseFloat(occurrenceCountGainers[rowOf1mData[0]].gainOrLoss1m.replace(/\+|\%/ig, ''))

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
                            'BC_Opinion': rowOf1mData[15]
                        })

                        console.log('pushhiinn\n', {
                            'Symbol': rowOf1mData[0].trim(),
                            '1d_change_%': gainOrLoss1dString,
                            '5d_change_%': gainOrLoss5dString,
                            '1m_change_%': gainOrLoss1mString,
                            'tg_weighted_change_%': weightedChangePercentageString,
                            'BC_Opinion': rowOf1mData[15]
                        })

                    }

                })

                // console.log('final occurrence map: ', JSON.stringify(occurrenceCountGainers, null, 2))

                // console.log('tg\'s:', JSON.stringify(identifiedTripleGainers, null, 2))

            })

           
            // console.log('g: ', tgReport['all_us_exchanges'])
            // console.log('g: ', Object.keys(tgReport['large_cap_us']))

            // const ok = tgReport['large_cap_us']['losers']

            // console.log('g: ', ok)

            // days_scraped_data['categories']['large_cap_us']['gainers']['today']


            // console.log(`Analyzing scraped sectors data from: ${scrapedData[date_scraped]} ${scrapedData[time_scraped]}`)

            // const data_1d = scrapedData['1_day']

            // ranked_sectors = []

            // Object.keys(data_1d).forEach(sectorName => {

            //     // Remove % sign from the end and parse to float, multiply by 100 for easier math
            //     const sector_data_1d = parseFloat(scrapedData['1_day'][sectorName].slice(0, -1)) * 100
            //     const sector_data_5d = parseFloat(scrapedData['5_day'][sectorName].slice(0, -1)) * 100
            //     const sector_data_1m = parseFloat(scrapedData['1_month'][sectorName].slice(0, -1)) * 100

            //     const trueAvgTotalDataPoints = 3
            //     const trueAvg = (sector_data_1d + sector_data_5d + sector_data_1m) / trueAvgTotalDataPoints / 100

            //     const weigthedAvgTotalPoints = 6
            //     const weightedAvg = (3 * sector_data_1d + 2 * sector_data_5d + sector_data_1m) / weigthedAvgTotalPoints / 100

            //     const trueAvgPretty = trueAvg.toFixed(2) + '%'
            //     const weightedAvgPretty = weightedAvg.toFixed(2) + '%'

            //     console.log('sect: ', sectorName, 'tg_score: ', weightedAvgPretty)

            //     ranked_sectors.push({
            //         'sector': sectorName,
            //         'triple_gainers_average': trueAvgPretty,
            //         'weighted_gainers_average': weightedAvgPretty,
            //     })

            // })

            // console.log('tg report', Object.keys(tgReport['large_cap_us'])[0])
            // console.log('tg report', JSON.stringify(tgReport, null, 1))
            // console.log('tg report', JSON.stringify(Object.keys(tgReport), null, 1))
            // console.log('tg report', typeof tgReport)
            // console.log('tg report', tgReport['all_us_exchange'])





            // dataToSave.set('date_scraped', currentDay)
            // dataToSave.set('time_scraped', currentTime)

            // dataToSave.set('ranked_triple_gainers_averages',
            //     ranked_sectors.sort((a, b) => a['triple_gainers_average'] < b['triple_gainers_average'] ? 1 : -1))

            // dataToSave.set('ranked_weighted_triple_gainers',
            //     ranked_sectors.sort((a, b) => a['weighted_gainers_average'] < b['weighted_gainers_average'] ? 1 : -1))

            // dataToSave.set('foo', { boubleFoo: 'bar' })

            // const results = await save(dataToSave)

            // console.log('Saved tg analysis to mongo!\n', results)


            
        })
        
        resolve(null)

        console.log('g: ', Object.keys(tgReport))
        console.log('g: ', Object.keys(tgReport['large_cap_us']['gainers']))
        console.log('l: ', Object.keys(tgReport['large_cap_us']['losers']))
        console.log('l: ', tgReport['large_cap_us']['losers'][0])
    })
}

main()
