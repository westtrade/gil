'use strict';

const http = require('http');
const koa = require('koa');
const livereload = require('livereload');
const SSILib = require('node-ssi');
const stream = require('stream');
const url = require('url');
const fs = require('fs');
const nodePath = require('path');

const log = require('./utils/log');

const ReflectFileSystem = require('./reflectfs');
let optionSchemas = require('./options');

// https://htmlweb.ru/html/ssi.php
let scriptTemplate = (liveReloadPort) => `
<script>
  document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
  ':${ liveReloadPort }/livereload.js?snipver=1"></' + 'script>')
</script>
`;

class TransformStreamMiddleware extends stream.Transform {

	constructor (serverOptionsData, options = {}) {
		super();

		this.__options = options;
		const {serverOptions} = optionSchemas;

		serverOptions._data = serverOptionsData;
		this.__serverOptions = serverOptions;
		this.ssi = new SSILib('ssi' in options ? options.ssi : {});
	}

	_transform (chunk, enc, cb) {
		let encodedChunk = chunk;
		if (enc === 'buffer') {
			encodedChunk = encodedChunk.toString('utf-8');
		}

		this.ssi.compile(encodedChunk, (err, encodedChunk) => {
			if (err) {
				return cb(err);
			}

			if (encodedChunk.indexOf('</body>') >= 0) {
				encodedChunk = encodedChunk.replace('</body>', `${ scriptTemplate(this.__serverOptions.lrPort) }\n</body>`);
			}

			this.push(enc === 'buffer' ? new Buffer(encodedChunk, 'utf-8') : encodedChunk);
			cb();
		});
	}
}

module.exports.createServer = function createServer(options, requestListener) {
	//https://github.com/koajs/send/blob/master/index.js
	let serverOptions = optionSchemas.serverOptions;
	serverOptions._data = options;

	return new Promise((resolve, reject) => {
		const app = koa();

		if (requestListener) {
			app.use(requestListener);
		}

		let server = http.createServer(app.callback()).listen(serverOptions.port, serverOptions.host, () => {

			let address = server.address();

			//TODO Сделать LiveReload сервер встроенным и добавить автоматическую проверку порта на не занятость
			let livereloadServer = livereload.createServer({
				applyJSLive: true,
				applyCSSLive: true,
				port: serverOptions.lrPort,
				exts : ['html', 'css', 'js', 'tag', 'marko'],
			});

			livereloadServer.watch(serverOptions.rootPathString);

			resolve(server);
			log.info(`Gil started http://${ address.address }:${ address.port }/`);
		});

		// let server = http.createServer(requestListener).listen(port, host, () => {


		// });
	});
};

