pragma solidity ^0.4.2;

import './Citizen.sol';

contract Case {

	uint public id;
	bytes32 public lawHash;
	address public owner;
	bytes32 public crimeType;
	uint public fee = 0;
	bool public isFinalState = false;
	address public accused;

	mapping (address => bool) police;
	mapping (uint => address) policeMapping;
	uint policeCount = 0;

	mapping (address => address) witnesses;
	mapping (uint => address) witnessesMapping;
	uint witnessCount = 0;	

	mapping (address => address) suspects;
	mapping (uint => address) suspectsMapping;
	uint suspectCount = 0;

	event VerdictReached(address accused, uint id, bytes32 crimeType, uint fee);
	event Payed(address payer, uint fee);

	modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  modifier onlyCasePolice {
    require(police[msg.sender] == true);
    _;
  }

	function Case(uint _id, bytes32 _lawHash) {
		id = _id;
		lawHash = _lawHash;
		owner = msg.sender;
	}

	function verdict(bytes32 _type, uint _fee) {
		isFinalState = true;
		crimeType = _type;
		fee = _fee;
		VerdictReached(accused, id, crimeType, fee);
		Citizen(accused).addCrime(crimeType, _fee);
	}

	function assignPolice(address _policeAddress) onlyOwner {
		if (police[_policeAddress] == true) revert();
		policeMapping[policeCount] = _policeAddress;
		police[_policeAddress] = true;
		policeCount++;
	}

	


	function addWitness(address _witnessAddress) onlyCasePolice {
		if (witnesses[_witnessAddress] != address(0)) revert();
		witnessesMapping[witnessCount] = _witnessAddress;
		witnesses[_witnessAddress] = msg.sender;
		witnessCount++;
	}

	function addSuspect(address _suspectAddress) onlyCasePolice {
		if (suspects[_suspectAddress] != address(0)) revert();
		suspectsMapping[suspectCount] = _suspectAddress;
		suspects[_suspectAddress] = msg.sender;
		suspectCount++;
	}

	function accuse(address _suspectAddress) onlyCasePolice {
		if (suspects[_suspectAddress] == address(0)) revert();
		accused = _suspectAddress;
	}

	function close () onlyOwner {
		suicide(owner);
	}

	function getWitnessCount() constant returns (uint) {
		return witnessCount;
	}

	function getSuspectCount() constant returns (uint) {
		return witnessCount;
	}

	function getSuspectMapping(uint _id) returns (address){
		return suspectsMapping[_id];
	}	

	function getWitnessMapping(uint _id) returns (address){
		return witnessesMapping[_id];
	}

	function getPoliceMapping(uint _id) returns (address){
		return policeMapping[_id];
	}

	function getSuspectContract(address _citizenAddres) onlyCasePolice returns (address) {
		return suspects[_citizenAddres];
	}

	function isOnCase(address _policeAddress) returns (bool){
		return police[_policeAddress];
	}

	function getBalance() returns (uint) {
		return this.balance;
	}

	function () payable {
		if (!isFinalState) revert();
		if (msg.value < fee) revert();
		Payed(msg.sender, msg.value);
	}
} 