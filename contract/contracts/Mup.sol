pragma solidity ^0.4.2;

import './Citizen.sol';
import './Police.sol';
import './Case.sol';

contract Mup {

	address public owner;
	Citizen citizen;
	
	mapping (address => address) citizens;
	mapping (uint => address) citizensMapping;
	uint public citizensCount = 0;

	mapping (address => address) cases;
	mapping (uint => address) casesMapping;
	uint public casesCount = 0;

	mapping (address => address) police;
	mapping (uint => address) policeMapping;
	uint public policeCount = 0;

	mapping (bytes32 => bytes32) laws;
	mapping (uint => bytes32) lawsMapping;
	uint public lawCount = 0;

	event CitizensRegistered(uint id, address contractAddress);
	event PoliceRegistered(uint id, address contractAddress);
	event CaseRegistered(uint id, address contractAddress);
	event LawPassed(bytes32 lawHash);
	event PoliceFired(uint id, address contractAddress);
	event PaymentReceived(address sender, uint value);

	modifier onlyOwner {
      require(msg.sender == owner);
      _;
  }
    
  modifier onlyPoliceContracts {
      require(police[msg.sender] != address(0));
      _;
  }

  modifier onlyCitizen {
      require(citizens[msg.sender] != address(0));
      _;
  }

	function Mup() {
		owner = msg.sender;
	}

	// create new

	function registerLaw(bytes32 lawId, bytes32 lawHash) onlyOwner {
		lawsMapping[lawCount] = lawId;
		laws[lawId] = lawHash;
		lawCount++;
		LawPassed(lawHash);
	}

	function removeLaw(bytes32 lawId) onlyOwner {
		delete laws[lawId];
	}

	function registerCitizen(address _citizenAddress, bytes32 _name, bytes32 _homeAddress, uint _id) onlyOwner {
		citizensMapping[citizensCount] = _citizenAddress;
		citizens[_citizenAddress] = new Citizen(_citizenAddress, _name, _homeAddress, _id);
		CitizensRegistered(citizensCount, citizens[_citizenAddress]);
		citizensCount++;
	}

	function registerPolice(address _citizenContractAddress) onlyOwner {
		if (police[_citizenContractAddress] != address(0)) revert();
		policeMapping[policeCount] = _citizenContractAddress;
		police[_citizenContractAddress] = new Police(_citizenContractAddress);
		Citizen(_citizenContractAddress).addGovJob(police[_citizenContractAddress]);
		PoliceRegistered(policeCount, _citizenContractAddress); // replace this with instance;
		policeCount++;
	}


	function registerCase(bytes32 _lawId) onlyOwner {
    if (laws[_lawId] == "") revert();
    address caseAddress = new Case(casesCount, laws[_lawId]);
    casesMapping[casesCount] = caseAddress;
    cases[caseAddress] = msg.sender;
		CaseRegistered(casesCount, casesMapping[casesCount]);
		casesCount++;
	}
	// delete

	function closeCase(uint id, address caseAddress) onlyOwner {
		// call suicide
		Case(caseAddress).close();
		delete casesMapping[id];
		delete cases[caseAddress];
	}

	function firePolice(uint id, address _citizenContractAddress) onlyOwner {
		if (police[_citizenContractAddress] == address(0)) revert();
		Police(police[_citizenContractAddress]).fire();
		delete policeMapping[id];
		delete police[_citizenContractAddress];
		PoliceFired(id, _citizenContractAddress);
	}

	// counters

	function getCitizensCount() public constant returns(uint) {
		return citizensCount;
	}

	function getPoliceCount() public constant returns(uint) {
		return policeCount;
	}

	function getCasesCount() public constant returns(uint) {
		return casesCount;
	}

	function getLawCount() public constant returns(uint) {
		return lawCount;
	}

	//getters citizens

	function getCitizenMapping(uint id) returns (address) {
		return citizensMapping[id];
	}

	function getCitizenContractAddress(address citizenAddress) returns (address) {
		return citizens[citizenAddress];
	}

	// getters police

	function getLaw(bytes32 id) returns (bytes32) {
		return laws[id];
	}

	function getPoliceMapping(uint id) returns (address) {
		return policeMapping[id];
	}

	function getPoliceContractAddress(address _citizenContractAddress) returns (address) {
		return police[_citizenContractAddress];
	}

	function checkIfPoliceExists(address policeAddress) returns (bool) {
		if (police[policeAddress] == address(0)) return false;
		return true;
	}

	function getCaseMapping(uint id) returns (address) {
		return casesMapping[id];
	}

	function getCaseContractAddress(address caseAddress) returns (address) {
		return cases[caseAddress];
	}

	function assignPoliceToCase(address _policeContractAddress, address _caseContractAddress) onlyOwner {
		Police(_policeContractAddress).assignCase(_caseContractAddress);
		Case(_caseContractAddress).assignPolice(_policeContractAddress);
	}

	function requestVerdict(address _caseContractAddress, bytes32 _type, uint _fee) {
		Case(_caseContractAddress).verdict(_type, _fee);
	}

	function getBalance() returns (uint) {
		return this.balance;
	}

	function() payable {
		PaymentReceived(msg.sender, msg.value);
	}
}