let directoryListApp = async (ctx, rootPathString, folderPathInfo) => {
	let htmlFileList = 'error';
	let serverOptions = optionSchemas.serverOptions;

	try {
		let fileList = await ReflectFileSystem.getFileList(folderPathInfo.realPath);
		fileList = await Promise.all(fileList.map(p => ReflectFileSystem.getPathInfo(p)));

		fileList.map(pathInfo => {
			pathInfo.relativePath = nodePath.relative(rootPathString, pathInfo.fullPath);
			return pathInfo;
		});

		let currentRelativePathString = nodePath.relative(rootPathString, folderPathInfo.fullPath);
		let currentFolderIsRoot = currentRelativePathString == 0;
		let upPath = nodePath.resolve(folderPathInfo.fullPath, '..');
		upPath = nodePath.relative(rootPathString, upPath);

		let upButton = currentFolderIsRoot ? '' : `
			<a href="/${ upPath }">UP</a>
		`;

		htmlFileList = `
			${ upButton }
			<ul>
			${ fileList.map(pathInfo => `<li>
				<a href="/${ pathInfo.relativePath }">
					${ [pathInfo.basename, pathInfo.ext].filter(item => item.length).join('.') }
					[<span class="size">${ pathInfo.stat.size / (1024) }</span>
					<span class="type">${ pathInfo.type }</span>]
				</a>
			</li>`).join('') }
			</ul>
		`;

	} catch (e) {
		htmlFileList = '' + e.stack;
	}

	htmlFileList = `
		<!DOCTYPE html><html lang="en">
			<head>
				<meta charset="UTF-8" /><title>Document</title>
				<style>
					html{font-family:sans-serif;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}body{margin:0}article,aside,details,/* 1 */
					figcaption,figure,footer,header,main,/* 2 */
					menu,nav,section,summary{display:block}audio,canvas,progress,video{display:inline-block}audio:not([controls]){display:none;height:0}progress{vertical-align:baseline}template,/* 1 */
					[hidden]{display:none}a{background-color:transparent;-webkit-text-decoration-skip:objects}a:active,a:hover{outline-width:0}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:inherit;font-weight:bolder}dfn{font-style:italic}h1{font-size:2em;margin:.67em 0}mark{background-color:#ff0;color:#000}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}svg:not(:root){overflow:hidden}code,kbd,pre,samp{font-family:monospace,monospace;font-size:1em}figure{margin:1em 40px}hr{box-sizing:content-box;height:0;overflow:visible}button,input,select,textarea{font:inherit;margin:0}optgroup{font-weight:700}button,input{overflow:visible}button,select{text-transform:none}button,html [type="button"],/* 1 */
					[type="reset"],[type="submit"]{-webkit-appearance:button}button::-moz-focus-inner,[type="button"]::-moz-focus-inner,[type="reset"]::-moz-focus-inner,[type="submit"]::-moz-focus-inner{border-style:none;padding:0}button:-moz-focusring,[type="button"]:-moz-focusring,[type="reset"]:-moz-focusring,[type="submit"]:-moz-focusring{outline:1px dotted ButtonText}fieldset{border:1px solid silver;margin:0 2px;padding:.35em .625em .75em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}textarea{overflow:auto}[type="checkbox"],[type="radio"]{box-sizing:border-box;padding:0}[type="number"]::-webkit-inner-spin-button,[type="number"]::-webkit-outer-spin-button{height:auto}[type="search"]{-webkit-appearance:textfield;outline-offset:-2px}[type="search"]::-webkit-search-cancel-button,[type="search"]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-input-placeholder{color:inherit;opacity:.54}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}
				</style>

			</head><body>
			${ htmlFileList }
			${ scriptTemplate(serverOptions.lrPorts) }
		</body></html>
	`;

	ctx.status = 200;
	ctx.set('Content-Type', 'text/html');
	ctx.body = htmlFileList;
};

module.exports['directoryListApp'] = directoryListApp;

let defaultApp = options => {

	let serverOptions = optionSchemas.serverOptions;
	serverOptions._data = options;

	return function * (next) {
		let uri = url.parse(this.request.url).pathname;
		const currenPath = nodePath.resolve(serverOptions.rootPathString + uri);
		let isFolder = uri[uri.length - 1] === '/';

		let currenPathInfo = null;
		let indexFileInfo = null;

		try {
			currenPathInfo = yield ReflectFileSystem.getPathInfo(currenPath);
			indexFileInfo = isFolder ? yield ReflectFileSystem.getPathInfo(nodePath.resolve(currenPath, 'index.html')) : null;
			let currentFileInfo = indexFileInfo ? indexFileInfo : currenPathInfo;
			isFolder = currentFileInfo.type == 'directory';

			if (isFolder) {
				return directoryListApp(this, serverOptions.rootPathString, currenPathInfo);
			}

			this.set('Content-Type', currentFileInfo.mimeType);
			this.status = 200;

			//TODO add E-Tag support for caching
			//https://ru.wikipedia.org/wiki/HTTP_ETag
			// if (this.fresh) {
			// 	this.status = 304;
			// 	return;
			// }
			const baseDir = nodePath.dirname(currentFileInfo.realPath);
			const streamMiddleware = new TransformStreamMiddleware(serverOptions, {
				ssi : { baseDir }
			});

			let fileStream = fs.createReadStream(currentFileInfo.realPath)

			if (currentFileInfo.mimeType === 'text/html') {
				fileStream = fileStream.pipe(streamMiddleware);
			}

			this.body = fileStream;

		} catch (e) {
			throw e;
		}


	}
}

module.exports['defaultApp'] = defaultApp;
