
require('dotenv').config()
const logger = require('./logger')
const moment = require('moment')
const sg = require('@sendgrid/mail');
const mongoFunctions = require('./mongo-functions')
const getSendgridTripleGainersEmailRecipients = require('./get-sg-tg-email-recipients')
const sortByBcOpinion = require('./sort-by-bc-opinion')
const readStocksTgAnalysis = mongoFunctions.readStocksTgAnalysis
const _readSectorsTgAnalysis = mongoFunctions.readSectorsTgAnalysis // TODO - show sectors too

let colorNextRow = true

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

  colorNextRow = true

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

  const highVolumeTipsSection = `<h2>Unusually High Volume ✨</h2>` +
    '<p><i>Stocks with the highest 1 day / 20 day volume ratio.</i></p>' +
    '<h3>Gainers</h3>' +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black; margin: auto;min-width:300px;">' +
    '<tr>' +
    `<th style="min-width:70px;"><h4>Symbol</h4></th>` +
    '<th><h4>1d / 20d Volume Ratio</h4></th>' +
    '</tr>' +

    getVolumeTipsRows(analyzedStocks.tips['gainers']['high_volm_ratio_1d_20d']) +

    '</table>' +
    '<br/>' +
    '</div>' +
    '<h3>Losers</h3>' +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black; margin: auto;min-width:300px;">' +
    '<tr>' +
    '<th style="min-width:70px;"><h4>Symbol</h4></th>' +
    '<th><h4>1d / 20d Volume Ratio</h4></th>' +
    '</tr>' +

    getVolumeTipsRows(analyzedStocks.tips['losers']['high_volm_ratio_1d_20d']) +

    '</table>' +
    '<br/>' +
    '</div>' +
    '<br/>' +
    '<hr/>'


  const relativeStrengthTipsSection = `<h2>Bouncin' Back 🏀</h2>` +
    '<p><i>In general, stocks with a low relative strength are oversold (go long),</i></p>' +
    '<p><i>and stocks with a high relative strength are overbought (go short).</i></p>' +
    '<h3>Oversold</h3>' +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black; margin: auto;min-width:300px;">' +

    '<tr>' +
    '<th style="min-width:70px;"><h4>Symbol</h4></th>' +
    '<th><h4>Relative Strength</h4></th>' +
    '</tr>' +

    getLowRelStrTipsRows(analyzedStocks.tips['gainers']['rel_str_bands'], analyzedStocks.tips['losers']['rel_str_bands']) +

    '</table>' +
    '<br/>' +
    '</div>' +
    '<h3>Overbought</h3>' +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black; margin: auto;min-width:300px;">' +
    '<tr>' +
    '<th style="min-width:70px;"><h4>Symbol</h4></th>' +
    '<th><h4>Relative Strength</h4></th>' +
    '</tr>' +

    getHighRelStrTipsRows(analyzedStocks.tips['gainers']['rel_str_bands'], analyzedStocks.tips['losers']['rel_str_bands']) +

    '</table>' +
    '<br/>' +
    '</div>' +
    '<br/>' +
    '<hr/>'



  const goldMedalsSection = `<h2>Gold Medals 🥇</h2>` +
    '<p><i>The largest moves for each direction and time period.</i></p>' +
    '<h3>Gainers</h3>' +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black; margin: auto;min-width:300px;">' +
    '<tr>' +
    '<th><h4>Time Period</h4></th>' +
    '<th><h4>Symbol</h4></th>' +
    '<th><h4>Price Change</h4></th>' +
    '</tr>' +
    `<tr bgcolor='#B9EDB9'>` +
    `<td>1d</td>` +
    `<td>${analyzedStocks.tips.gainers.gold_medals['1d'].symbol}</td>` +
    `<td>+${analyzedStocks.tips.gainers.gold_medals['1d'].value}%</td>` +
    '</tr>' +
    '<tr>' +
    `<td>5d</td>` +
    `<td>${analyzedStocks.tips.gainers.gold_medals['5d'].symbol}</td>` +
    `<td>+${analyzedStocks.tips.gainers.gold_medals['5d'].value}%</td>` +
    '</tr>' +
    `<tr bgcolor='#B9EDB9'>` +
    `<td>1m</td>` +
    `<td>${analyzedStocks.tips.gainers.gold_medals['1m'].symbol}</td>` +
    `<td>+${analyzedStocks.tips.gainers.gold_medals['1m'].value}%</td>` +
    '</tr>' +
    '</table>' +
    '<br/>' +
    '</div>' +
    '<h3>Losers</h3>' +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black; margin: auto;min-width:300px;">' +
    '<tr>' +
    '<th><h4>Time Period</h4></th>' +
    '<th><h4>Symbol</h4></th>' +
    '<th><h4>Price Change</h4></th>' +
    '</tr>' +
    `<tr bgcolor='#B9EDB9'>` +
    `<td>1d</td>` +
    `<td>${analyzedStocks.tips.losers.gold_medals['1d'].symbol}</td>` +
    `<td>${analyzedStocks.tips.losers.gold_medals['1d'].value}%</td>` +
    '</tr>' +
    '<tr>' +
    `<td>5d</td>` +
    `<td>${analyzedStocks.tips.losers.gold_medals['5d'].symbol}</td>` +
    `<td>${analyzedStocks.tips.losers.gold_medals['5d'].value}%</td>` +
    '</tr>' +
    `<tr bgcolor='#B9EDB9'>` +
    `<td>1m</td>` +
    `<td>${analyzedStocks.tips.losers.gold_medals['1m'].symbol}</td>` +
    `<td>${analyzedStocks.tips.losers.gold_medals['1m'].value}%</td>` +
    '</tr>' +
    '</table>' +
    '<br/>' +
    '<br/>' +
    '<hr/>'

  const silverMedalsSection = '<h2>Silver Medals 🥈</h2>' +
    '<p><i>The second largest moves for each direction and time period.</i></p>' +
    '<h3>Gainers</h3>' +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black; margin: auto;min-width:300px;">' +
    '<tr>' +
    '<th><h4>Time Period</h4></th>' +
    '<th><h4>Symbol</h4></th>' +
    '<th><h4>Price Change</h4></th>' +
    '</tr>' +
    `<tr bgcolor='#B9EDB9'>` +
    `<td>1d</td>` +
    `<td>${analyzedStocks.tips.gainers.silver_medals['1d'].symbol}</td>` +
    `<td>+${analyzedStocks.tips.gainers.silver_medals['1d'].value}%</td>` +
    '</tr>' +
    '<tr>' +
    `<td>5d</td>` +
    `<td>${analyzedStocks.tips.gainers.silver_medals['5d'].symbol}</td>` +
    `<td>+${analyzedStocks.tips.gainers.silver_medals['5d'].value}%</td>` +
    '</tr>' +
    `<tr bgcolor='#B9EDB9'>` +
    `<td>1m</td>` +
    `<td>${analyzedStocks.tips.gainers.silver_medals['1m'].symbol}</td>` +
    `<td>+${analyzedStocks.tips.gainers.silver_medals['1m'].value}%</td>` +
    '</tr>' +
    '</table>' +
    '<br/>' +
    '</div>' +
    '<h3>Losers</h3>' +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black; margin: auto;min-width:300px;">' +
    '<tr>' +
    '<th><h4>Time Period</h4></th>' +
    '<th><h4>Symbol</h4></th>' +
    '<th><h4>Price Change</h4></th>' +
    '</tr>' +
    `<tr bgcolor='#B9EDB9'>` +
    `<td>1d</td>` +
    `<td>${analyzedStocks.tips.losers.silver_medals['1d'].symbol}</td>` +
    `<td>${analyzedStocks.tips.losers.silver_medals['1d'].value}%</td>` +
    '</tr>' +
    '<tr>' +
    `<td>5d</td>` +
    `<td>${analyzedStocks.tips.losers.silver_medals['5d'].symbol}</td>` +
    `<td>${analyzedStocks.tips.losers.silver_medals['5d'].value}%</td>` +
    '</tr>' +
    `<tr bgcolor='#B9EDB9'>` +
    `<td>1m</td>` +
    `<td>${analyzedStocks.tips.losers.silver_medals['1m'].symbol}</td>` +
    `<td>${analyzedStocks.tips.losers.silver_medals['1m'].value}%</td>` +
    '</tr>' +
    '</table>' +
    '<br/>' +
    '</div>' +
    '<br/>' +
    '<hr/>'

  const emailHeader = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">` +
    '<div style="background:rgb(255,255,255);max-width:600px;width:100%;margin:0px auto; text-align: center;">' +
    '<br/>' +
    '<h1>Triple Gainers</h1>' +
    '<p>The highest percentage changed stocks for the past day, week, and month.</p>' +
    '<br/>' +
    `This is the report for <i><b>Large Cap US stocks,</b></i> calculated after market close on ${analyzedStocks['date_scraped']}.` +
    '<br/>' +
    '<br/>' +
    '🤖' +
    '<br/>' +
    '<br/>' +
    '<p>Have friends who want to receive the daily Triple Gainers report? <a href="https://cdn.forms-content.sg-form.com/f034a73f-a80f-11ea-8e17-928c85d443c0">Sign up here</a>!</p>' +
    '<br/>' +
    '<hr/>' +
    '<br/>'

  const tipsSection = highVolumeTipsSection + relativeStrengthTipsSection + goldMedalsSection + silverMedalsSection

  const gainersTable = '<br/><h2>All Triple Gainers & Losers Data</h2>' +
    '<h3>Gainers:</h3>' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black;">' +
    '<tr>' +
    tableHeaders() +
    '</tr>' +
    largeCapGainersTableRows +
    '</table>' +
    '<br/>'

  const losersTable = '<h3>Losers:</h3>\n' +
    '<table border="1" cellspacing="0" padding="5" style="border: 1px solid black;">' +
    '<tr>' +
    tableHeaders() +
    '</tr>' +
    largeCapLosersTableRows +
    '</table>' +
    '<br/>' +
    '<br/>' +
    '<br/>'

  const emailFooter = '</<p>&nbsp;</p>' +
    `<p>That's all for now!</p><p>If you have any questions just reply to this email, and we'll get back to you soon.</p>` +
    '<p>May the gains be with you! 💪</p><br/>' +
    '<p>Disclaimer: any information here may be incorrect. Invest at your own risk!</p>' +
    '<p>Shoutout to <a href="https://www.barchart.com/">barchart.com</a> for generously providing the data for this report!</p>' +
    '<br/>' +
    '<br/>' +
    '<div>' +
    '<a href="<%asm_group_unsubscribe_raw_url%>">Unsubscribe</a> | <a href="<%asm_preferences_raw_url%>">Manage Email Preferences</a>' +
    '</div>' +
    '</div>'

  const fullTextEmail = emailHeader + tipsSection + gainersTable + losersTable + emailFooter

  const shortenedTextMobile = `Hey there! 🤖\n` +
    `Triple Gainers stats for ${analyzedStocks['date_scraped']}:\n` +
    `Gainers: ${numberOfGainers}\n` +
    `Losers: ${numberOfLosers}\n\n` +
    `May the gains be with you. 💪`

  if (JSON.parse(process.env.DISABLE_ALL_MESSAGE_SENDING)) {
    logger.info('All message sending has been disabled by the env variable, DISABLE_ALL_MESSAGE_SENDING: ', process.env.DISABLE_ALL_MESSAGE_SENDING)
  } else {

    const sgTgTrueRecipients = await getSendgridTripleGainersEmailRecipients(process.env.TG_SG_EMAIL_SUBSCRIBERS_LIST_ID)

    logger.info(`sendgrid recipients: ${JSON.stringify(sgTgTrueRecipients)}`)

    logger.info(`PROD is (${process.env.PROD === 'true' ? 'true' : 'false'}) - ${process.env.PROD !== 'true' ? 'NOT' : ''} sending to real recipients...`)

    sgRecipients = process.env.PROD === 'true' ? sgTgTrueRecipients : ['mrdotjim@gmail.com']

    sgRecipients.forEach((recipient, i) => {

      sg.setApiKey(process.env.SENDGRID_KEY);
      const msg = {
        to: recipient,
        from: process.env.SG_FROM_EMAIL,
        // text: fullTextEmail,
        html: fullTextEmail,
        subject: `Triple Gainers Report! - ${analyzedStocks['date_scraped']}`,
        asm: {
          group_id: +process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID
        }
      };

      const millisecondSeparator = 1000

      const waitTime = millisecondSeparator * i

      setTimeout(() => {
        sg.send(msg).then((resp) => {
          logger.info(`Mail has been sent to ${recipient}!`,
            { ...msg, html: '[hidden]' })

          if (i === (sgRecipients.length - 1)) {
            logger.info('\n\nThe notifications have been sent! 🥳\n')
            process.exit(0)
          }

        }).catch(err => {
          logge.info('error sending to recipient ', err)
        });

      }, waitTime)
    })
  }
}

