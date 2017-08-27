pragma solidity ^0.4.2;

import "./Case.sol";
import "./Case.sol";
import './Mup.sol';


contract Citizen {

	bytes32 private name;
	bytes32 private homeAddress;
	uint private id;
	bool private isGovWorker = false;
	bool public isInJail = false;
	address private occupationAddress;

	address public contractOwner;
	address public owner;

	mapping (address => uint) crimes;
	mapping (uint => address) crimesMapping;
	uint private crimesCount = 0;

	event CrimeAdded(address caseAddress);
	event Jailed(address caseAddress);
	event DataRead(address policeOfficer, address caseAddress);
	event NewJob(address _occupationAddress);

	modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  modifier onlyContractOwner {
    require(msg.sender == contractOwner);
    _;
  }

	function Citizen(address citizenAddress, bytes32 _name, bytes32 _homeAddress, uint _id) {
		owner = citizenAddress;
		contractOwner = msg.sender;
		name = _name;
		homeAddress = _homeAddress;
		id = _id;
	}

	function addGovJob(address _occupationAddress) public onlyContractOwner {
		isGovWorker = true;
		occupationAddress = _occupationAddress;
		NewJob(occupationAddress);
	}

	function payFine(address _caseContractAddress) payable {
		_caseContractAddress.transfer(msg.value);
	}

	function addCrime(bytes32 _type, uint _fine) {
		crimesMapping[crimesCount] = msg.sender;
		crimes[msg.sender] = _fine;
		CrimeAdded(msg.sender);
		if (_type == 'felony') {
			isInJail = true;
			Jailed(msg.sender);
		}
		if (_type == 'fine') {
			crimes[msg.sender] = _fine;
		}
		crimesCount++;
	}

	function getCrimeMapping(uint _id) returns (address){
		return crimesMapping[_id];
	}

	function getCrimeCount() constant returns(uint) {
		return crimesCount;
	}

	function getCrimeFee(address _caseContractAddress) returns(uint) {
		return crimes[_caseContractAddress];
	}

	function getCitizenInfo() onlyOwner returns (bytes32, bytes32, uint, uint, address) {
		return (name, homeAddress, id, crimesCount, occupationAddress);
	}

	function readData(address _caseContractAddress, address _owner) constant returns (bytes32, bytes32, uint, uint, address) {
		bool pExists = Mup(contractOwner).checkIfPoliceExists(_owner);
		bool cExists = Case(_caseContractAddress).isOnCase(msg.sender);
		if (pExists && cExists) {
			return (name, homeAddress, id, crimesCount, occupationAddress);
		} else {
			return ("", "", 0, 0, address(0));
		}
	}

}