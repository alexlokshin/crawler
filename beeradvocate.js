const cheerio = require('cheerio')
const request = require('request')

function findBrewery(name, cb){
    request('https://www.beeradvocate.com/search/?q='+encodeURIComponent(name)+'&qt=place', function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var results = parseSearchResults(html)
            cb(null, results)
        } else {
            cb(error, null)
        }
    })
}

function parseSearchResults(html){
    var $ = cheerio.load(html)
    var data = $('#ba-content > div > ul')
    var response = []
    var children = data.children()
    for (var i = 0; i < children.length; i++) {
        var elem = children.get(i)
        var link = $(elem).find('a').attr('href')
        var name = $(elem).find('a').text()
        var location = $(elem).find('span').text()
        response.push({link: link, name: name, location: location})
    }
    return response
}

module.exports.findBrewery = findBrewery