main().catch(err => {

  logger.info('Error in the tg notifier! ', err)

})

const buildRowFromMongoData = (analyzedStocks, gainersOrLosers) => {

  return analyzedStocks.results['large_cap_us'][gainersOrLosers]
    .sort(sortByBcOpinion)
    .map(gainerObj => {

      let tr

      if (colorNextRow) {
        tr = `<tr bgcolor='#B9EDB9'>`
        colorNextRow = false
      } else {
        tr = `<tr>`
        colorNextRow = true
      }

      return tr +
        '<td style="min-width:70px">' +
        gainerObj.Symbol +
        '</td>' +
        // '<td>' +
        // gainerObj['tg_weighted_change_%'] +
        // '</td>' +
        '<td>' +
        gainerObj['1d_change_%'].slice(0, -2) +
        '</td>' +
        '<td>' +
        gainerObj['5d_change_%'].slice(0, -2) +
        '</td>' +
        '<td>' +
        gainerObj['1m_change_%'].slice(0, -2) +
        '</td>' +
        '<td style="min-width:75px">' +
        gainerObj['20d_rsi: '].slice(0, -2) +
        '</td>' +
        '<td style="min-width:100px">' +
        gainerObj['1D Volm / 20D Volm: '] +
        '</td>' +
        '<td style="min-width:80px">' +
        gainerObj['BC_Opinion'] +
        '</td>' +
        '</tr>'
    })
    .join('')
}


