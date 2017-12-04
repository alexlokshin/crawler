var request = require('supertest')
var assert = require('assert')

describe('loading express', function () {
  var server;
  beforeEach(function () {
    server = require('./server')
  })
  afterEach(function () {
    server.close()
  })
  it('responds to /', function testSlash(done) {
    request(server)
      .get('/')
      .expect(200, done)
      .expect('Content-Type', /json/)
  })
  it('responds to /breweries', function testSlash(done) {
    request(server)
      .get('/breweries/')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(function(res){
        assert(res.body.Data.length>0)  
      })
      .end(done)
  })
  it('404 everything else', function testPath(done) {
    request(server)
      .get('/unexpected')
      .expect(404, done)
  })
})
