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

  var uriDecoded = req.url;
  try {
    uriDecoded = decodeURIComponent(uriDecoded);
  } catch (e) {}

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
    var s = format
      .replace(':clfDate', strftime('%d/%b/%Y:%H:%M:%S %z', end))
      .replace(':contentLength', res.getHeader('content-length') || res.contentLength || '-')
      .replace(':delta', delta)
      .replace(':endDate', end.toISOString())
      .replace(':endTime', end.getTime())
      .replace(':httpVersion', req.httpVersion)
      .replace(':ip', req.headers['x-forwarded-for'] || req.connection.remoteAddress || '-')
      .replace(':method', req.method)
      .replace(':protocol', req.connection.encrypted ? 'HTTPS' : 'HTTP')
      .replace(':referer', req.headers['referer'] || '-')
      .replace(':startDate', start.toISOString())
      .replace(':startTime', start.getTime())
      .replace(':statusCode', res.statusCode)
      .replace(':url', req.url)
      .replace(':urlDecoded', uriDecoded)
      .replace(':userID', (req.session && (req.session.user || req.session.id)) || '-')
      .replace(':userAgent', req.headers['user-agent'] || '-');

    // log it
    cb(s);
  };
}
