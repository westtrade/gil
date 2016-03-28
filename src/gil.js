'use strict';

let nodePath = require('path');
let http = require('http');
let fs = require('fs');
let url = require('url');
let livereload = require('livereload');

let mmm = require('mmmagic')

let mimeDetector = new(mmm.Magic)(mmm.MAGIC_MIME_TYPE);

class ReflectFileSystem {
	
	constructor (reindexFolder) {

		this.__filelist = [];
		this.__index = {};
		this.__reindexPath = reindexFolder;	

		this.__isReady = false;

	}

	static getFileList (folderPath) {

		return new Promise((resolve, reject) => {	

			fs.readdir(folderPath, function (err, fileList) {			
				if (err) return reject(err);
				
				fileList = fileList.map(currentPathName => nodePath.join(folderPath, currentPathName));
				resolve(fileList);
			});
		});
	}

	static getPathInfo (filePath) {

		//http://ru.code-maven.com/system-information-about-a-file-or-directory-in-nodejs

		let info = {
			path: filePath
		};
		
		info.fullPath = nodePath.resolve(filePath);

		return new Promise((resolve, reject) => {

			return fs.stat(filePath, function (err, stat) {
				
				if (err) return reject(err);
				mimeDetector.detectFile(filePath, (err, mime) => {

					if (err) return reject(err);

					let fileExtension = nodePath.extname(filePath);
					let fileName = nodePath.basename(filePath, fileExtension);

					info.mimeType = mime;
					info.stat = stat;
					info.ext = fileExtension.replace('.', '');
					info.basename = fileName;
					info.type = stat.isFile() ? 'file' : (stat.isDirectory() ? 'directory' : '');

					resolve(info);
				});
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
				return this;
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
		fileList.isReady.then(() => {

			//TODO Возможно стоит сделать обработку директорий
			
			let currentFileInfo = fileList.get(currenPath);

			if (!currentFileInfo) {
				res.writeHead(404, {'Content-Type': 'text/plain'});
				res.end('File not found');
			}



			res.writeHead(200, {'Content-Type': currentFileInfo.mimeType} );

			let fileStream = fs.createReadStream(currentFileInfo.fullPath);
			fileStream.pipe(res);
		});

	});

	server.listen(port, host, () => {
		let address = server.address();
		console.log(`Gil started http://${ address.address }:${ address.port }/`);
	});

	//TODO Сделать LiveReload сервер встроенным
	let livereloadServer = livereload.createServer({
		applyJSLive: true,
		applyCSSLive: true,
		port: 35779
	});

	livereloadServer.watch(path);
}
