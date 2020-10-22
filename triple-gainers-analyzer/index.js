
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

        const gOrL = ['gainers', 'losers']
        const tips = {
            gainers: {
                high_volm_ratio_1d_20d: {
                    '+4': [],
                    '+3_5-4': [],
                    '+3-3_5': [],
                    '+2_5-3': [],
                    '+2-2_5': [],
                    '+1_5-2': []
                },
                rel_str_bands: {
                    '0-10': [],
                    '10-20': [],
                    '20-30': [],
                    '30-40': [],
                    '40-50': [],
                    '50-60': [],
                    '60-70': [],
                    '70-80': [],
                    '80-90': [],
                    '90-100': []
                },
                gold_medals: {
                    '1d': { symbol: '', value: 0 },
                    '5d': { symbol: '', value: 0 },
                    '1m': { symbol: '', value: 0 },
                },
                silver_medals: {
                    '1d': { symbol: '', value: 0 },
                    '5d': { symbol: '', value: 0 },
                    '1m': { symbol: '', value: 0 }
                }
            },
            losers: {
                high_volm_ratio_1d_20d: {
                    '+4': [],
                    '+3_5-4': [],
                    '+3-3_5': [],
                    '+2_5-3': [],
                    '+2-2_5': [],
                    '+1_5-2': []
                },
                rel_str_bands: {
                    '0-10': [],
                    '10-20': [],
                    '20-30': [],
                    '30-40': [],
                    '40-50': [],
                    '50-60': [],
                    '60-70': [],
                    '70-80': [],
                    '80-90': [],
                    '90-100': []
                },
                gold_medals: {
                    '1d': { symbol: '', value: 0 },
                    '5d': { symbol: '', value: 0 },
                    '1m': { symbol: '', value: 0 }
                },
                silver_medals: {
                    '1d': { symbol: '', value: 0 },
                    '5d': { symbol: '', value: 0 },
                    '1m': { symbol: '', value: 0 }
                }
            }
        }

        let numberOfVolumeTipsGainers = 0
        let numberOfVolumeTipsLosers = 0

        let numberOfRelStrTipsGainers = 0
        let numberOfRelStrTipsLosers = 0

        let numberOfGoldGainers = 0
        let numberOfGoldLosers = 0

        let numberOfSilverGainers = 0
        let numberOfSilverLosers = 0

        stockCategories.forEach(stockCategory => {

            // Build up tgReport, the final object that gets saved to the db.
            tgReport[stockCategory] = {}

            const occurrenceCount = {}

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

                    volm_ratio = (volume_1d / volume_20d).toFixed(2).toString()

                    volumeRatioMap[rowOfTodayData[0]] = volm_ratio

                    if (volm_ratio > 4)
                        tips[gainerOrLoserString].high_volm_ratio_1d_20d['+4'].push({ symbol: rowOfTodayData[0].trim(), value: volm_ratio })

                    else if (volm_ratio > 3.5)
                        tips[gainerOrLoserString].high_volm_ratio_1d_20d['+3_5-4'].push({ symbol: rowOfTodayData[0].trim(), value: volm_ratio })

                    else if (volm_ratio > 3)
                        tips[gainerOrLoserString].high_volm_ratio_1d_20d['+3-3_5'].push({ symbol: rowOfTodayData[0].trim(), value: volm_ratio })

                    else if (volm_ratio > 2.5)
                        tips[gainerOrLoserString].high_volm_ratio_1d_20d['+2_5-3'].push({ symbol: rowOfTodayData[0].trim(), value: volm_ratio })

                    else if (volm_ratio > 2)
                        tips[gainerOrLoserString].high_volm_ratio_1d_20d['+2-2_5'].push({ symbol: rowOfTodayData[0].trim(), value: volm_ratio })

                    else if (volm_ratio > 1.5)
                        tips[gainerOrLoserString].high_volm_ratio_1d_20d['+1_5-2'].push({ symbol: rowOfTodayData[0].trim(), value: volm_ratio })

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

                        const rsiInt = parseFloat(rsi_20d.replace(/\+|\%/ig, ''))

                        // calculating Relative Strength tips

                        if (rsiInt > 90)
                            tips[gainerOrLoserString].rel_str_bands['90-100'].push({ symbol: rowOf1mData[0].trim(), value: rsiInt })

                        else if (rsiInt > 80)
                            tips[gainerOrLoserString].rel_str_bands['80-90'].push({ symbol: rowOf1mData[0].trim(), value: rsiInt })

                        else if (rsiInt > 70)
                            tips[gainerOrLoserString].rel_str_bands['70-80'].push({ symbol: rowOf1mData[0].trim(), value: rsiInt })

                        else if (rsiInt > 60)
                            tips[gainerOrLoserString].rel_str_bands['60-70'].push({ symbol: rowOf1mData[0].trim(), value: rsiInt })

                        else if (rsiInt > 50)
                            tips[gainerOrLoserString].rel_str_bands['50-60'].push({ symbol: rowOf1mData[0].trim(), value: rsiInt })

                        else if (rsiInt > 40)
                            tips[gainerOrLoserString].rel_str_bands['40-50'].push({ symbol: rowOf1mData[0].trim(), value: rsiInt })

                        else if (rsiInt > 30)
                            tips[gainerOrLoserString].rel_str_bands['30-40'].push({ symbol: rowOf1mData[0].trim(), value: rsiInt })

                        else if (rsiInt > 20)
                            tips[gainerOrLoserString].rel_str_bands['20-30'].push({ symbol: rowOf1mData[0].trim(), value: rsiInt })

                        else if (rsiInt > 10)
                            tips[gainerOrLoserString].rel_str_bands['10-20'].push({ symbol: rowOf1mData[0].trim(), value: rsiInt })

                        else
                            tips[gainerOrLoserString].rel_str_bands['0-10'].push({ symbol: rowOf1mData[0].trim(), value: rsiInt })


                        // calculating "Gold Medals (gainers)" tips
                        if (gainOrLoss1d > tips.gainers.gold_medals['1d'].value) {

                            if (tips.gainers.gold_medals['1d']) {
                                tips.gainers.silver_medals['1d'] = {
                                    symbol: tips.gainers.gold_medals['1d'].symbol,
                                    value: tips.gainers.gold_medals['1d'].value,
                                }

                            }

                            tips.gainers.gold_medals['1d'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss1d
                            }
                        } else if (gainOrLoss1d > tips.gainers.silver_medals['1d'].value) {
                            tips.gainers.silver_medals['1d'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss1d
                            }
                        }

                        if (gainOrLoss5d > tips.gainers.gold_medals['5d'].value) {

                            if (tips.gainers.gold_medals['5d']) {
                                tips.gainers.silver_medals['5d'] = {
                                    symbol: tips.gainers.gold_medals['5d'].symbol,
                                    value: tips.gainers.gold_medals['5d'].value,
                                }
                            }

                            tips.gainers.gold_medals['5d'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss5d,
                            }

                        } else if (gainOrLoss5d > tips.gainers.silver_medals['5d'].value) {
                            tips.gainers.silver_medals['5d'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss5d
                            }
                        }

                        if (gainOrLoss1m > tips.gainers.gold_medals['1m'].value) {

                            if (tips.gainers.gold_medals['1m']) {
                                tips.gainers.silver_medals['1m'] = {
                                    symbol: tips.gainers.gold_medals['1m'].symbol,
                                    value: tips.gainers.gold_medals['1m'].value,
                                }
                            }

                            tips.gainers.gold_medals['1m'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss1m,
                            }
                        } else if (gainOrLoss1m > tips.gainers.silver_medals['1m'].value) {
                            tips.gainers.silver_medals['1m'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss1m
                            }
                        }

                        // calculating "Gold Medals (losers)" tips

                        if (gainOrLoss1d < tips.losers.gold_medals['1d'].value) {

                            if (tips.losers.gold_medals['1d']) {
                                tips.losers.silver_medals['1d'] = {
                                    symbol: tips.losers.gold_medals['1d'].symbol,
                                    value: tips.losers.gold_medals['1d'].value,
                                }
                            }

                            tips.losers.gold_medals['1d'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss1d,
                            }
                        } else if (gainOrLoss1d < tips.losers.silver_medals['1d'].value) {
                            tips.losers.silver_medals['1d'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss1d
                            }
                        }

                        if (gainOrLoss5d < tips.losers.gold_medals['5d'].value) {

                            if (tips.losers.gold_medals['5d']) {
                                tips.losers.silver_medals['5d'] = {
                                    symbol: tips.losers.gold_medals['5d'].symbol,
                                    value: tips.losers.gold_medals['5d'].value,
                                }
                            }

                            tips.losers.gold_medals['5d'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss5d
                            }
                        } else if (gainOrLoss5d < tips.losers.silver_medals['5d'].value) {
                            tips.losers.silver_medals['5d'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss5d
                            }
                        }

                        if (gainOrLoss1m < tips.losers.gold_medals['1m'].value) {

                            if (tips.losers.gold_medals['1m']) {
                                tips.losers.silver_medals['1m'] = {
                                    symbol: tips.losers.gold_medals['1m'].symbol,
                                    value: tips.losers.gold_medals['1m'].value,
                                }
                            }

                            tips.losers.gold_medals['1m'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss1m
                            }
                        } else if (gainOrLoss1m < tips.losers.silver_medals['1m'].value) {
                            tips.losers.silver_medals['1m'] = {
                                symbol: rowOf1mData[0].trim(),
                                value: gainOrLoss1m
                            }
                        }

                        numberOfVolumeTipsGainers = Object.values(tips.gainers.high_volm_ratio_1d_20d).reduce((acc, array) => acc + array.length, 0)
                        numberOfVolumeTipsLosers = Object.values(tips.losers.high_volm_ratio_1d_20d).reduce((acc, array) => acc + array.length, 0)

                        numberOfRelStrTipsGainers = Object.values(tips.gainers.rel_str_bands).reduce((acc, array) => acc + array.length, 0)
                        numberOfRelStrTipsLosers = Object.values(tips.losers.rel_str_bands).reduce((acc, array) => acc + array.length, 0)

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
                    }
                })
            })
        })

        const results = await save({
            'date_scraped': currentDay,
            'time_scraped': currentTime,
            results: tgReport,
            tips
        })

        numberOfGoldGainers = +(tips.gainers.gold_medals['1d'].value !== 0 ? 1 : 0) +
            +(tips.gainers.gold_medals['5d'].value !== 0 ? 1 : 0) +
            +(tips.gainers.gold_medals['1m'].value !== 0 ? 1 : 0)

        numberOfGoldLosers = +(tips.losers.gold_medals['1d'].value !== 0 ? 1 : 0) +
            +(tips.losers.gold_medals['5d'].value !== 0 ? 1 : 0) +
            +(tips.losers.gold_medals['1m'].value !== 0 ? 1 : 0)

        numberOfSilverGainers = +(tips.gainers.silver_medals['1d'].value !== 0 ? 1 : 0) +
            +(tips.gainers.silver_medals['5d'].value !== 0 ? 1 : 0) +
            +(tips.gainers.silver_medals['1m'].value !== 0 ? 1 : 0)

        numberOfSilverLosers = +(tips.losers.silver_medals['1d'].value !== 0 ? 1 : 0) +
            +(tips.losers.silver_medals['5d'].value !== 0 ? 1 : 0) +
            +(tips.losers.silver_medals['1m'].value !== 0 ? 1 : 0)

        logger.info(`Created tips:\ngainers:` +
            `volm: (${numberOfVolumeTipsGainers}), ` +
            `rel str: (${numberOfRelStrTipsGainers}), ` +
            `golds: (${numberOfGoldGainers}), ` +
            `silvers: (${numberOfSilverGainers}), ` +
            `\nlosers, ` +
            `volm: (${numberOfVolumeTipsLosers}), ` +
            `rel str:: (${numberOfRelStrTipsLosers}), ` +
            `golds: (${numberOfGoldLosers}), ` +
            `silvers: (${numberOfSilverLosers}), `)

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
