
require('dotenv').config()
const logger = require('./logger')
const moment = require('moment')
const mongoFunctions = require('./mongo-functions')
const readSectorsTgAnalysis = mongoFunctions.readSectorsTgAnalysis
const readStocksTgAnalysis = mongoFunctions.readStocksTgAnalysis

const sortByBcOpinion = require('./sort-by-bc-opinion')

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_ACCOUNT_TOKEN;

const client = require('twilio')(accountSid, authToken);

const getSendgridTripleGainersEmailRecipients = require('./get-sg-tg-email-recipients')

const sgMail = require('@sendgrid/mail');
const sgClient = require('@sendgrid/client');
sgClient.setApiKey(process.env.SENDGRID_KEY);
sgMail.setApiKey(process.env.SENDGRID_KEY);


const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

/**
 *  Sends a text or email to Triple Gainers subscribers.
 */

const main = async () => {

  const currentDay = moment().format('MMMM DD, YYYY')

  // logger.info('Pulling the most recent analyzed us sector data for triple gainers...')
  // const analyzedSectors = await readSectorsTgAnalysis()
  // logger.info(`Pulled analyzed SECTOR data from ${analyzedSectors['date_scraped']} ${analyzedSectors['time_scraped']}`)
  // logger.info(analyzedSectors)

  const analyzedStocks = await readStocksTgAnalysis()
  logger.info(`Pulled analyzed STOCK data from ${analyzedStocks['date_scraped']} ${analyzedStocks['time_scraped']}`)

  const largeCapGainersDataTextableString = analyzedStocks.results['large_cap_us']['gainers']
    /**
     *  Sorting by "BC_Opinion"
     */
    .sort(sortByBcOpinion)
    .map(gainerObj => {
      return `${gainerObj.Symbol}: ${gainerObj['tg_weighted_change_%']}, ${gainerObj['BC_Opinion']}\n`
    })
    .join('')

  // /** Limit to only top 16 */ 
  // if (largeCapGainersDataList.length > 16) {
  //   const firstEight = largeCapGainersDataList.slice(0, 8)
  //   const lastEight = largeCapGainersDataList.slice(largeCapGainersDataList.length - 9, largeCapGainersDataList.length - 1)

  //   largeCapGainersDataTextableString = [...firstEight, ...lastEight].join('')

  // } else {
  //   largeCapGainersDataList.join('')
  // }

  const largeCapGainersTableRows = buildRowFromMongoData(analyzedStocks, 'gainers')
  const largeCapLosersTableRows = buildRowFromMongoData(analyzedStocks, 'losers')

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

  const numberOfGainers = analyzedStocks.results['large_cap_us']['gainers'].length
  const numberOfLosers = analyzedStocks.results['large_cap_us']['losers'].length

  logger.info(`Notifying of ${numberOfGainers} gainers and ${numberOfLosers} losers.`)

  const fullTextEmail =
    `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">` +
    // `<html>` +
    // `<body>` +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    'Hey there! 🤖\n' +
    `Here's the Triple Gainers report for ${currentDay}! 🤖\n\n` +
    `\n` +
    '<h2>-- LARGE CAP (US) --</h2>\n' +
    '<h3>Gainers:</h3>\n' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black;">' +
    '<tr>' +
    tableHeaders() +
    '</tr>' +
    largeCapGainersTableRows +
    '</table>' +

    '<h3>Losers:</h3>\n' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black;">' +
    '<tr>' +
    tableHeaders() +
    '</tr>' +
    largeCapLosersTableRows +
    '</table>' +


    //     `
    //     <table cellpadding="0" cellspacing="0" width="640" align="center" border="1">     
    // <tr>         
    // <td>             
    // <table cellpadding="0" cellspacing="0" width="318" align="left" border="1">                
    //  <tr>                     
    // <td>Logo goes here.</td>                 
    // </tr>             
    // </table>             
    // <table cellpadding="0" cellspacing="0" width="318" align="left" border="1">                 
    // <tr>                     
    // <td>Image goes here.</td>                 
    // </tr>             
    // </table>         
    // </td>     
    // </tr> 
    // </table> 
    //     ` + 


    // '(tcdicker, weighted avg of % change at today\'s close, 5d, and 1m, TG weighted average % change, barchart opinion, 20D RSI, Today\'s Volume / 20D Avg Daily Volume)\n' +
    // `GAINERS: (${numberOfGainers})\n` +
    // largeCapGainersDataTextableString +
    // '\n' +
    // `LOSERS: (${numberOfLosers})\n` +
    // largeCapLosersDataTextableString +
    // '\n' +
    // '-- SECTORS (US) --\n' +
    // '(ranked weighted average of 1d, 5d, 1m price movements for S&P500 incumbents):\n' +
    // sectorsWeightedRanksString +
    // '\n' +
    '<p>&nbsp;</p>' +
    `<p>That's all for now!</p><p>If you have any questions, reply to this email, and we'll get back to you soon.</p>` +
    '<p>May the gains be with you. 💪</p>' +
    '<p>Disclaimer: any information here may be incorrect. Invest at your own risk!</p>' +
    '<p>Have friends who want to receive the daily Triple Gainers report? <a href="https://cdn.forms-content.sg-form.com/f034a73f-a80f-11ea-8e17-928c85d443c0">Sign up here</a>!</p>' +
    '<p>Disclaimer: any information here may be incorrect. Invest at your own risk!</p>' +
    '<p><a href="https://cdn.forms-content.sg-form.com/f034a73f-a80f-11ea-8e17-928c85d443c0">Unsubscribe</a>s</p>' +
    // '<a href="<% Unsubscribe Here %>">Click here to unsubscribe.</a>' +
    // 'cdc [%unsubscribe%]' +
    // '' +
    // '<% asm_group_unsubscribe_url %>' +
    '</div>'
  // '</body>'
  // '</html>'

  const shortenedTextMobile = `Hey there! 🤖\n` +
    `Triple Gainers stats for ${currentDay}:\n` +
    `Gainers: ${numberOfGainers}\n` +
    `Losers: ${numberOfLosers}\n\n` +
    `May the gains be with you. 💪`

  // logger.log(`Email message to send:\n${fullTextEmail}`)
  // logger.log(`${fullTextEmail}`)
  // logger.log(`Mobile message to send:\n${shortenedTextMobile}`)

  if (JSON.parse(process.env.DISABLE_ALL_MESSAGE_SENDING)) {
    logger.info('All message sending has been disabled by the env variable, DISABLE_ALL_MESSAGE_SENDING: ', process.env.DISABLE_ALL_MESSAGE_SENDING)
  } else {

    /**
     * Publish to EMAIL subscribers sns topic
     * 
     *   SNS CANNOT SEND HTML EMAILS SO PLS DON'T TRY TO USE IT FOR THAT. K THANKS, BYE.
     */

    // const snsEmailParams = {
    //   Message: fullTextEmail,
    //   TopicArn: process.env.TRIPLE_GAINERS_EMAIL_SUBSCRIBERS_ARN
    // }

    // const publishEmailResult = await new AWS.SNS({ apiVersion: '2010-03-31' }).publish(snsEmailParams).promise();

    /**
     * Publish to MOBILE subscribers sns topic
     */
    // const snsMobileParams = {
    //   Message: shortenedTextMobile,
    //   TopicArn: process.env.TRIPLE_GAINERS_MOBILE_SUBSCRIBERS_ARN
    // }

    // logger.info(`Published to Email subscribers topic!`)

    // const publishMobileResult = await new AWS.SNS({ apiVersion: '2010-03-31' }).publish(snsMobileParams).promise();

    // logger.info(`Published to Mobile subscribers topic!`)



    // Sendgrid stuff...


    /**
     * 
     *  Getting Sendgrid triple gainers contacts
     * 
     */

    const sgTgRecipients = await getSendgridTripleGainersEmailRecipients(process.env.TG_SG_EMAIL_SUBSCRIBERS_LIST_ID)

    console.log(JSON.stringify(sgTgRecipients))
    logger.info(`sendgrid recipients: ${JSON.stringify(sgTgRecipients)}`)

    // const emailSubscribers = ['jim@wisdomofjim.com']

    // emailSubscribers.forEach((emailSubscriber, index) => {

    //   if (index === 0) {

    //     setTimeout(async () => {

    const msg = {
      // to: sgTgRecipients,
      // to: 'help@katefromhr.com',
      // from: 'jim.lynch@evaluates2.com',
      to: 'help@katefromhr.com',
      from: 'jim.lynch@evaluates2.com',
      subject: `Triple Gainers for ${currentDay}!`,
      // // text: fullTextEmail,
      text: 'foobar text 45',
      // html: 'foobar 45',
      // asm: {
      //   group_id: 14385
      // }
      // html: 'foo bar for ddthe win!',
      templateId: 'd-0ce53859dc344584b37c06fca0ba30d5',
      // asm: {
      //   groupId: 14385,
      // },
      // dynamic_template_data: {
      //   body: 'derp derp {{foo}}',
      //   'foo': 'barskies'
      // },
      // mail_settings: {
      //   sandbox_mode: {
      //     enable: sendgridSandboxMode,
      //   },
      // },
    };

    const mailResponse = await sgMail.send(msg)

      .catch(err => {
        console.log('err sending: ', err)
      })

    //     }, 900 * index)

    //   }

    // })

    console.log('Mails have beent sent! ', mailResponse)


    /**
     * Manually chunking into texts (necessary? maybe not)
     */
    // number.forEach((chunk, i) => {
    // let numberofChunks = 1

    // if (fullTextEmail.length > MESSAGE_CHUNK_SIZE) {
    //   numberofChunks = Math.floor(fullTextEmail.length / MESSAGE_CHUNK_SIZE) + 1
    // }

    // for (i = 0; i < numberofChunks; i++) {
    //   const chunk = i === numberofChunks - 1 ?
    //     fullTextEmail.substring(i * MESSAGE_CHUNK_SIZE, fullTextEmail.length-1) :
    //     fullTextEmail.substr(i * MESSAGE_CHUNK_SIZE, MESSAGE_CHUNK_SIZE)

    logger.info('\n\nThe notifications have been sent! 🥳\n')
  }

  return process.exit(0)
}


