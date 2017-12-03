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
			var cityBlock = false
			var children = data.children()
			var response = []
			for (var i = 0; i < children.length; i++) {

				var elem = children.get(i)

				if ("h3" == elem.tagName) {
					cityBlock = true
				}
				else if (cityBlock) {
					if ($(elem).children().length > 0 && "em" == $(elem).children().get(0).tagName) {
						break
					}

					var link = $(elem).find('a').attr('href')
					var brewery = $(elem).find('a').text().trim()
					var addressLines = []

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
					var emailAddress = ''
					for (var a = 0; a < addressLines.length; a++) {
						if (a == addressLines.length - 1) {
							var pn = new PhoneNumber(addressLines[a], 'US');
							if (pn.isValid()) {
								phoneNumber = addressLines[a]
							}
						}


						if (phoneNumber.length == 0 && emailAddress.length == 0) {
							if (address.length > 0)
								address += ', '
							address += addressLines[a]
						}
					}

					if (address.length > 0 && brewery.length > 0) {
						var parsedAddress = parser.parseLocation(address)
						response.push({
							brewery: brewery,
							link: link,
							phoneNumber: phoneNumber,
							rawAddress: address,
							address: parsedAddress
						})
					}
				}
				else if ("div" == elem.tagName) {
					break
				}
			}

			res.send({ Status: 'OK', Data: response })
		} else {
			console.log('Cannot load: ', error)
			res.send({ Status: 'Error' })
		}
	})
})

var server = app.listen(3000, () => {
	var port = server.address().port;
	console.log('Started the server on port %s.', port)
})
module.exports = server
