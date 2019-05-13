var strftime = require('strftime');

var defaultformat = ':ip - :userID [:clfDate] ":method :url :protocol/:httpVersion" :statusCode :contentLength ":referer" ":userAgent"';

module.exports = accesslog;

function accesslog(req, res, format, cb) {
  if (typeof format === 'function') {
    cb = format;
    format = null;
  }

  var remoteAddress = req.connection.remoteAddress;
  var contentLength, options = {};
  if (typeof format === 'object') {
    options = format;
    format = options.format;
  }
  format = format || defaultformat;
  cb = cb || console.log.bind(console);

  var uriDecoded;
  try {
    uriDecoded = decodeURIComponent(req.url);
  } catch (e) {
    uriDecoded = e.message || 'error decoding URI';
  }

  var start = new Date();

  // override res.writeHead to track contentLength
  var resWriteHead = res.writeHead.bind(res);
  res.writeHead = function(statusCode, reason, headers) {
    var ret = resWriteHead.apply(res, arguments);

    if (typeof reason === 'object' && !headers) {
      headers = reason;
      reason = null;
    }

    if (headers) {
      Object.keys(headers).forEach(function(key) {
        if (key.toLowerCase() === 'content-length')
          contentLength = headers[key];
      });
    }

    return ret;
  };

  // override res.end to capture all responses
  var resend = res.end.bind(res);
  res.end = function() {
    // call the original
    var ret = resend.apply(res, arguments);

    var end = new Date();
    var delta = end - start;
    var userID;
    try {
      userID = (options.userID || basiAuthUserID)(req);
    } catch(e) {}
    var data = {
      ':clfDate': strftime('%d/%b/%Y:%H:%M:%S %z', end),
      ':contentLength': res.getHeader('content-length') || contentLength || '-',
      ':delta': delta,
      ':endDate': end.toISOString(),
      ':endTime': end.getTime(),
      ':host': encode(req.headers.host || '-'),
      ':httpVersion': req.httpVersion,
      ':ip': remoteAddress || '-',
      ':Xfip': encode(req.headers['x-forwarded-ip'] || '-'),
      ':Xip': encode(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || remoteAddress || '-'),
      ':method': req.method,
      ':protocol': req.connection.encrypted ? 'HTTPS' : 'HTTP',
      ':referer': encode(req.headers.referer || '-'),
      ':startDate': start.toISOString(),
      ':startTime': start.getTime(),
      ':statusCode': res.statusCode,
      ':url': encode(req.url),
      ':urlDecoded': encode(uriDecoded),
      ':userID': encode(userID || '-'),
      ':userAgent': encode(req.headers['user-agent'] || '-')
    };

    cb(template(format, data));

    return ret;
  };
}

function basiAuthUserID(req) {
  return new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString().split(':')[0];
}

// replace :variable and :{variable} in `s` with what's in `d`
function template(s, d) {
  s = s.replace(/(:[a-zA-Z]+)/g, function(match, key) {
    return d[key] || '';
  });
  return s.replace(/:{([a-zA-Z]+)}/g, function(match, key) {
    return d[':' + key] || '';
  });
}

// make a string safe to put in double quotes in CLF
function encode(s) {
  return s.replace(/\\/g, '\\x5C').replace(/"/, '\\x22');
}