main().catch(err => {

  console.log('TODO - send this error to Jim! ', err)

})


const buildRowFromMongoData = (analyzedStocks, gainersOrLosers) => {

  return analyzedStocks.results['large_cap_us'][gainersOrLosers]
    .sort(sortByBcOpinion)
    .map(gainerObj => {
      // return `${gainerObj.Symbol}: ${gainerObj['tg_weighted_change_%']}, ${gainerObj['BC_Opinion']}\n`

      return `<tr>` +
        '<td>' +
        gainerObj.Symbol +
        '</td>' +
        '<td>' +
        gainerObj['tg_weighted_change_%'] +
        '</td>' +
        '<td>' +
        gainerObj['1d_change_%'] +
        '</td>' +
        '<td>' +
        gainerObj['5d_change_%'] +
        '</td>' +
        '<td>' +
        gainerObj['1m_change_%'] +
        '</td>' +
        '<td>' +
        gainerObj['20d_rsi: '] +
        '</td>' +
        '<td>' +
        gainerObj['1D Volm / 20D Volm: '] +
        '</td>' +
        '<td>' +
        gainerObj['BC_Opinion'] +
        '</td>' +
        '</tr>'
    })
    .join('')

}

const tableHeaders = () => {

  return '<th><h4>&nbsp;Symbol&nbsp;</h4></th>' +
    '<th><h4>&nbsp;TG % Change&nbsp;</h4></th>' +
    '<th><h4>&nbsp;1D % Change&nbsp;</h4></th>' +
    '<th><h4>&nbsp;5D % Change&nbsp;</h4></th>' +
    '<th><h4>&nbsp;1M % Change&nbsp;</h4></th>' +
    '<th><h4>&nbsp;20D RSI&nbsp;</h4></th>' +
    '<th><h4>&nbsp;1D/20D Volm Ratio&nbsp;</h4></th>' +
    '<th><h4>&nbsp;BC Opinion&nbsp;</h4></th>'
}