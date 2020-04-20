
require('dotenv').config()
const axios = require('axios');
const moment = require('moment')
const mongoFunctions = require('./mongo-functions')
const save = mongoFunctions.save

const main = async () => {

    const url = process.env.ALPHAVANTAGE_SECTORS_ENDPOINT
    console.log('Calling to: ', url)

    const sectorData = await axios.get(url)
    console.log('Got data: ', sectorData.data['Meta Data'])

    if (!sectorData)
        throw new Error('Coudn\'t pull data from Alphavantage!')

    const currentDate = moment().format('MMMM Do YYYY')

    const currentTime = moment().format('h:mm:ss a')

    dataToSave = new Map()

    dataToSave.set('date_scraped', currentDate)
    dataToSave.set('time_scraped', currentTime)
    dataToSave.set('meta', sectorData.data['Meta Data'])
    dataToSave.set('realtime', sectorData.data['Rank A: Real-Time Performance'])
    dataToSave.set('1_day', sectorData.data['Rank B: 1 Day Performance'])
    dataToSave.set('5_day', sectorData.data['Rank C: 5 Day Performance'])
    dataToSave.set('1_month', sectorData.data['Rank D: 1 Month Performance'])
    dataToSave.set('3_month', sectorData.data['Rank E: 3 Month Performance'])
    dataToSave.set('year-to-date', sectorData.data['Rank F: Year-to-Date (YTD) Performance'])
    dataToSave.set('1_year', sectorData.data['Rank G: 1 Year Performance'])
    dataToSave.set('3_year', sectorData.data['Rank H: 3 Year Performance'])
    dataToSave.set('5_year', sectorData.data['Rank I: 5 Year Performance'])
    dataToSave.set('10_year', sectorData.data['Rank J: 10 Year Performance'])

    const results = await save(dataToSave)

    console.log('Saved to mongo!\n', results)

}

main()
