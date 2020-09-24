
require('dotenv').config()
const logger = require('./logger')
const moment = require('moment')
const sg = require('@sendgrid/mail');
const mongoFunctions = require('./mongo-functions')
const getSendgridTripleGainersEmailRecipients = require('./get-sg-tg-email-recipients')
const sortByBcOpinion = require('./sort-by-bc-opinion')
const readStocksTgAnalysis = mongoFunctions.readStocksTgAnalysis
const _readSectorsTgAnalysis = mongoFunctions.readSectorsTgAnalysis // TODO - show sectors too

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

  const largeCapGainersTableRows = buildRowFromMongoData(analyzedStocks, 'gainers')
  const largeCapLosersTableRows = buildRowFromMongoData(analyzedStocks, 'losers')

  const largeCapLosersDataTextableString = analyzedStocks.results['large_cap_us']['losers']
    .sort(sortByBcOpinion)
    .map(gainerObj => {
      return `${gainerObj.Symbol}: ${gainerObj['tg_weighted_change_%']}, ${gainerObj['BC_Opinion']}\n`
    })
    .join('')

  const numberOfGainers = analyzedStocks.results['large_cap_us']['gainers'].length
  const numberOfLosers = analyzedStocks.results['large_cap_us']['losers'].length

  logger.info(`Notifying of ${numberOfGainers} gainers and ${numberOfLosers} losers.`)

  const fullTextEmail =
    `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">` +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    '\nHey there! 🤖\n' +
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

    '<p>&nbsp;</p>' +
    `<p>That's all for now!</p><p>If you have any questions, reply to this email, and we'll get back to you soon.</p>` +
    '<p>May the gains be with you! 💪</p><br/>' +
    '<p>Disclaimer: any information here may be incorrect. Invest at your own risk!</p>' +
    '<p>Have friends who want to receive the daily Triple Gainers report? <a href="https://cdn.forms-content.sg-form.com/f034a73f-a80f-11ea-8e17-928c85d443c0">Sign up here</a>!</p>' +
    '<br/>' +
    '<br/>' +

    '<div>' +
    '<a href="<%asm_group_unsubscribe_raw_url%>">Unsubscribe</a> | <a href="<%asm_preferences_raw_url%>">Manage Email Preferences</a>' +
    '</div>' +

    '</div>'

  const shortenedTextMobile = `Hey there! 🤖\n` +
    `Triple Gainers stats for ${currentDay}:\n` +
    `Gainers: ${numberOfGainers}\n` +
    `Losers: ${numberOfLosers}\n\n` +
    `May the gains be with you. 💪`

  if (JSON.parse(process.env.DISABLE_ALL_MESSAGE_SENDING)) {
    logger.info('All message sending has been disabled by the env variable, DISABLE_ALL_MESSAGE_SENDING: ', process.env.DISABLE_ALL_MESSAGE_SENDING)
  } else {

    const sgTgRecipients = await getSendgridTripleGainersEmailRecipients(process.env.TG_SG_EMAIL_SUBSCRIBERS_LIST_ID)

    logger.info(`sendgrid recipients: ${JSON.stringify(sgTgRecipients)}`)

    sgTgRecipients.forEach((recipient, i) => {

      sg.setApiKey(process.env.SENDGRID_KEY);
      const msg = {
        to: recipient,
        from: process.env.SG_FROM_EMAIL,
        // text: fullTextEmail,
        html: fullTextEmail,
        subject: `Triple Gainers Report! - ${currentDay}`,
        asm: {
          group_id: +process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID
        }
      };

      const millisecondSeparator = 1000

      const waitTime = millisecondSeparator * i

      setTimeout(() => {
        sg.send(msg).then((resp) => {
          logger.log(`Mail has been sent to ${recipient}!`,
            { ...msg, html: '[hidden]' })

          if (i === (sgTgRecipients.length - 1)) {
            logger.info('\n\nThe notifications have been sent! 🥳\n')
          }

        }).catch(err => {
          logge.log('error sending to recipient ', err)
        });

      }, waitTime)

    })

  }

}

main().catch(err => {

  logger.log('Error in the tg notifier! ', err)

})

const buildRowFromMongoData = (analyzedStocks, gainersOrLosers) => {

  return analyzedStocks.results['large_cap_us'][gainersOrLosers]
    .sort(sortByBcOpinion)
    .map(gainerObj => {

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