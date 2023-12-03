const ERC20_token = artifacts.require("ERC20_token");
const ERC721_token = artifacts.require("ERC721_token");
const ERC1155_token = artifacts.require("ERC1155_token");

module.exports = function(deployer) {

  deployer.deploy(ERC20_token).then(() => {
    return deployer.deploy(ERC721_token).then(() => {
      return deployer.deploy(ERC1155_token, ERC20_token.address, ERC721_token.address);
    });
  });
};