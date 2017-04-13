'use strict';

const platforms = require('./platforms');


module.exports['server'] = function ({path, host, port}) {

	let options = {
		host : host,
		port : port,
		rootPathString : path,
	};

	return platforms.web(options);
};




//module.exports['desktop'] = platforms.desktop;
//module.exports['mobile'] = platforms.mobile;
