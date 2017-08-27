'use strict';

const
	loremIpsum = require('lorem-ipsum');

module.exports = {
	contracts: {
		mup: {
			artifact: artifacts.require("Mup.sol"),
			instance: null
		},
		citizen: {
			artifact: artifacts.require("Citizen.sol"),
			instance: null
		},
		police: {
			artifact: artifacts.require("Police.sol"),
			instance: null
		},
		case: {
			artifact: artifacts.require("Case.sol"),
			instance: null
		},
	},
	actors: {
		owner: null,
		citizens: [],
		police: []
	},
	generateLaw: function (options) {
		return loremIpsum(options);
	},
	laws: []
}