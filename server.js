const express = require('express')
const app = express()

app.get('/', (req, res) => res.send({Status: 'OK'}))

var server = app.listen(3000, () => {
		var port = server.address().port;
		console.log('Started the server on port %s.', port)
	})
module.exports = server
