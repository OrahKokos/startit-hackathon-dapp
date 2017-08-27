'use strict';

const
	assert = require('assert');

let
	config = require('./config');

let
	mup, owner, citizens, cops, activeCase, citizen;

let
	laws = [];

module.exports = function (callback) {

	before(function () {

		mup = config.contracts.mup;
		citizen = config.contracts.citizen;

		owner = config.actors.owner;
		citizens = config.actors.citizens;
		cops = config.actors.police;

		for (let i = 0; i<8; i++) {
			config.laws.push(config.generateLaw({
				count: Math.floor(Math.random()*(100-10+1)+10),
				units: 'paragraphs',
				sentenceLowerBound: 10,
				sentenceUpperBound: 25,
				paragraphLowerBound: 7,
				paragraphUpperBound: 15,
				format: 'plain'
			}))
		}
	})

	after(function () {
		return callback()
	})

	it("Should have a valid instance running", function () {
		assert(!!mup.instance);
	});

	it("Should be able to register all generatd laws", function (done) {
		let isDone = config.laws.length;
		for (let i = 0; i < config.laws.length; i++) {
		let lawHash = web3.sha3(config.laws[i], {encoding: 'hex'});
		mup.instance.registerLaw.sendTransaction(`law-${i+1}`, lawHash)
			.then(tx => {
				assert(!!tx);
				if (!--isDone) return done();
			}).catch(done)
		}
	});

	it("Should have lawCount equal to laws generated", function (done) {
		mup.instance.getLawCount().then(lawCount => {
			assert(lawCount == config.laws.length);
			return done();
		}).catch(done)
	});

	it("Should have be able to remove law", function (done) {
		mup.instance.removeLaw(`law-1`)
			.then(tx => {
				assert(!!tx);
				return done();
			}).catch(done)
	});

	it("Should be able to registerCitizens", function (done) {
		let citizenCount = citizens.length;
		for (let i = 0; i < citizens.length; i++) {
			mup.instance.registerCitizen(citizens[i], `citizen-${i+1}`, `citizen-address-${i+1}`, i+1)
				.then(tx => {
					assert(!!tx);
					if(!--citizenCount) {
						return done();
					}
				}).catch(done)
		}
	});

	it("Should be able to get citizens count", function (done) {
		mup.instance.getCitizensCount().then(cCount => {
			assert(cCount == citizens.length);
			return done();
		})
	})

	it("Should be able to iterate through citizenMapping and get citizen keys", function (done) {
		let citizenCount = citizens.length;
		for (let i = 0; i < citizens.length; i++) {
			mup.instance.getCitizenMapping.call(i)
				.then(cAddress => {
					assert(citizens.indexOf(cAddress) != -1);
					if(!--citizenCount) {
						return done();
					}
				})
		}
	})

	it("Should be able to get each citizen via citizen key", function (done) {
		let citizenCount = citizens.length;
		for (let i = 0; i < citizens.length; i++) {
			mup.instance.getCitizenContractAddress.call(citizens[i])
				.then(data => {
					assert(!!data)
					if(!--citizenCount) {
						return done();
					}
				})
		}
	});

	it("Should be able to register police", function (done) {
		let copCount = cops.length;
		for(let i = 0; i < cops.length; i++) {
			mup.instance.getCitizenContractAddress.call(citizens[i])
				.then(_citizenContractAddress => {
					return mup.instance.registerPolice(_citizenContractAddress)
				})
				.then(tx => {
					assert(!!tx);
					if (!--copCount) return done();
				})
		}
	})

	it("Should be able to interate through police", function (done) {
		let policeCount = cops.length;
		for (let i = 0; i < cops.length; i++) {
			mup.instance.getPoliceMapping.call(i)
				.then(pAddress => {
					assert(web3.isAddress(pAddress));
					return mup.instance.getPoliceContractAddress.call(pAddress);
				})
				.then(_policeContractAddress => {
					assert(web3.isAddress(_policeContractAddress))
					if (!--policeCount) {
						return done();
					}
				})
		}
	})

	it("Should be able to destroy police contract", function (done) {
		mup.instance.getPoliceMapping.call(0)
			.then(_citizenContractAddress => {
				mup.instance.firePolice(0, _citizenContractAddress)
					.then(tx => {
						assert(!!tx);
						config.contracts.police.artifact.at(_citizenContractAddress).then(done).catch(err => {return done()})
					})
			})
	});

	it("Should be able to register case", function (done) {
		let lawHash = web3.sha3(config.laws[1], {encoding: 'hex'});

		mup.instance.getLaw.call('law-2')
			.then(_lawhash => {
				assert(lawHash == _lawhash);
				return mup.instance.registerCase('law-2');
			})
			.then(tx => {
				assert(!!tx);
				return done();
			})
	});

	it("Should be able to get case mapping", function (done) {
		mup.instance.getCaseMapping.call(0)
			.then(caseAddress => {
				assert(!!caseAddress);
				return done();
			})
	});

	it("Should be able to get case creator", function (done) {
		mup.instance.getCaseMapping.call(0)
			.then(caseAddress => {
				assert(!!caseAddress);
				activeCase = caseAddress;
				return mup.instance.getCaseContractAddress.call(caseAddress)
			})
			.then(caseOwner => {
				assert(caseOwner == owner);
				return done()
			})
	});

	it("Shoul be able to close case", function (done) {
		mup.instance.closeCase(0, activeCase)
			.then(tx => {
				return done();
			})
	})

	it("Should delete case contract after close", function (done) {
		config.contracts.case.artifact.at(activeCase).then(done).catch(err => {return done()});
	});

}