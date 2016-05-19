'use strict';

const spawn = require('child_process').spawn

const co = require('co');
const ReflectFileSystem = require('../reflectfs');

const createServer = require('../common').createServer;
const defaultApp = require('../common').defaultApp;


let serverOptions = require('../options').serverOptions;


let spawnGulp = () =>  new Promise((resolve, reject) => {		
	
	let gulpProcess = spawn('node_modules/.bin/gulp', ['default'], { stdio: 'inherit' });		
	gulpProcess.on('error', reject);		
	//gulpProcess.stdout.on('data', data => log(data.toString('UTF-8')));		
	gulpProcess.on('close', resolve);

});




let spawnGrunt = () =>  new Promise((resolve, reject) => {		
	
	let gruntProcess = spawn('node_modules/.bin/grunt', [], { stdio: 'inherit' });		
	gruntProcess.on('error', reject);		
	//gulpProcess.stdout.on('data', data => log(data.toString('UTF-8')));		
	gruntProcess.on('close', resolve);

});





//options


/**
 * TODO Добавить возможно express в качестве серверного роутера, и pagesjs в качестве серверного
 *
 * Перед стартом сервера реквайрить все js
 *
 * Возможно имеет смысл добавить хуки
 *
 *
 * Добавить процесс менеджер
 *
 * 
 */
module.exports = function (options) {

	serverOptions._data = options;

	if (serverOptions.lrPort == 35779) {
		serverOptions.lrPort = serverOptions.port + 25;
	}


	serverOptions.debug();

	return co(function *() {
		
		let fileList = new ReflectFileSystem(`${ serverOptions.rootPathString }`);

		let specialFilesExists = yield Promise.all([ fileList.exists('gulpfile.js') ]);
		let gulpExists = specialFilesExists.filter(res => res).length > 0;

		if (gulpExists) {
			let spawnResult = spawnGulp(path);
		}

		let server = yield createServer(serverOptions, defaultApp(serverOptions));	

	})
	.catch(error => console.log(error.stack));
};