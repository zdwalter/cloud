
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var URL = require('url');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Functions
function get_argument(req, property, default_value) {
    if (req.query != undefined && req.query[property] != undefined) {
        return req.query[property];
    }
    if (req.body != undefined && req.body[property] != undefined) {
        return req.body[property];
    }
    return default_value;
};

// handler
function error(res, msg) {
    console.log(msg);
    return res.render('error', {
        layout: false,
        message: msg
    });
}

function home(req, res) {
  res.render('index', {
    title: 'Cloud Service'
  });
};

function redirect(req, res) {
    var self = this;
    self.req = req;
    self.res = res;
    self.data = null;

    console.log(req.cookies);
    var url = get_argument(req, 'url', null);
    if ( !url ) 
        return error(res, 'miss param [url]');
    console.log(url);
    url = URL.parse(url); //TODO: parseQueryString?
    console.log(url);
    if (url.host == undefined)
        return error(self.res, 'url format parse error');
    if (url.port == undefined)
        url.port = 80;
    if (url.search == undefined)
        url.search = "";
    
    var method = get_argument(req, 'method', 'get');
    var options = {
            host: url.host,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                cookie: req.cookies,
            },
            method: method
        };
    console.log(options);
    var http_req = http.request( 
        options,
        http_request);
    http_req.end();
    return;

    function http_request(res) {
        console.log('status:' + res.statusCode);
        console.log('headers:' + JSON.stringify(res.headers));
        console.log('cookie:' + res.headers['set-cookie']);
        var cookies = res.headers['set-cookie'];
        res.on('data', function(chunk) {
            // speed up!
            //if (!self.data)
            //    self.data = chunk;
            //else
            //    self.data += chunk;
        });
        res.on('error', function(e) {
            return error(self.res, e.message);
        });
        res.on('end', function() {
            self.res.setHeader('Set-Cookie', cookies);
            self.statusCode = 200; // don't want to auto redirect by ajax with res.statusCode;
            return self.res.end(self.data);
        });
    };
};


// Routes

app.get('/', home);
app.get('/redirect', redirect);

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(80);
  console.log("Express server listening on port %d", app.address().port);
}