const getLowRelStrTipsRows = (gainersRelStrBands, losersRelStrBands) => {

  const lowRelStrTips = [
    ...gainersRelStrBands['0-10'],
    ...gainersRelStrBands['10-20'],
    ...gainersRelStrBands['20-30'],
    ...gainersRelStrBands['30-40'],
    ...losersRelStrBands['0-10'],
    ...losersRelStrBands['10-20'],
    ...losersRelStrBands['20-30'],
    ...losersRelStrBands['30-40'],
  ]
    .sort((a, b) => +(a.value) - +(b.value))

  return lowRelStrTips.map((tip, index) => {

    const tr = (index % 2 === 1) ? '<tr>' : `<tr bgcolor='#B9EDB9'>`

    return tr +
      `<td>${tip.symbol}</td>` +
      `<td>${tip.value}</td>` +
      '</tr>'
  }).reduce((acc, str) => acc + str, '')

}

const getHighRelStrTipsRows = (gainersRelStrBands, losersRelStrBands) => {

  const highRelStrTips = [
    ...gainersRelStrBands['90-100'],
    ...gainersRelStrBands['80-90'],
    ...gainersRelStrBands['70-80'],
    ...gainersRelStrBands['60-70'],
    ...losersRelStrBands['90-100'],
    ...losersRelStrBands['80-90'],
    ...losersRelStrBands['70-80'],
    ...losersRelStrBands['60-70'],
  ]
    .sort((a, b) => +(b.value) - +(a.value))

  return highRelStrTips.map((tip, index) => {

    const tr = (index % 2 === 1) ? '<tr>' : `<tr bgcolor='#B9EDB9'>`

    return tr +
      `<td>${tip.symbol}</td>` +
      `<td>${tip.value}</td>` +
      '</tr>'
  }).reduce((acc, str) => acc + str, '')

}

