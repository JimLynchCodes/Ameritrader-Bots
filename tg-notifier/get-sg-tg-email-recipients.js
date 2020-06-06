

const getSendgridTripleGainersEmailRecipients = listId => {

  return new Promise(async resolve => {

    const client = require('@sendgrid/client');
    client.setApiKey(process.env.SENDGRID_API_KEY);
    const request = {
      method: 'GET',
      url: '/v3/marketing/contacts'
    };

    await client.request(request)
      .then(data => {

        const emailAddressesForTgSubscribers = data[0].body.result
          .filter(userObj => {
            return userObj.list_ids.includes(listId)
          })
          .map(userObj => {
            return userObj.email
          })

        resolve(emailAddressesForTgSubscribers)

      })

  })

}

module.exports = getSendgridTripleGainersEmailRecipients