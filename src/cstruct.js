"use strict";

//TODO 
// Aliases, description


const defaultValidator = {

}

const defaultSanitaizeMethods = {
	'integer' : (fieldValue, fieldSettings, checkedObject) => parseInt(fieldValue),
	'float' : (fieldValue, fieldSettings, checkedObject) => parseFloat(fieldValue),
	'boolean' : (fieldValue, fieldSettings, checkedObject) => fieldValue instanceof String ? fieldValue.toLowerCase() == 'true' : !!fieldValue,
	'string' : (fieldValue, fieldSettings, checkedObject) => fieldValue == null ? null : '' + fieldValue,
	'default' : (fieldValue, fieldSettings, checkedObject) => fieldValue,
}


class cStruct {
	
	constructor (schema, options) {

		let schemaIsArray = schema instanceof Array;
		let schemaIsObject = schema instanceof Object;
		if (schemaIsArray || !schemaIsObject) schema = null;		
		
		let optionsIsArray = options instanceof Array;
		let optionsIsObject = options instanceof Object;
		if (optionsIsArray || !optionsIsObject) options = null;

		this._schema = schema || {};
		this._options = options || {};
		this._metaData = {};

		for (let keyIdx in schema) {

			let defaultValue = null;
			let currentFieldInfo = schema[keyIdx];
			let validatorType = 'default';

			if (currentFieldInfo instanceof String && currentFieldInfo.toLowerCase() in defaultSanitaizeMethods) {
				validatorType = currentFieldInfo;
			}

			if (currentFieldInfo instanceof Object && 'default' in currentFieldInfo) {
				defaultValue = currentFieldInfo.default;
			}

			defaultValue = defaultValue == null ? null : defaultSanitaizeMethods[validatorType](defaultValue, currentFieldInfo, this);
			this._metaData[keyIdx] = defaultValue;

			Object.defineProperty(this, keyIdx, {				
				
				get : () => {
					return this._metaData[keyIdx];
				},

				set : value => {
					this._metaData[keyIdx] = value == null ? null : defaultSanitaizeMethods[validatorType](value, currentFieldInfo, this);
				}
			});
		}
	}


	set _data (data) {

		let dataIsCStruct = data instanceof cStruct;
		if (dataIsCStruct) {
			
			for (let keyIdx in data._metaData) {
				
				let value = data[keyIdx];
			
				if (typeof value !== 'undefined') {
					this[keyIdx] = value;
				}
				//TODO add strict check for non schemaless objects
			}
			
			return;		
		}

		let dataIsArray = data instanceof Array;
		let dataIsObject = data instanceof Object;

		if (dataIsArray || !dataIsObject) data = null;

		data = data || {};
		for (let keyIdx in data) {
			
			let value = data[keyIdx];

			if (typeof value !== 'undefined') {
				this[keyIdx] = value;
			}
			
			//TODO add strict check for non schemaless objects
		}

		return ;
	}


	toJSON () {
		return JSON.stringify(this._metaData,null,2);
	}


	toString() {
		return JSON.stringify(this._metaData,null,2);		
	}


	debug() {
		console.log(this + '');
	}


	// toSource() {
	// 	return JSON.stringify(this._metaData);		
	// }


	// toString () {
	// 	return '1234';
	// }

	// valueOf () {
	// 	return '1234';

	// }
}


module.exports = cStruct;