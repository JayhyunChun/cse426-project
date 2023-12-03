const HDWalletProvider = require('@truffle/hdwallet-provider');
mnemonic = 'furnace run release remind end nut main funny marriage horse above festival'; // Mnemonic of Jay Chun

module.exports = {
  networks: {
    // Ganache
    development: {
     host: "localhost",     // Localhost (default: none)
     port: 7545,            // Standard Ethereum port (default: none)
     network_id: "5777",       // Any network (default: none)
    },

    // Sepolia
    sepolia: {
      provider: () =>
        new HDWalletProvider(
          mnemonic,
          'https://sepolia.infura.io/v3/89e1c537f1494ed8a2a9b87f1a61f813'
        ), // Change to Sepolia Infura URL
      network_id: 11155111, // Sepolia network ID
      skipDryRun: false,
      gas: 10000000
    }
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.19",      // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled:
  // false to enabled: true. The default storage location can also be
  // overridden by specifying the adapter settings, as shown in the commented code below.
  //
  // NOTE: It is not possible to migrate your contracts to truffle DB and you should
  // make a backup of your artifacts to a safe location before enabling this feature.
  //
  // After you backed up your artifacts you can utilize db by running migrate as follows:
  // $ truffle migrate --reset --compile-all
  //
  // db: {
  //   enabled: false,
  //   host: "127.0.0.1",
  //   adapter: {
  //     name: "indexeddb",
  //     settings: {
  //       directory: ".db"
  //     }
  //   }
  // }
};
