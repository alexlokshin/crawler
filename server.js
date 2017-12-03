const express = require('express')
const app = express()
const cheerio = require('cheerio')
const request = require('request')
const parser = require('parse-address')
const PhoneNumber = require('awesome-phonenumber')

app.get('/', (req, res) => res.send({ Status: 'OK' }))

// Dynamically crawls http://beerinflorida.com/florida-brewery-map-list-beer/
app.get('/breweries', (req, res) => {
	request('http://beerinflorida.com/florida-brewery-map-list-beer/', function (error, response, html) {
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(html)
			var data = $('#post-2369 > div.entry-content')
			console.log(data.length)
			var cityBlock = false
			var children = data.children()
			for (var i = 0; i < children.length; i++) {

				var elem = children.get(i)

				if ("h3" == elem.tagName) {
					cityBlock = true
					console.log('')
					console.log($(elem).text().trim())
					console.log('---------')
				}
				else if (cityBlock) {
					if ($(elem).children().length > 0 && "em" == $(elem).children().get(0).tagName) {
						break
					}

					var link = $(elem).find('a').attr('href')
					var brewery = $(elem).find('a').text()
					if (link) {
						console.log(link.trim())
					}
					console.log('*', brewery.trim())
					var addressLines = []
					var phone = ''
					for (var t = 0; t < elem.childNodes.length; t++) {
						var line = $(elem.childNodes[t]).text().trim()
						if ("a" == elem.childNodes[t].name) {
						} else if ("br" == elem.childNodes[t].name) {
						} else if (line.length > 0) {
							addressLines.push(line)
						}
					}

					var address = ''
					var phoneNumber = ''
					for (var a = 0; a < addressLines.length; a++) {
						if (a < addressLines.length - 1) {
							if (address.length > 0)
								address += ', '
							address += addressLines[a]
						} else
							phoneNumber = addressLines[a]
					}

					var parsed = parser.parseLocation(address)
					console.log('->', address)
					console.log(JSON.stringify(parsed))
					console.log('->', phoneNumber)
				}
				else if ("div" == elem.tagName) {
					break
				}
			}

			res.send({ Data: 'OK' })
		} else {
			console.log('Cannot load: ', error)
		}
	})
})

var server = app.listen(3000, () => {
	var port = server.address().port;
	console.log('Started the server on port %s.', port)
})
module.exports = server
