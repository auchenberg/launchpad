var exec = require('child_process').exec;
var Q = require('q');
var fs = require('fs');
var _ = require('underscore');
var path = require('path');
var debug = require('debug')('launchpad:local:browser');

var utils = require('./utils');
var cache = {};

module.exports = function (browser) {
  var name = browser.name;

  if (!cache[name]) {
    debug('Caching discovery for local browser', browser.name);
    cache[name] = Q(_.clone(browser)).then(function (current) {
      // Check in default location first
      if (browser.defaultLocation && fs.existsSync(browser.defaultLocation)) {
        debug('Found browser ' + current.name + ' in default location', browser.defaultLocation);
        return setPath(current, browser.defaultLocation);
      }

      // Run the pathQuery to see if we can find it somewhere else
      return Q.nfcall(exec, current.pathQuery, {
        cwd: current.cwd || '.'
      }).then(function (stdout) {
        var path = utils.getStdout(stdout);
        debug('Ran pathQuery for ' + browser.name, current.pathQuery, path);
        if (!path) {
          return null;
        }
        return setPath(current, path);
      }, function() {
        // Exec errors most likely mean the browser doesn't exist
        return null;
      });
    }).then(function (current) {
      if (current !== null) {
        // Set the command to the path
        if (!current.command) {
          current.command = current.path;
        } else if (current.command === 'open') {
          debug('Adding arguments for MacOS open command', current.name);
          // Set the arguments for the open process
          current.args = ['--wait-apps', '--new', '--fresh', '-a', current.path].concat(current.args || []);
        }
      }

      return current;
    });
  }

  return cache[name];
};

function setPath(browser, newPath) {
  browser.path = newPath;
  if (browser.path.slice(-4) === '.app') {
    browser.binPath = path.join(newPath, 'Contents', 'MacOS', browser.process);
  } else {
    browser.binPath = newPath;
  }
  return browser;
}
