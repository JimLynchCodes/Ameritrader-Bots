const twit = require('twit');

const MILLISECOND_IN_ONE_DAY = 48 * 3600 * 1000

let Twitter

/**
 *  Takes a space separated string of keywords and returns tweets tweeted within the past 24 hours containing the given keywords.
 * 
 * @param {string} keywords 
 * @param {boolean} isExactMatch 
 * @param {boolean} isCaseSensitive 
 * 
 * @returns {Arary<tweets>}
 */
const getTweets = async (keywords, isExactMatch) => {

    return new Promise(async resolve => {

        console.log('Given keywords: ', keywords)

        // All valid params: https://developer.twitter.com/en/docs/tweets/search/api-reference/get-search-tweets
        // Valid search operators within query string: https://developer.twitter.com/en/docs/tweets/search/guides/standard-operators

        // Note: by default, tweet search is NOT case sensitive.
        let query = keywords

        if (isExactMatch)
            query = '"' + keywords + '"'

        const oneDayAgo = new Date(Date.now() - 2 * MILLISECOND_IN_ONE_DAY)

        // For twitter, query date must be in the form YYYY-MM-DD
        const oneDayAgoFormatted = oneDayAgo.getFullYear() + '-' + (oneDayAgo.getMonth() + 1) + '-' + oneDayAgo.getDate()

        query = query + ' since:' + oneDayAgoFormatted

        console.log('full query: ', query)

        const params = {
            q: query,
            result_type: 'recent',
            lang: 'en',
            count: 100,
            include_entities: false
        }

        Twitter.get('search/tweets', params, function (err, data) {

            if (err)
                throw new Error(err)

            // console.log('raw data', data)

            const importantData = data.statuses.map(tweet => {
                return {
                    tweet: {
                        body: tweet.text,
                        time_tweeted: tweet.created_at,
                        url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
                        geo: tweet.geo,
                        coordinates: tweet.coordinates,
                        favorite_count: tweet.favorite_count,
                        retweet_count: tweet.retweet_count,
                        id: tweet.id_str
                    },
                    user: {
                        screen_name: '@' + tweet.user.screen_name,
                        bio: tweet.user.description,
                        location: tweet.user.location
                    }
                }
            })

            resolve(importantData)

        })

    })

}

const initializeTwitter = async () => {

    return new Promise(resolve => {

        config = {
            consumer_key: process.env.CONSUMER_KEY,
            consumer_secret: process.env.CONSUMER_SECRET,
            access_token: process.env.ACCESS_TOKEN,
            access_token_secret: process.env.ACCESS_TOKEN_SECRET,
        }

        Twitter = new twit(config);

        Twitter.get('account/verify_credentials', (err, data) => {

            if (err)
                throw new Error(err)

            console.log('Twitter has been initialized!')

            resolve()

        })

    })

}

module.exports = {
    getTweets,
    initializeTwitter
}