var respond = function respond(req, res, next) {
      res.send('hello ' + req.params.name);
      return next();
}



// exports
exports.respond = respond
