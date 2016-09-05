var restify = require('restify');
var stormpathRestify = require('stormpath-restify');
var stormpathFilters = stormpathRestify.createFilterSet();

var oauthFilter = stormpathFilters.createOauthFilter();

var host = process.env.HOST || '127.0.0.1';
var port = process.env.PORT || '8080'

var thingDatabse = require('./things-db');

var db = thingDatabse({
  baseHref: 'http://' + host + (port ? (':' + port) : '') + '/things/'
});

var server = restify.createServer({
  name: 'Things API Server'
});

server.use(restify.queryParser());
server.use(restify.bodyParser());

server.use(function logger(req, res, next) {
  console.log(new Date(), req.method, req.url);
  next();
});

server.post('/oauth/token', oauthFilter);

server.on('uncaughtException',function(request, response, route, error) {
  console.error(error.stack);
  response.send(error);
});

server.get('/things', function(req, res) {
  res.json(db.all());
});

server.get('/things/:id', function(req, res, next) {
  var id = req.params.id;
  var thing = db.getThingById(id);
  if (!thing) {
    next(new restify.errors.ResourceNotFoundError());
  } else {
    res.json(thing);
  }
});

server.listen(port, host, function() {
  console.log('%s listening at %s', server.name, server.url);
});

server.post('/things', [oauthFilter, function (req, res) {
  res.json(db.createThing(req.body));
}]);
