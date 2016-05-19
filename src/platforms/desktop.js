'use strcit';

const co = require('co');
const spawn = require('child_process').spawn
const nw = require('nwjs');
const createServer = require('../common').createServer;
const defaultApp = require('../common').defaultApp;




//pathString


// this returns the path to nwjs excutable 



module.exports = function (path, options) {

	options = options || {};

	let host = DEFAULT_HOST;
	let port = DEFAULT_PORT;	

	return co(function *() {	
		let server = yield createServer(path, host, port, defaultApp(path));
		let child = spawn(nw, [path]);
	})
}