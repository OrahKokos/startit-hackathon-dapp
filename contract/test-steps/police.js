'use strict';

const
	assert = require('assert');

let
	config = require('./config');

let
	police, mup, citizens, policeInstance, citizenInstance, citizen;

module.exports = function (callback) {

	before(function () {
		
		police = config.contracts.police;
		citizen = config.contracts.citizen;
		mup = config.contracts.mup;

		citizens = config.actors.citizens;
	})

	after(function () {
		return callback()
	})

	it("Should have a valid instance running", function () {
		assert(!!police.instance);
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

	it("Should get citizen instance", function (done) {
		mup.instance.getCitizenContractAddress.call(citizens[0])
			.then(_citizenContractAddress => {
				assert(web3.isAddress(_citizenContractAddress));
				return citizen.artifact.at(_citizenContractAddress);
			})
			.then(_citizenInstance => {
				citizenInstance = _citizenInstance;
				return done();
			}).catch(done)
	})

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
	});

	it("Should verify police contract creation", function (done) {
		mup.instance.getPoliceMapping.call(0)
			.then(policeAddress => {
				return mup.instance.getPoliceContractAddress.call(policeAddress)
					.then(policeContractAddress => {
						return police.artifact.at(policeContractAddress);
					})
					.then(_policeInstance => {
						policeInstance = _policeInstance;
						return done();
					})
			})
	})

	it("Should not be possible for non-owner actors to do actions on the police contract", function (done){
		policeInstance.getCasesCount.call({from: citizens[4]})
			.then(done)
			.catch(err=>{return done()})
	});

}