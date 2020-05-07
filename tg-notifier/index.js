
require('dotenv').config()
const moment = require('moment')
const mongoFunctions = require('./mongo-functions')
const readSectorsTgAnalysis = mongoFunctions.readSectorsTgAnalysis
const readStocksTgAnalysis = mongoFunctions.readStocksTgAnalysis

const sortByBcOpinion = require('./sort-by-bc-opinion')

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_ACCOUNT_TOKEN;

console.log('1: ', accountSid, ', 2: ', authToken)
const client = require('twilio')(accountSid, authToken);
const sgMail = require('@sendgrid/mail');

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

/**
 *  Sends a text or email to Triple Gainers subscribers.
 */

const main = async () => {

  const currentDay = moment().format('MMMM DD, YYYY')


  // console.log('Pulling the most recent analyzed us sector data for triple gainers...')
  // const analyzedSectors = await readSectorsTgAnalysis()
  // console.log(`Pulled analyzed SECTOR data from ${analyzedSectors['date_scraped']} ${analyzedSectors['time_scraped']}`)
  // console.log(analyzedSectors)

  const analyzedSectors = []

  const analyzedStocks = await readStocksTgAnalysis()
  console.log(`Pulled analyzed STOCK data from ${analyzedStocks['date_scraped']} ${analyzedStocks['time_scraped']}`)
  console.log(analyzedStocks)



  let largeCapGainersDataTextableString
  const largeCapGainersDataList = analyzedStocks.results['large_cap_us']['gainers']
    /**
     *  Sorting by "BC_Opinion"
     */
    .sort(sortByBcOpinion)
    .filter((stockDataObj) => {

      const bcOpinionString = stockDataObj['BC_Opinion']

      return parseFloat(bcOpinionString.substr(0, bcOpinionString.length - 2)) > 25
    })
    .map(gainerObj => {
      return `${gainerObj.Symbol}: ${gainerObj['tg_weighted_change_%']}, ${gainerObj['BC_Opinion']}\n`
    })

  // Limit to only top 16 
  if (largeCapGainersDataList.length > 16) {
    const firstEight = largeCapGainersDataList.slice(0, 8)
    const lastEight = largeCapGainersDataList.slice(largeCapGainersDataList.length - 9, largeCapGainersDataList.length - 1)

    largeCapGainersDataTextableString = [...firstEight, ...lastEight].join('')

  } else {
    largeCapGainersDataList.join('')
  }

  const largeCapLosersDataTextableString = analyzedStocks.results['large_cap_us']['losers']
    /**
     *  Sorting by "tg_weighted_change_%"
     */
    // .sort((a, b) => {
    //   return parseFloat(a['tg_weighted_change_%']) > parseFloat(b['tg_weighted_change_%']) ? 1 : -1
    // })
    // ==================================
    .sort(sortByBcOpinion)
    .map(gainerObj => {
      return `${gainerObj.Symbol}: ${gainerObj['tg_weighted_change_%']}, ${gainerObj['BC_Opinion']}\n`
    })
    .join('')

  // const sectorsWeightedRanksString = analyzedSectors ? analyzedSectors['ranked_weighted_triple_gainers'].map(sectorData => {
  //   return `${sectorData.sector}: ${sectorData.weighted_gainers_average}\n`
  // }).join('')
  //   : []


  // const fullText = 'Good morning! 🌞\n' +
  //   `Here's the Triple Gainers report for ${currentDay}! 🤖\n\n` +
  //   '-- LARGE CAP (US) --\n' +
  //   '(ticker, weighted avg of % change for prev day, 5d, and 1m, barchart opinion)\n' +
  //   'GAINERS:\n' +
  //   largeCapGainersDataTextableString +
  //   '\n' +
  //   'LOSERS:\n' +
  //   largeCapLosersDataTextableString +
  //   '\n' +
  //   // '-- SECTORS (US) --\n' +
  //   // '(ranked weighted average of 1d, 5d, 1m price movements for S&P500 incumbents):\n' +
  //   // sectorsWeightedRanksString +
  //   // '\n' +
  //   'That\'s all for now! For help contact: tg-help@eon.com\n\n' +
  //   'May the gains be with you. 💪\n\n' +
  //   'Disclaimer: any information here may be incorrect. Invest at your own risk!'

  const fullText = 'TG Highlights:\n' +
  `\n` +
  '-- LARGE CAP (US) --\n' +
  // '(ticker, weighted avg of % change for prev day, 5d, and 1m, barchart opinion)\n' +
  'GAINERS:\n' +
  largeCapGainersDataTextableString +
  '\n' +
  'LOSERS:\n' +
  largeCapLosersDataTextableString +
  '\n' +
  // '-- SECTORS (US) --\n' +
  // '(ranked weighted average of 1d, 5d, 1m price movements for S&P500 incumbents):\n' +
  // sectorsWeightedRanksString +
  // '\n' +
  // 'That\'s all for now! For help contact: tg-help@eon.com\n\n' +
  'May the gains be with you. 💪'
  // 'Disclaimer: any information here may be incorrect. Invest at your own risk!'




  if (JSON.parse(process.env.DISABLE_ALL_MESSAGE_SENDING)) {
    console.log('All message sending has been disabled by the env variable, DISABLE_ALL_MESSAGE_SENDING: ', process.env.DISABLE_ALL_MESSAGE_SENDING)
  } else {
    console.log('Full text, this many characters:', fullText.length)

    console.log('\n\n\n')
    console.log(fullText)
    console.log('\n\n\n')

    /**
     * Publish to sns topic
     */

    const snsParams = {
      Message: fullText,
      TopicArn: process.env.TRIPLE_GAINER_SUBSCRIBERS_ARN
    }

    console.log('Sending snsParams: ', snsParams)

    const publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(snsParams).promise();
    const publishResult = await publishTextPromise

    console.log('The notifications have been sent! 🥳\n', publishResult)


    // const textMessage = await client.messages
    //   .create({
    //     body: fullText,
    //     from: '+12025194549',
    //     to: '+19177453133'
    //   })

    // sgMail.setApiKey(process.env.SENDGRID_KEY);
    // const msg = {
    //   to: 'jim@wisdomofjim.com',
    //   from: 'jim.lynch@evaluates2.com',
    //   subject: 'Sending with Twilio SendGrid is Fun',
    //   text: fullText,
    //   html: fullText,
    // };

    // const mailResponse = await sgMail.send(msg);

    // console.log('mail response: ', mailResponse)







    /**
     * Manually chunking into texts (necessary? maybe not)
     */
    // number.forEach((chunk, i) => {
    // let numberofChunks = 1

    // if (fullText.length > MESSAGE_CHUNK_SIZE) {
    //   numberofChunks = Math.floor(fullText.length / MESSAGE_CHUNK_SIZE) + 1
    // }

    // for (i = 0; i < numberofChunks; i++) {
    //   const chunk = i === numberofChunks - 1 ?
    //     fullText.substring(i * MESSAGE_CHUNK_SIZE, fullText.length-1) :
    //     fullText.substr(i * MESSAGE_CHUNK_SIZE, MESSAGE_CHUNK_SIZE)

  }

  return process.exit(0)
}


main().catch(err => {

  console.log('TODO - send this error to Jim! ', err)

})
