'use strict';

const {spawn} = require('child_process');

const gulp = () => new Promise((resolve, reject) => {
	let gulp = spawn('node_modules/.bin/gulp', ['default'], { stdio: 'inherit' });
	gulp.on('error', reject).on('close', resolve);
	//gulpProcess.stdout.on('data', data => log(data.toString('UTF-8')));
});

const grunt = () => new Promise((resolve, reject) => {
	let gulp = spawn('node_modules/.bin/grunt', ['default'], { stdio: 'inherit' });
	gulp.on('error', reject).on('close', resolve);
	//gulpProcess.stdout.on('data', data => log(data.toString('UTF-8')));
});

module.exports = {
	gulp, grunt
};
