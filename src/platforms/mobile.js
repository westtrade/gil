'use strict';


const cordovaServe = require('cordova-serve')();

module.exports = function (path, options) {



	options = options || {};


	let opts = {
		root : path,
		port : DEFAULT_PORT,
		noLogOutput : false,
		noServerInfo : false,
	}

	cordovaServe.launchServer(opts).then(function () {
	    let server = cordovaServe.server;
	    let root = cordovaServe.root;
	    let port = cordovaServe.port;
	}, function (error) {
	    console.log('An error occurred: ' + error);
	});


};	


module.exports['settings'] = function (path, options) {
	console.log('Run settings app');
	options = options || {};
};	