'use strict';

const nodePath = require('path');
const fs = require('fs');

const mmm = require('mmmagic');
const mimeDetector = new(mmm.Magic)(mmm.MAGIC_MIME_TYPE);
const mimeDetector2 = require('mime');

const mimeTypes = {
	'js' : 'application/javascript',
	'css' : 'text/css'
};


class ReflectFileSystem {

	constructor (rootFolderString) {
		this.__rootFolder = rootFolderString;
		this.__filelist = [];
		this.__index = {};
		this.__reindexPath = rootFolderString;
		this.__isReady = false;
	}

	resolvePath (pathString) {
		return nodePath.isAbsolute(pathString) ? pathString : nodePath.resolve(this.__rootFolder, pathString);
	}

	exists (pathString) {
		return new Promise(res => fs.access(this.resolvePath(pathString), fs.R_OK, e => e ? res(false) : res(true)));
	}

	static getFileList (folderPathString) {
		return new Promise((res, rej) =>
			fs.readdir(folderPathString, (e, fileListArray) => e ? rej(e) : res(fileListArray.map(currentPathName => nodePath.join(folderPathString, currentPathName))))
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

							if (err) {
								return reject(err);
							}

							let fileExtension = nodePath.extname(filePathString);
							let fileName = nodePath.basename(filePathString, fileExtension);


							info.ext = fileExtension.replace('.', '');
							info.mimeType = info.ext in mimeTypes ? mimeTypes[info.ext] : mime;
							info.mimeType = info.mimeType == 'inode/x-empty' ? mimeDetector2.lookup(realFilePath) : info.mimeType;
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
		return new Promise((resolve) => {
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

module.exports = ReflectFileSystem;
