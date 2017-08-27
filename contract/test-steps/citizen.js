'use strict';

const
	assert = require('assert');

let
	config = require('./config');

let
	citizen, citizens, mup, activeCitizen, citizenInstance;

module.exports = function (callback) {

	before(function () {
		mup = config.contracts.mup;
		citizen = config.contracts.citizen;

		citizens = config.actors.citizens;
	})

	after(function () {
		return callback()
	})

	it("Should have a valid instance running", function () {
		assert(!!citizen.instance);
	});

	it("Should have create citizen", function (done) {
		mup.instance.registerCitizen(citizens[0], `citizen-${1}`, `citizen-address-${1}`, 1)
			.then(tx => {
				assert(!!tx);
				return done();
			})
	});

	it("Should confirm citizen creation", function (done) {
		mup.instance.getCitizensCount()
			.then(cCount => {
				assert(cCount > 0);
				return done();
			})
	});

	it("Should create a police officer out of citizen", function (done) {
		mup.instance.getCitizenContractAddress.call(citizens[0])
			.then(_citizenContractAddress => {
				assert(!!_citizenContractAddress);
				return mup.instance.registerPolice(_citizenContractAddress);
			})
			.then(tx => {
				assert(!!tx);
				return done();
			})
			.catch(done);
	})

	it("Should update occupation after police register", function (done) {
		mup.instance.getCitizenContractAddress.call(citizens[0])
			.then(_citizenContractAddress => {
				assert(web3.isAddress(_citizenContractAddress));
				return citizen.artifact.at(_citizenContractAddress);
			})
			.then(_citizenInstance => {
				citizenInstance = _citizenInstance;
				return _citizenInstance.getCitizenInfo.call({from: citizens[0]})
			})
			.then(results => {
				assert(web3.toUtf8(results[0]));
				assert(web3.toUtf8(results[1]));
				assert(web3.isAddress(results[4]));
				return done();
			})
			.catch(done)
	})

	it("Should not be possible to interact with contract if not owner", function (done) {
		citizenInstance.getCitizenInfo.call({from: citizens[4]})
			.then(done)
			.catch(err=> {
				return done();
			})
	});

}