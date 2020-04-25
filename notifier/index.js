
require('dotenv').config()

console.log('we\'re doin\' it! ', process.env.AWS_ACCESS_KEY_ID)

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set region
AWS.config.update({region: 'us-east-1'});

// Create publish parameters
var params = {
  Message: 'MESSAGE_TEXT', /* required */
  TopicArn: 'arn:aws:sns:us-east-1:954459734159:Cronjob-Errors'
};

// Create promise and SNS service object
var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

// Handle promise's fulfilled/rejected states
publishTextPromise.then(
  function(data) {
    console.log(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
    console.log("MessageID is " + data.MessageId);
  }).catch(
    function(err) {
    console.error(err, err.stack);
  });