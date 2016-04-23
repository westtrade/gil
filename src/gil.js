'use strict';

const nodePath = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');
const stream = require('stream');


const livereload = require('livereload');
const mmm = require('mmmagic');
const mimeDetector = new(mmm.Magic)(mmm.MAGIC_MIME_TYPE);
const SSILib = require('node-ssi');




const mimeTypes = {
	'js' : 'application/javascript',
	'css' : 'text/css'
}





let scriptTempalte = `
<script>
  document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
  ':35779/livereload.js?snipver=1"></' + 'script>')
</script>
`;

class TransformStreamMiddleware extends stream.Transform {

	constructor (options) {
		super();

		options = options || {};
		this.__options = options;

		this.ssi = new SSILib('ssi' in options ? options.ssi : {});
	}

	_transform (chunk, enc, cb) {

		let encodedChunk = chunk;
		if (enc === 'buffer') {
			encodedChunk = encodedChunk.toString('utf-8');
		}	

		this.ssi.compile(encodedChunk, (err,encodedChunk) => { 

			if (err) return cb(err);

			if (encodedChunk.indexOf('</body>') >= 0) {
				encodedChunk = encodedChunk.replace('</body>', `${ scriptTempalte }\n</body>`);
			}		 	

		 	this.push(enc === 'buffer' ? new Buffer(encodedChunk, 'utf-8') : encodedChunk);
			
			cb();
		});
	}
}




class ReflectFileSystem {
	
	constructor (reindexFolder) {

		this.__filelist = [];
		this.__index = {};
		this.__reindexPath = reindexFolder;	
		this.__isReady = false;

	}

	static getFileList (folderPathString) {
		return new Promise((res, rej) => 
           	fs.readdir(folderPathString, (e, fileListArray) => e ? rej(e) : res(fileListArray.map(currentPathName => nodePath.join(folderPath, currentPathName))))
		);
	}

	static getSymbolicRealPath(filePathString) {
		return new Promise((resolve, reject) => fs.readlink(filePathString, (err, linkString) => err ? reject(err) : resolve(linkString)));		
	}

	static getPathInfo (filePathString) {

		//http://ru.code-maven.com/system-information-about-a-file-or-directory-in-nodejs

		let info = {
			path: filePathString
		};
		
		info.fullPath = nodePath.resolve(filePathString);

		return new Promise((resolve, reject) => {

			return fs.lstat(filePathString, (err, stat) => {
				
				if (err) return reject(err);				

				Promise
					.resolve(stat.isSymbolicLink() ? ReflectFileSystem.getSymbolicRealPath(filePathString) : filePathString)
					.then(realFilePath => {

						mimeDetector.detectFile(realFilePath, (err, mime) => {

							if (err) return reject(err);

							let fileExtension = nodePath.extname(filePathString);
							let fileName = nodePath.basename(filePathString, fileExtension);


							info.ext = fileExtension.replace('.', '');
							info.mimeType = info.ext in mimeTypes ? mimeTypes[info.ext] : mime;
							info.realPath = realFilePath;							
							info.stat = stat;
							
							info.basename = fileName;
							info.type = stat.isFile() ? 'file' : (stat.isDirectory() ? 'directory' : '');

							resolve(info);
						});
					
					})
					.catch(reject);
			});

		});
	}


	get isReady () {

		return new Promise((resolve, reject) => {

			if (this.__isReady) {
				return resolve(this);
			}

			return this.reindex().then(() => {
				this.__isReady = true;
				resolve(this);
			});
		});

	}

	reindex (initReindexPath) {

		let reindexPath = initReindexPath || this.__reindexPath;

		return ReflectFileSystem.getFileList(reindexPath).then(fileList => {
			
			let resultPromise = Promise.resolve();
			
			fileList.forEach(filePath => {
				resultPromise = resultPromise
					.then(() => this.add(filePath))
					.then(fileData => fileData.type === 'directory' ? this.reindex(fileData.fullPath) : fileData)
			});

			return resultPromise.then(lastFileInfo => { 

				if(initReindexPath) {
					this.__isReady = true;
				}

				return this;
			});

		});
	}

	add (filePath) {

		return ReflectFileSystem.getPathInfo(filePath).then(fileData => {
			
			this.__index[filePath] = this.__filelist.length;		
			this.__filelist.push(fileData);

			return fileData;
		});
	}

	exclude (filePath) {

	
	}

	//db.users.find({awards: {$elemMatch: {award:'National Medal', year:1975}}})
	find () {

		let resultObject = {};

		/*for (let currentPath in this.__index) {
			resultObject[currentPath] = ''//this.get(currentPath);
		}*/

		return currentPath;
	}

	//TODO add parser
	get (filePath) {
		
		if (!(filePath in this.__index)) {
			return null;
		}

		let idx = this.__index[filePath];
		return this.__filelist[idx];
	}


	* [Symbol.iterator] () {
		for (let fileInfo of this.__filelist) {
			yield fileInfo;
		}
	}

	toString () {
		return 'STRING';
	}

	toJSON () {
		let resultObject = {};
		
		for (let currentPath in this.__index) {
			resultObject[currentPath] = this.get(currentPath);
		}

		return resultObject;
	}
}



function readFile(filePath) {
	
}




// https://htmlweb.ru/html/ssi.php

//var Readable = require('stream').Readable


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

module.exports['server'] = function (path, host, port) {

	host = host || 'localhost';
	port = port || 2405;

	let fileList = new ReflectFileSystem(`${ path }`);
	const server = http.createServer((req, res) => {

		let uri = url.parse(req.url).pathname;

		let lastCharIsTrail = uri[uri.length - 1] === '/';


		if (lastCharIsTrail) {
			uri = uri + 'index.html';
		}


		let currenPath = nodePath.resolve('.'  + uri);
		//fileList.isReady.then(() => {
			//TODO Возможно стоит сделать обработку директорий
			//console.log(currenPath);
			
			//let currentFileInfo = fileList.get(currenPath);
			

			return ReflectFileSystem.getPathInfo(currenPath).then(function (currentFileInfo) {
				res.writeHead(200, {'Content-Type': currentFileInfo.mimeType } );

				//console.log(currentFileInfo.mimeType);

				let middleware = new TransformStreamMiddleware({
					ssi : {
						baseDir : nodePath.dirname(currentFileInfo.realPath)
					}
				});

				let fileStream = fs
					.createReadStream(currentFileInfo.realPath)
					.pipe(middleware)
					.pipe(res)
				;




			}).catch(e => {
				console.log(e.stack);

				res.writeHead(404, {'Content-Type': 'text/plain'});
				console.log(`${ req.method } ${ req.url } 503`);

				return res.end('Error happend: ' + e.stack);
			});
			

			/*

			if (!currentFileInfo) {
				res.writeHead(404, {'Content-Type': 'text/plain'});
				console.log(`${ req.method } ${ req.url } 404`);

				return res.end('File not found');
			}

			console.log(`${ req.method } ${ uri } 200`);


			res.writeHead(200, {'Content-Type': currentFileInfo.mimeType} );

			let fileStream = fs.createReadStream(currentFileInfo.fullPath);
			fileStream.pipe(res);
		
			*/

		//});

	});

	server.listen(port, host, () => {
		let address = server.address();
		console.log(`Gil started http://${ address.address }:${ address.port }/`);
	});

	//TODO Сделать LiveReload сервер встроенным и добавить автоматическую проверку порта на не занятость
	let livereloadServer = livereload.createServer({
		applyJSLive: true,
		applyCSSLive: true,
		port: 35779,
		exts : ['html', 'css', 'js', 'tag']
	});

	livereloadServer.watch(path);
}
