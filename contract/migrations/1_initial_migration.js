var Migrations = artifacts.require("./Migrations.sol");
var Mup = artifacts.require("./Mup.sol");
var Citizen = artifacts.require("./Citizen.sol");
var Police = artifacts.require("./Police.sol");
var Case = artifacts.require("./Case.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Mup);
  deployer.deploy(Citizen);
  deployer.deploy(Police);
  deployer.deploy(Case);
};
