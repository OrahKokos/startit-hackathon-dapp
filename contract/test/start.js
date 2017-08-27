'use strict';

const
 assert = require('assert');

const
	env = require('dotenv');

env.config();

let { contracts, actors } = require('../test-steps/config');


function runTest(Contract, file) {
	return new Promise((resolve, reject) => {
		contract(Contract, function () {
		  require('../test-steps/' + file)(resolve);
		});
	})
}


describe("Preparing testin environement", function () {

	before(function (done) {

		let accounts = web3.eth.accounts.concat();

		actors.owner = accounts.splice(0, process.env.CONTRACT_OWNER)[0];
		actors.citizens = accounts.splice(0, process.env.CITIZENS);
		actors.police = actors.citizens.splice(0, process.env.POLICE);

		Promise.all([
			contracts.mup.artifact.deployed(),
			contracts.citizen.artifact.deployed(), 
			contracts.police.artifact.deployed(),
			contracts.case.artifact.deployed()
		]).then(results => {
			contracts.mup.instance = results[0];
			contracts.citizen.instance = results[1];
			contracts.police.instance = results[2];
			contracts.case.instance = results[3];
			return done()
		}).catch(done)
	});

	it("Testing env set", function () {
		return true;
	})

	runTest('Mup', 'mup.js')
		.then(runTest('Citizen', 'citizen.js'))
		.then(runTest('Police', 'police.js'))
		.then(runTest('Case', 'case.js'))


})
