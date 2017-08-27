'use strict';

const
	assert = require('assert');

let
	config = require('./config');

let caseInstance, mup, police, citizen, citizenInstance;
let cases, citizens, cops, owner;
let activeCase, activeSuspect, activeCop, fakeCop, nonSuspect;

module.exports = function (callback) {

	before(function () {
		// bootstrap stuff
		caseInstance = config.contracts.case;
		mup = config.contracts.mup;
		citizen = config.contracts.citizen;
		police = config.contracts.police;

		citizens = config.actors.citizens;
		owner = config.actors.owner;
		cops = config.actors.police;

	})

	after(function () {
		return callback()
	});

	it("Should have a valid instance running", function () {
		assert(!!caseInstance.instance);
	});

	it("Should be able to register all generatd laws", function (done) {
		let lawsCount = config.laws.length;
		for (let i = 0; i < config.laws.length; i++) {
		let lawHash = web3.sha3(config.laws[i], {encoding: 'hex'});
		mup.instance.registerLaw.sendTransaction(`law-${i+1}`, lawHash)
			.then(tx => {
				assert(!!tx);
				if (!--lawsCount) return done();
			}).catch(done)
		}
	});

	it("Should be able to register citizens", function (done) {
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

	it("Should be able to register police", function (done) {
		let copCount = cops.length;
		for(let i = 0; i < cops.length; i++) {
			mup.instance.getCitizenContractAddress.call(citizens[i])
				.then(citizenContractAddress => {
					mup.instance.registerPolice(citizenContractAddress)
						.then(tx => {
							assert(!!tx);
							if (!--copCount) return done();
						})
				})
		}
	});

	it("Should bootstrap entities", function (done) {
			Promise.all([
				mup.instance.getCitizenMapping.call(0),
				mup.instance.getCitizenMapping.call(1),
				mup.instance.getPoliceMapping.call(0),
				mup.instance.getPoliceMapping.call(1)
			])
			.then(results => {
				return Promise.all([
					mup.instance.getCitizenContractAddress.call(results[0]),
					mup.instance.getCitizenContractAddress.call(results[1]),
					mup.instance.getPoliceContractAddress.call(results[2]),
					mup.instance.getPoliceContractAddress.call(results[3])
				])
				.then(results => {
					return Promise.all([
						citizen.artifact.at(results[0]),
						citizen.artifact.at(results[1]),
						police.artifact.at(results[2]),
						police.artifact.at(results[3])
					])
				})
				.then(results => {
					activeSuspect = results[0];
					nonSuspect = results[1];
					activeCop = results[2];
					fakeCop = results[3];
					return done();
				})
			})
		});


	describe("Case-fee", function () {

		it("Should register case", function (done) {
			mup.instance.registerCase('law-1')
				.then(tx => {
					assert(!!tx);
					return done();
				})
		});

		it("Should be able to get case instance", function (done) {
			mup.instance.getCaseMapping.call(0)
				.then(caseContractAddress => {
					assert(!!caseContractAddress);
					return caseInstance.artifact.at(caseContractAddress);
				})
				.then(aCase => {
					assert(!!aCase);
					activeCase = aCase;
					return done();
				}).catch(done)
		});

		it("Should be able to assign police to the case", function (done) {
			mup.instance.assignPoliceToCase.sendTransaction(activeCop.address, activeCase.address)
				.then(tx => {
					assert(!!tx);
					return done();
				})
				.catch(done)
		})

		it("Should have assigned police officer on the case", function (done){
			activeCase.isOnCase.call(activeCop.address)
				.then(bool => {
					assert(bool);
					return done();
				});
		});

		it("On the case police should be able to scan citizen contracts", function (done){
			setTimeout(function () {
				activeCop.citizenData.call(activeSuspect.address, activeCase.address, {from: activeSuspect.address})
					.then(results => {
						assert(results.length == 5);
						return done();
					})
					.catch(done)
				}, 1000)
		})

		it("Police which is not in the active case, can't read citizen data", function (done) {
				fakeCop.citizenData.call(activeSuspect.address, activeCase.address, { from: nonSuspect.address })
					.then(results => {
						assert(!web3.toUtf8(results[0]))
						assert(!web3.toUtf8(results[1]))
						return done();
					})
					.catch(err => {
						return done();
					})
		})

		it("Should add witness to case", function (done) {
			activeCop.addWitnessToCase(activeSuspect.address, activeCase.address)
				.then(tx => {
					assert(!!tx);
					return done();
				})
		});

		it("Should reflect witness count on case", function (done) {
			activeCase.getWitnessCount()
				.then(wCount => {
					assert(wCount == 1);
					return done();
				})
		});

		it("Should add suspect to case", function (done) {
			Promise.all([
				mup.instance.getPoliceMapping.call(0),
				mup.instance.getCitizenMapping.call(1)
			]).then(results => {
				return Promise.all([
					mup.instance.getPoliceContractAddress.call(results[0]),
					mup.instance.getCitizenContractAddress.call(results[1])
				])
			})
			.then(results => {
				return Promise.all([
					police.artifact.at(results[0]),
					citizen.artifact.at(results[1])
				])
			})
			.then(results => {
				let policeInstance = results[0];
				activeSuspect = results[1];
				policeInstance.addSuspectToCase(activeSuspect.address, activeCase.address)
					.then(tx => {
						assert(!!tx);
						return done();
					})
			})
		});

		it("Should reflect suspect count on case", function (done) {
			activeCase.getSuspectCount()
				.then(sCount => {
					assert(sCount == 1);
					return done();
				})
		});

		it("Should get suspect via iterate/map through the case and confirm data", function (done) {
			activeCase.getSuspectMapping.call(0)
				.then(_suspectAddress => {
					assert(_suspectAddress == activeSuspect.address);
					return activeCase.getSuspectContract.call(_suspectAddress, {from: activeCop.address});
				})
				.then(_suspectClaimer => {
					assert(_suspectClaimer == activeCop.address);
					return done()
				})
		})

		it("Should add accussed to case", function (done) {
			activeCop.accuseCitizen(activeSuspect.address, activeCase.address)
				.then(tx => {
					assert(!!tx);
					return done();
				})
		});

		it("Should reflect accused in case", function (done) {
			activeCase.accused()
				.then(accusedAddress => {
					assert(accusedAddress == activeSuspect.address)
					return done()
				})
		})

		it("Should be able to request fee verdict", function (done) {
			activeCop.requestVerdict(activeCase.address, 'fine', 100000)
				.then(tx => {
					assert(!!tx);
					return done();		
				}) 
		});

		it("Verdict should reflect changes on the case and citizen", function (done) {
			activeSuspect.getCrimeCount({from: citizens[1]})
				.then(crimeCount => {
					assert(crimeCount == 1);
					return done();
				})
		})

		it("Citizen should have registed fine", function (done) {
			activeSuspect.getCrimeMapping.call(0)
				.then(_caseContractAddress => {
					return activeSuspect.getCrimeFee.call(_caseContractAddress)
				})
				.then(fee => {
					assert(fee == 100000)
					return done();
				})
		})

		it("Citizen should pay fine", function (done) {
			activeSuspect.payFine(activeCase.address, { value: 100000 })
				.then(tx => {
					return done();
				})
		})


		it("Should have balance on case contract from fee", function (done) {
			activeCase.getBalance.call()
				.then(balance => {
					assert(balance == 100000)
					return done()
				})
		})

		it("Should close case when fee", function (done) {
			mup.instance.closeCase(0, activeCase.address)
				.then(tx => {
					assert(!!tx);
					return done();
				})
		})

		it("Case contract should have suicided", function (done){
			mup.instance.getCaseMapping.call(0)
				.then(_caseContractAddress => {
					assert(!!_caseContractAddress);
					caseInstance.artifact.at(_caseContractAddress)
						.then(done)
						.catch(err => {
							return done()
						})
				})
		})

		it("Mup balance should adjust after case suicide", function (done){
			mup.instance.getBalance.call()
				.then(balance => {
					assert(balance == 100000);
					return done();
				})
		})


	})

	describe("Case-felony", function () {

		it("Should register case", function (done) {
			mup.instance.registerCase('law-1')
				.then(tx => {
					assert(!!tx);
					return done();
				})
		});

		it("Should be able to get case instance", function (done) {
			mup.instance.getCaseMapping.call(1)
				.then(caseContractAddress => {
					assert(!!caseContractAddress);
					return caseInstance.artifact.at(caseContractAddress);
				})
				.then(aCase => {
					assert(!!aCase);
					activeCase = aCase;
					return done();
				}).catch(done)
		});

		it("Should be able to assign police to the case", function (done) {
			mup.instance.getPoliceMapping.call(0)
				.then(policeAddress => {
					return mup.instance.getPoliceContractAddress.call(policeAddress)
						.then(policeContractAddress => {
							return police.artifact.at(policeContractAddress)
						})
						.then(policeInstance => {
							activeCop = policeInstance;
							return mup.instance.assignPoliceToCase(activeCop.address, activeCase.address)
						})
						.then(tx => {
							assert(!!tx);
							return done();
						})
						.catch(done)
				})
		});

		it("Should add suspect to case", function (done) {
			Promise.all([
				mup.instance.getPoliceMapping.call(0),
				mup.instance.getCitizenMapping.call(1)
			]).then(results => {
				return Promise.all([
					mup.instance.getPoliceContractAddress.call(results[0]),
					mup.instance.getCitizenContractAddress.call(results[1])
				])
			})
			.then(results => {
				return Promise.all([
					police.artifact.at(results[0]),
					citizen.artifact.at(results[1])
				])
			})
			.then(results => {
				let policeInstance = results[0];
				activeSuspect = results[1];
				policeInstance.addSuspectToCase(activeSuspect.address, activeCase.address)
					.then(tx => {
						assert(!!tx);
						return done();
					})
			})
		});

		it("Should add accussed to case", function (done) {
			activeCop.accuseCitizen(activeSuspect.address, activeCase.address)
				.then(tx => {
					assert(!!tx);
					return done();
				})
		});

		it("Should be able to request a felony verdict", function (done) {
			activeCop.requestVerdict(activeCase.address, 'felony', 100000)
				.then(tx => {
					assert(!!tx);
					return done();		
				}) 
		});

		it("Citizen should be in jail", function (done) {
			activeSuspect.isInJail.call()
				.then(bool => {
					assert(bool);
					return done();
				})
		})

	})
}