const tableHeaders = () => {

  return '<th><h4>Symbol</h4></th>' +
    // '<th><h4>TG % Change</h4></th>' +
    '<th><h4>1 Day % Change</h4></th>' +
    '<th><h4>5 Day % Change</h4></th>' +
    '<th><h4>30 Day % Change</h4></th>' +
    '<th><h4>20 Day<br/>Relative<br/>Strength</h4></th>' +
    '<th><h4>Volume<br/>1 Day / 20 Day</h4></th>' +
    '<th><h4>Analyst Opinion</h4></th>'
}

const getVolumeTipsRows = (volmRatiosObj) => {

  const volumeTips = [
    ...volmRatiosObj['+4'],
    ...volmRatiosObj['+3_5-4'],
    ...volmRatiosObj['+3-3_5'],
    ...volmRatiosObj['+2_5-3'],
    ...volmRatiosObj['+2-2_5']
  ]
    .sort((a, b) => +(b.value) - +(a.value))

  return volumeTips.map((tip, index) => {

    const tr = (index % 2 === 1) ? '<tr>' : `<tr bgcolor='#B9EDB9'>`

    return tr +
      `<td>${tip.symbol}</td>` +
      `<td>${tip.value}</td>` +
      '</tr>'
  }).reduce((acc, str) => acc + str, '')

}