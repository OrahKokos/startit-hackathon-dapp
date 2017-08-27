pragma solidity ^0.4.2;

import "./Citizen.sol";
import "./Case.sol";
import './Mup.sol';

contract Police {
	address public contractOwner;
	address public owner;

	bytes32 testValue;

	mapping (address => bool) cases;
	mapping (uint => address) casesMapping;
	uint casesCount = 0;

	modifier onlyContractOwner {
    require(msg.sender == contractOwner);
    _;
  }

	modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

	function Police (address _citizenAddress) {
		contractOwner = msg.sender;
		owner = _citizenAddress;
	}

	function test(bytes32 _testValue) onlyOwner {
		testValue = _testValue;
	}

	function assignCase(address _caseAddress) onlyContractOwner {
		casesMapping[casesCount] = _caseAddress;
		cases[_caseAddress] = false;
		casesCount++;
	}

	function requestVerdict(address _caseAddress, bytes32 _type, uint _fee) {
		Mup(contractOwner).requestVerdict(_caseAddress, _type, _fee);
	}

	function accuseCitizen(address _witnessContractAddress, address _caseContractAddress) {
		Case(_caseContractAddress).accuse(_witnessContractAddress);
	}

	function addWitnessToCase(address _witnessContractAddress, address _caseContractAddress) {
		Case(_caseContractAddress).addWitness(_witnessContractAddress);
	}

	function addSuspectToCase(address _suspectContractAddress, address _caseContractAddress) {
		Case(_caseContractAddress).addSuspect(_suspectContractAddress);
	}

	function getCasesCount() onlyOwner returns (uint){
		return casesCount;
	}

	function fire() onlyContractOwner {
		suicide(contractOwner);
	}

	function citizenData(address _targetContractAddress, address _caseContractAddress) onlyOwner
	returns (bytes32, bytes32, uint, uint, address) {
		bytes32 prop1;
		bytes32 prop2;
		uint prop3;
		uint prop4;
		address prop5;
		( prop1, prop2, prop3, prop4, prop5 ) = Citizen(_targetContractAddress).readData(_caseContractAddress, owner);
		return (prop1, prop2, prop3, prop4, prop5);
	}
}