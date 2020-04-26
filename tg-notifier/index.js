
require('dotenv').config()
const moment = require('moment')
const mongoFunctions = require('./mongo-functions')
const readSectors = mongoFunctions.readSectors

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

/**
 *  Sends a text or email to Triple Gainers subscribers.
 */

const main = async () => {

  const currentDay = moment().format('MMMM DD, YYYY')

  console.log('Pulling the most recent analyzed us sector data for triple gainers...')

  const analyzedSectors = await readSectors()

  console.log(`Pulled analyzed data from ${analyzedSectors['date_scraped']} ${analyzedSectors['time_scraped']}`)

  console.log(analyzedSectors)

  const sectorsWeightedRanksString = analyzedSectors['ranked_weighted_triple_gainers'].map(sectorData => {

    return `${sectorData.sector}: ${sectorData.weighted_gainers_average}\n`

  }).join('')

  var snsParams = {
    Message:
      'Good morning! 🌞\n' +
      `Here's the Triple Gainers report for ${currentDay}! 🤖\n\n` +
      '-- SECTORS (US) --\n' +
      '(ranked weighted average of 1d, 5d, 1m price movements for S&P500 incumbents):\n' +
      sectorsWeightedRanksString + '\n' +
      'That\'s all for now! For help contact: tg-help@eon.com\n\n' + 
      'May the gains be with you. 💪',
    TopicArn: process.env.TRIPLE_GAINER_SUBSCRIBERS_ARN
  };

  console.log('Sending snsParams: ', snsParams)

  if (JSON.parse(process.env.DISABLE_ALL_MESSAGE_SENDING)) {
    console.log('All message sending has been disabled by the env variable, DISABLE_ALL_MESSAGE_SENDING: ', process.env.DISABLE_ALL_MESSAGE_SENDING)
  } else {

    const publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(snsParams).promise();

    const publishResult = await publishTextPromise

    console.log('The notifications have been sent! 🥳\n', publishResult)
  }

  return process.exit(0)

}

main().catch(err => {

  console.log('TODO - send this error to Jim! ', err)

})
