const express = require('express')
const app = express()
const cheerio = require('cheerio')
const request = require('request')
const parser = require('parse-address')
const PhoneNumber = require('awesome-phonenumber')
const emailValidator = require("email-validator");
const NodeCache = require("node-cache")
const mcache = new NodeCache({ stdTTL: 36000, checkperiod: 18000 })
const KubeApi = require('kubernetes-client')
let coreClient = null
let kubeConfig = null

try {
	kubeConfig = KubeApi.config.getInCluster()
	coreClient = new KubeApi.Core(kubeConfig)
} catch (err) {
	console.log('Cannot instantiate core client: ', err.toString())
}

app.get('/', (req, res) => res.send({ Status: 'OK' }))

app.get('/k8s/health', (req, res) => {
    if (!coreClient	) {
        res.send({ Status: 'Error', error: 'No k8s context available.' })
    } else {
        coreClient.nodes.get((err, data) => {
            if (err) {
                console.log('Error:', err)
                res.send({ Status: 'Error', error: err.toString() })
            } else {
                var healthy = true
                var unhealthyNodes = []
                var error = ''
                var nodes = []

                try{
                    if (data && data.items) {
                        data.items.forEach(function (item) {
                            if (item && item.spec && item.status) {
                                var conditions = []
                                item.status.conditions.forEach(function(condition){
                                    if ("Ready"==condition.type){
                                        if ("True"!=condition.status){
                                            unhealthyNodes.push(item.spec.externalID)
                                            healthy = false
                                        }
                                    }
                                    conditions.push({Type: condition.type, Status: condition.status})
                                })
                                nodes.push({ID: item.spec.externalID, Conditions: conditions})
                            }
                        })
                    }
                } catch(err){
                    error = err.toString()
                }
                
                res.status(healthy?200:500).send({ Healthy: healthy, Nodes: nodes, UnhealthyNodes: unhealthyNodes, Error: error })
            }
        })
    }
})

app.get('/k8s/deployments/list', (req, res) => {
    if (!kubeConfig) {
        res.send({ Status: 'Error', error: 'No k8s context available.' })
    } else {
        var extClient = new KubeApi.Extensions(kubeConfig)
        var namespace = 'default'
        if (req.query.ns && req.query.ns.trim().length > 0) {
            namespace = req.query.ns.trim()
        }
        extClient.namespaces(namespace).deployments.get((err, data) => {
            if (err) {
                console.log('Error:', err)
                res.send({ Status: 'Error', error: err.toString() })
            } else {
                var list = []
                if (data && data.items) {
                    data.items.forEach(function (item) {
                        if (item && item.metadata) {
                            list.push(item.metadata.name)
                        }
                    })
                }
                res.send({ Status: 'OK', deployments: list })
            }
        })
    }
})

app.get('/k8s/events', (req, res) => {
	if (!coreClient) {
		res.send({ Status: 'Error', error: 'Core client not created' })
	} else {
		var namespace = 'default'
		if (req.query.ns && req.query.ns.trim().length > 0) {
			namespace = req.query.ns.trim()
		}
		coreClient.events.get((err, data) => {
			if (err) {
				console.log('Error:', err)
				res.send({ Status: 'Error', error: err.toString() })
			} else {
				res.send({ Status: 'OK',  data: data })
			}
		})
	}
})

app.get('/k8s/ns/list', (req, res) => {
	if (!coreClient) {
		res.send({ Status: 'Error', error: 'Core client not created' })
	} else {
		coreClient.namespaces.get((err, data) => {
			if (err) {
				console.log('Error:', err)
				res.send({ Status: 'Error', error: err.toString() })
			} else {
				var list = []
				if (data && data.items) {
					data.items.forEach(function (item) {
						if (item && item.metadata) {
							list.push(item.metadata.name)
						}
					})
				}
				res.send({ Status: 'OK', namespaces: list, data: data })
			}
		})
	}
})

app.get('/k8s/pods/list', (req, res) => {
	if (!coreClient) {
		res.send({ Status: 'Error', error: 'Core client not created' })
	} else {
		var namespace = 'default'
		if (req.query.ns && req.query.ns.trim().length > 0) {
			namespace = req.query.ns.trim()
		}
		var deployment = ''
		if (req.query.deployment && req.query.deployment.trim().length > 0) {
			deployment = req.query.deployment.trim()
		}
		coreClient.namespaces(namespace).pods.get((err, data) => {
			if (err) {
				console.log('Error:', err)
				res.send({ Status: 'Error', error: err.toString() })
			} else {
				var list = []
				if (data && data.items) {
					data.items.forEach(function (item) {
						if (item && item.metadata) {
							if (item.metadata.name.indexOf(deployment+'-')==0){
								list.push({name: item.metadata.name, status: item.status})
							}
						}
					})
				}
				res.send({ Status: 'OK', pods: list, data: data })
			}
		})
	}
})

