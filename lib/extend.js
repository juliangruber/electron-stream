module.exports = function extend(obj) {
  var args = Array.prototype.slice.call(arguments, 1);

  args.forEach(function (arg) {
    for (var prop in arg) {
      if (typeof obj[prop] == 'object') obj[prop] = extend(obj[prop], arg[prop]);
      else obj[prop] = arg[prop];
    }
  })

  return obj;
}
