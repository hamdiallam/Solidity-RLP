var rlp = artifacts.require("RLPReader");
var helper = artifacts.require("Helper");

module.exports = function(deployer) {
    deployer.deploy(helper);
    deployer.link(helper, rlp);
    deployer.deploy(rlp);
};
