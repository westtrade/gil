'use strict';

const cStruct = require('../cstruct');
const serverOptionsSchema = require('./serverOptionsSchema.json');

module.exports = {
	get serverOptions() {
		return new cStruct(serverOptionsSchema);
	}
};
