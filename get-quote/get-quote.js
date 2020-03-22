require('dotenv').config()
const axios = require('axios');

const getQuotesEndpoint = 'https://api.tdameritrade.com/v1/marketdata'

const commandLinArgs = process.argv.slice(2)

const symbolArg = commandLinArgs[0]

const getQuote = async () => {

    console.log('\n\nGetting quotes...\n\n')

    console.log('key: ', process.env.key)

    try {

        const response = await axios.get(
            `${getQuotesEndpoint}/${symbolArg}/quotes`,
            {
                params: {
                    'apikey': process.env.key
                }
            }
        )

        console.log('Quote: ', response)

    }

    catch (err) {

        console.log('Oh no! An Error happened: ', err)

    }

}

if (symbolArg)
    getQuote()

else {
    console.log('Please pass a symbol to this script in all caps!')
}

