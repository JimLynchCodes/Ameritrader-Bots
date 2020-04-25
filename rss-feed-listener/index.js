const RssFeedEmitter = require('rss-feed-emitter');
const feeder = new RssFeedEmitter({ skipFirstLoad: true });

feeder.add({
    url: 'http://www.nintendolife.com/feeds/news',
    refresh: 2000
});


feeder.on('new-item', function (item) {
    console.log(item);
})

console.log('Feed watcher bot is listening... ')