var def_format = ':ip :method :statusCode :url (:deltams)';

module.exports = accesslog;

function accesslog(req, res, format, cb) {
  if (typeof format === 'function') {
    cb = format;
    format = null;
  }

  format = format || def_format;
  cb = cb || console.log;

  var received_date = new Date();

  // override res.end to capture all responses
  var res_end = res.end.bind(res);
  res.end = function() {
    // call the original
    res_end.apply(res, arguments);

    var delta = new Date() - received_date;
    var s = format
      .replace(':method', req.method)
      .replace(':statusCode', res.statusCode)
      .replace(':url', req.url)
      .replace(':ip', req.connection.remoteAddress)
      .replace(':delta', delta);

    // log it
    cb(s);
  };
}
