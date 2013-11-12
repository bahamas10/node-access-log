var strftime = require('strftime');

var defaultformat = ':ip - :userID [:clfDate] ":method :url HTTP/:httpVersion" :statusCode :contentLength ":referer" ":userAgent"';

module.exports = accesslog;

function accesslog(req, res, format, cb) {
  if (typeof format === 'function') {
    cb = format;
    format = null;
  }

  format = format || defaultformat;
  cb = cb || console.log.bind(console);

  var uriDecoded;
  try {
    uriDecoded = decodeURIComponent(req.url);
  } catch (e) {
    uriDecoded = e.message || 'Error decoding URI';
  }

  var start = new Date();

  // override res.writeHead to track contentLength
  var resWriteHead = res.writeHead.bind(res);
  res.writeHead = function(statusCode, reason, headers) {
    resWriteHead.apply(res, arguments);

    if (typeof reason === "object" && !headers) {
      headers = reason;
      reason = null;
    }

    if (headers) {
      for (var k in headers) {
        if (k.toLowerCase() == "content-length") {
          res.contentLength = headers[k];
        }
      }
    }
  };

  // override res.end to capture all responses
  var resend = res.end.bind(res);
  res.end = function() {
    // call the original
    resend.apply(res, arguments);

    var end = new Date();
    var delta = end - start;
    var data = {
      ':clfDate': strftime('%d/%b/%Y:%H:%M:%S %z', end),
      ':contentLength': res.getHeader('content-length') || res.contentLength || '-',
      ':delta': delta,
      ':endDate': end.toISOString(),
      ':endTime': end.getTime(),
      ':httpVersion': req.httpVersion,
      ':ip': req.headers['x-forwarded-for'] || req.connection.remoteAddress || '-',
      ':method': req.method,
      ':protocol': req.connection.encrypted ? 'HTTPS' : 'HTTP',
      ':referer': req.headers.referer || '-',
      ':startDate': start.toISOString(),
      ':startTime': start.getTime(),
      ':statusCode': res.statusCode,
      ':url': req.url,
      ':urlDecoded': uriDecoded,
      ':userID': (req.session && (req.session.user || req.session.id)) || '-',
      ':userAgent': req.headers['user-agent'] || '-'
    };

    cb(template(format, data));
  };
}

function template(s, d) {
  s = s.replace(/(:[a-zA-Z]+)/g, function(match, key) {
    return d[key] || '';
  });
  return s.replace(/:{([a-zA-Z]+)}/g, function(match, key) {
    return d[':' + key] || '';
  });
}
