// A PhantomJS sript that simply opens the web page passed as the command line parameter
var page = require('webpage').create();

page.onError = function(msg, trace) {
  var msgStack = ['ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
    });
  }

  console.error(msgStack.join('\n'));
};

page.onConsoleMessage = function(msg, lineNum, sourceId) {
  var tail = sourceId ? ' (' + sourceId + ':' + (lineNum || 0) + ')' : '';
  console.log('CONSOLE: ' + msg + tail);
};

page.open(phantom.args[0], function () {});
