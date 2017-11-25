const express = require('express')
const app = express()

app.get('/', (req, res) => res.send({Status: 'OK'}))

app.listen(3000, () => console.log('Started the server on port 3000.'))
