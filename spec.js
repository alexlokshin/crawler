var request = require('supertest')
var assert = require('assert')
var beerAdvocateApi = require('./beeradvocate')

describe('loading express', function () {
  var server;
  beforeEach(function () {
    server = require('./server')
  })
  afterEach(function () {
    server.close()
  })
  it('responds to /health', function testSlash(done) {
    request(server)
      .get('/health')
      .expect(200, done)
      .expect('Content-Type', /json/)
  })
  it('responds to /breweries', function testSlash(done) {
    request(server)
      .get('/breweries/')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(function (res) {
        assert(res.body.Data.length > 0)
        for (var b in res.body.Data) {
          if (!res.body.Data[b].zip)
            console.log(res.body.Data[b].brewery, 'missing a zip')
          //assert(res.body.Data[b].zip)
        }
      })
      .end(done)
  })
  it('404 everything else', function testPath(done) {
    request(server)
      .get('/unexpected')
      .expect(404, done)
  })
  it('BA API Works', function (done) {
    beerAdvocateApi.findBrewery('due south', function(err, results){
      if (err) 
        done(err)
      else{
        assert(results.length>0)
        assert(results[0].link.length>0)
        assert.equal(results[0].location.toLowerCase(), 'boynton beach, florida')
        done()
      }
    })
  })
})
