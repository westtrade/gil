'use strict';

const ReflectFileSystem = require('../reflectfs');

const {createServer, defaultApp} = require('../common');
const {serverOptions} = require('../options');

//options
/**
 * TODO:
 * - [] Перед стартом сервера реквайрить все js
 * - [] Возможно имеет смысл добавить хуки
 * - [] Добавить процесс менеджер
 */
async function startServer (options) {
	serverOptions._data = options;

	if (serverOptions.lrPort == 35779) {
		serverOptions.lrPort = serverOptions.port + 25;
	}

	serverOptions.debug();

	let fileList = new ReflectFileSystem(serverOptions.rootPathString);
	let specialFilesExists = await Promise.all([fileList.exists('gulpfile.js')]);
	let gulpExists = specialFilesExists.filter(res => res).length > 0;

	if (gulpExists) {
		let spawnResult = spawnGulp(path);
	}

	let server = await createServer(serverOptions, defaultApp(serverOptions));
};

module.exports = startServer;
