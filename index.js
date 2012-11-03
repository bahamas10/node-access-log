module.exports = accesslog;

function accesslog(req, res, format, func) {
  format = format || ':ip :method :statusCode :url (:deltams)';
  func = func || console.log;

  req._received_date = new Date();

  // override res.end to capture all responses
  var res_end = res.end;
  res.end = function() {
    // call the original
    res_end.apply(res, arguments);

    var delta = new Date() - req._received_date;
    var s = format
      .replace(':method', req.method)
      .replace(':statusCode', res.statusCode)
      .replace(':url', req.url)
      .replace(':ip', req.connection.remoteAddress)
      .replace(':delta', delta);

    // log it
    func(s);
  };
}