app.get('/k8s/pod/log', (req, res) => {
	if (!coreClient) {
		res.send({ Status: 'Error', error: 'Core client not created' })
	} else {
		var namespace = 'default'
		if (req.query.ns && req.query.ns.trim().length > 0) {
			namespace = req.query.ns.trim()
		}
		var pod = ''
		if (req.query.pod && req.query.pod.trim().length > 0) {
			pod = req.query.pod.trim()
		}

		coreClient.namespaces(namespace).pods(pod).log.get((err, data) => {
			if (err) {
				console.log('Error:', err)
				res.send({ Status: 'Error', error: err.toString() })
			} else {
				res.send({ Status: 'OK', log: data.split(/\r?\n/) })
			}
		})
	}
})

// Dynamically crawls http://beerinflorida.com/florida-brewery-map-list-beer/
app.get('/breweries/', (req, res) => {
	var cachedResponse = mcache.get('breweries')
	if (cachedResponse) {
		res.send({ Status: 'OK', Data: cachedResponse })
	}
	else {
		request('http://beerinflorida.com/florida-brewery-map-list-beer/', function (error, response, html) {
			if (!error && response.statusCode == 200) {
				var response = parseBreweries(html)
				mcache.set('breweries', response, 3600 * 1000);
				res.send({ Status: 'OK', Data: response })
			} else {
				console.log('Cannot load: ', error)
				res.send({ Status: 'Error' })
			}
		})
	}
})

var server = app.listen(3000, () => {
	var port = server.address().port;
	console.log('Started the server on port %s.', port)
})


function parseBreweries(html) {
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

			var linkElement = $(elem).find('a')
			var link = linkElement.attr('href')
			var brewery = linkElement.text().trim()
			var addressLines = []
			linkElement.remove()

			var childNodes = elem.childNodes
			for (var t = 0; t < childNodes.length; t++) {
				if ("p" == childNodes[t].name) {
					childNodes = childNodes[t].childNodes
					break
				}
			}

			var newLine = true
			for (var t = 0; t < childNodes.length; t++) {
				var line = $(childNodes[t]).text().trim()
				if ("a" == childNodes[t].name) {
				} else if ("br" == childNodes[t].name) {
				} else if ("sup" == childNodes[t].name) {
					if (addressLines.length > 0) {
						addressLines[addressLines.length - 1] = addressLines[addressLines.length - 1] + line
						newLine = false
					}
				} else if (line.length > 0) {
					if (line.indexOf('at ') != 0 && line.indexOf('(') != 0 && line != '*') {
						if (newLine)
							addressLines.push(line)
						else
							addressLines[addressLines.length - 1] = addressLines[addressLines.length - 1] + line
					}
					newLine = true
				}
			}

			var address = ''
			var phoneNumber = ''
			var emailAddress = ''
			for (var a = 0; a < addressLines.length; a++) {
				if (a == addressLines.length - 1) {
					var textLine = addressLines[a].replace('\n', '').trim()
					var pn = new PhoneNumber(textLine, 'US');
					if (pn.isValid()) {
						phoneNumber = textLine.replace('\\', '').replace().trim()
					} else {
						if (emailValidator.validate(textLine)) {
							emailAddress = textLine
						}
					}
				}
				if (phoneNumber.length == 0 && emailAddress.length == 0) {
					if (address.length > 0)
						address += ', '
					address += addressLines[a].replace('\n', ', ').replace('No. ', '#')
				}
			}

			if (address.length > 0 && brewery.length > 0) {
				if ('*' == brewery.charAt(0))
					brewery = brewery.substring(1, brewery.length - 1).trim()
				brewery = brewery.replace(' (temporary)', '').trim()
				brewery = brewery.replace(' (secon', '').trim()

				var parsedAddress = parser.parseLocation(address)
				response.push({
					brewery: brewery,
					link: link,
					phoneNumber: phoneNumber,
					rawAddress: address,
					zip: parsedAddress ? parsedAddress.zip : ''
				})
			}
		}
		else if ("div" == elem.tagName) {
			break
		}
	}
	return response
}

module.exports = server
