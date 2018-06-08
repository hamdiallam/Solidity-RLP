var rlp = artifacts.require("RLPReader");

module.exports = function(deployer) {
    deployer.deploy(rlp)
};
