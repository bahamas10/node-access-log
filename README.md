access-log
==========

Add simple access logs to any http or https server

Usage
-----

``` js
var http = require('http');
var accesslog = require('access-log');

http.createServer(function(req, res) {
  accesslog(req, res);
  res.end();
}).listen(80, '0.0.0.0');
```

This will automatically log requests as they come in to the
web server that look like...

```
127.0.0.1 GET 200 /testing (0ms)
127.0.0.1 GET 200 /index.html (0ms)
127.0.0.1 GET 200 /projects (0ms)
```

Customization
-------------

### accesslog(req, res, [format], [function])

#### format

You can pass in a format string, the default is

```
:ip :method :statusCode :url (:deltams)
```

- `:method` - The request method (POST|HEAD|GET|DELETE|PUT, etc.)
- `:statusCode` - The response status code sent from the server
- `:url` - The requested URL
- `:delta` - The latency from request to response in ms
- `:ip` - The remote IP

#### function

You can also pass in your own custom callback, the default is console.log.
The only argument passed is the access log string

Example
-------

``` js
var format = 'url=":url" method=":method" statusCode=":statusCode" delta=":delta" ip=":ip"';

accesslog(req, res, format, function(s) {
  console.log(s);
});
```

yields

```
url="/projects" method="GET" statusCode="200" delta="0" ip="127.0.0.1"
url="/testing" method="GET" statusCode="200" delta="1" ip="127.0.0.1"
url="/index.html" method="GET" statusCode="200" delta="0" ip="127.0.0.1"
```

Installation
------------

    npm install access-log

Extend
------

Consider further customizing the access logs by using the [log-timestamp]
(https://github.com/bahamas10/node-log-timestamp) module to prepend a timestamp
automatically.

License
-------

MIT Licensed
