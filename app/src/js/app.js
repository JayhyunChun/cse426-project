App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  address: "",
  url: 'http://127.0.0.1:7545',
  currentAccount: null,
  balance: 0,

  init: function () {
    console.log("initialized");
    return App.initWeb3();
  },

  initWeb3: async function () {
    if (typeof window.ethereum !== 'undefined') {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error('User denied account access');
      }
    } else if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: async function () {
    try {
      const erc1155Data = await $.getJSON('../abis/ERC1155_token.json');
  
      App.contracts.ERC1155_token = TruffleContract(erc1155Data);
  
      App.contracts.ERC1155_token.setProvider(App.web3Provider);
  
      App.currentAccount = await web3.eth.getCoinbase();
      jQuery('#current_account').text(App.currentAccount);
      const balance = await web3.eth.getBalance(App.currentAccount);
      const balanceInEther = web3.utils.fromWei(balance, 'ether');
      jQuery('#ethBalance').text(balanceInEther);
      App.DisplaySkins();
      App.DisplayCharacters();
      App.toggleGameMasterDiv();
      console.log(App.currentAccount);
      return App.bindEvents();
    } catch (error) {
      console.error('Error initializing contracts:', error);
    }
  },

  bindEvents: function () {
    $(document).on('click', '#registerCharacter', App.registerCharacter);
    $(document).on('click', '#SearchItemPrice', App.SearchItemPrice);
    $(document).on('click', '#buyInGameItem', App.buyInGameItem);
    $(document).on('click', '#registerNFTSkin', App.registerNFTSkin);
    $(document).on('click', '#searchSkinPrice', App.searchSkinPrice);
    $(document).on('click', '#buySkin', App.buyNFTSkin);
    $(document).on('click', '#searchCharacterPrice', App.searchCharacterPrice);
    $(document).on('click', '#buyCharacter', App.buyCharacter);
    $(document).on('click', '#changeCharacterPrice', App.changeCharacterPrice);
    $(document).on('click', '#registerCharacterOnMarket', App.registerCharacterOnMarket);
    $(document).on('click', '#cancelCharacterRegistration', App.cancelCharacterRegistration);
    $(document).on('click', '#showAllSkins', App.showAllSkins);
    $(document).on('click', '#changeSkinPrice', App.changeSkinPrice);
    $(document).on('click', '#registerSkinOnMarket', App.registerSkinOnMarket);
    $(document).on('click', '#cancelSkinRegistration', App.cancelSkinRegistration);
    $(document).on('click', '#TransferSkin', App.TransferSkin);
    $(document).on('click', '#UnregisterCharacter', App.UnregisterCharacter);
    $(document).on('click', '#GiveGold', App.GiveGold);
  },

  registerCharacter: async function() {
    try {
        const characterName = document.getElementById('characterName').value;

        const response = await fetch(`/CharExist/${characterName}`);
        const exist = await response.json();

        if (exist) {
          alert("Character name already exists");
          return
        }

        const instance = await App.contracts.ERC1155_token.deployed();
        const result = await instance.registerCharacter({ from: App.currentAccount });
        var tokenId = 0;
        const events = result.logs;
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            if (event.event === "CharacterRegistered") {
                tokenId = event.args.tokenId.toNumber();
                alert(`Character: ${characterName} Registered with TokenId: ${tokenId}`);
                break;
            }
        }
        fetch('/addCharacter', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({name: characterName, token: tokenId, SkinList: [], Owner: App.currentAccount }),
      })
      location.reload();
    } catch (error) {
        console.error(error);
        throw error;
    }
  },

    SearchItemPrice: function() {
      //no
    },

    buyInGameItem: function() {
      //no
    },

  registerNFTSkin: async function() {
    try {
      const skinName = document.getElementById('skinName').value;
      const skinUri = document.getElementById('skinUri').value;
      const price = document.getElementById('skinPrice').value;
      const priceInWei = web3.utils.toWei(price.toString(), 'ether');
      
      const response = await fetch(`/SkinExist/${skinName}`);
      const exist = await response.json();

      if (exist) {
        alert("Skin name already exists");
        return
      }

      var tokenId = 0;
      const instance = await App.contracts.ERC1155_token.deployed();
      const result = await instance.mintNFT(skinUri, priceInWei,{ from: App.currentAccount, gas: 5000000 });
  
      const events = result.logs;
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (event.event === "SkinRegistered") { 
          tokenId = event.args.tokenId.toNumber();
          alert(`Skin: ${skinName} Registered with TokenId: ${tokenId}`);
          break;
        }   
      }
      fetch('/addSkin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({name: skinName, token: tokenId, Owner: App.currentAccount }),
    })
      location.reload();
    } catch (error) {
        console.error(error);
        throw error;
    }
  },

    searchSkinPrice: async function() {
      try {
        const searchSkin = document.getElementById('searchSkin').value;
        const response = await fetch(`/findSkin/${searchSkin}`);
        const skinID = await response.json();
    
        if (response.status === 404) {
          alert('Skin does not exist! Check the skin name.');
          return;
        }        
        const instance = await App.contracts.ERC1155_token.deployed();
        var price = await instance.searchSkinPrice(skinID, { from: App.currentAccount, gas: 5000000 });
        price = price/ 1e18;
    
        alert(`Price: ${price} ETH`);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    buyNFTSkin: async function() {
      try {
        const searchSkin = document.getElementById('searchSkin').value;
        const response = await fetch(`/findSkin/${searchSkin}`);
        const skinID = await response.json();
    
        if (response.status === 404) {
          alert('Skin does not exist! Check the skin name.');
          return;
        }    
        const instance = await App.contracts.ERC1155_token.deployed();
        const price = await instance.searchSkinPrice(skinID, { from: App.currentAccount, gas: 5000000 });
        const OwnerJS = await fetch(`/SkinOwner/${searchSkin}`);
        const Owner = await OwnerJS.json();
        await instance.setup(App.currentAccount, {from:Owner, gas: 5000000 });        
        await instance.buyNFT(skinID, { value:price, from: App.currentAccount, gas: 5000000 });
        fetch('/updateSkinOwner', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              SkinName: searchSkin,
              newOwner: App.currentAccount,
          }),
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
    
        alert(`Skin: ${searchSkin} Purchase Success`);
        location.reload();
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    searchCharacterPrice: async function() {
      try {
        const searchCharacter = document.getElementById('searchCharacter').value;
        const response = await fetch(`/findCharacter/${searchCharacter}`);
        const charID = await response.json();
    
        if (response.status === 404) {
          alert('Character does not exist! Check the character name.');
          return;
        }
        
        const instance = await App.contracts.ERC1155_token.deployed();
        var price = await instance.searchCharacter(charID, { from: App.currentAccount, gas: 5000000 });
        price = price/ 1e18;
    
        alert(`Character Price: ${price} ETH`);
        return price;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    buyCharacter: async function() {
      try {
        const searchCharacter = document.getElementById('searchCharacter').value;
        const response = await fetch(`/findCharacter/${searchCharacter}`);
        const charID = await response.json();
    
        if (response.status === 404) {
          alert('Character does not exist! Check the character name.');
          return;
        }
        const instance = await App.contracts.ERC1155_token.deployed();
        const price = await instance.searchCharacter(charID, { from: App.currentAccount, gas: 5000000 });
        // const priceInWei = web3.utils.toWei(price.toString(), 'ether');
        const OwnerJS = await fetch(`/Owner/${searchCharacter}`);
        const Owner = await OwnerJS.json();
        await instance.set(App.currentAccount, {from:Owner, gas: 5000000 });
        await instance.buyCharacter(charID, { value: price, from: App.currentAccount, gas: 5000000 });
        fetch('/updateCharacterOwner', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              characterName: searchCharacter,
              newOwner: App.currentAccount,
          }),
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));

        alert(`Character: ${searchCharacter} Purchase Success`);
        location.reload();
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    changeCharacterPrice: async function() {
      try {
        const searchCharacter = document.getElementById('myCharName').value;
        const response = await fetch(`/findCharacter/${searchCharacter}`);
        const charID = await response.json();
    
        if (response.status === 404) {
          alert('Character does not exist! Check the character name.');
          return;
        }

        const price = document.getElementById('characterPrice').value; 
        const priceInWei = web3.utils.toWei(price.toString(), 'ether');

        const instance = await App.contracts.ERC1155_token.deployed();
        await instance.changeCharacterPrice(charID, priceInWei, { from: App.currentAccount, gas: 5000000 });

        alert(`Character: ${searchCharacter} Price Changed to ${price}`);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    registerCharacterOnMarket: async function() {
      try {
        const searchCharacter = document.getElementById('myCharName').value;
        const response = await fetch(`/findCharacter/${searchCharacter}`);
        const charID = await response.json();
    
        if (response.status === 404) {
          alert('Character does not exist! Check the character name.');
          return;
        }

        const instance = await App.contracts.ERC1155_token.deployed();
        await instance.DisplayCharacterForSale(charID, { from: App.currentAccount, gas: 5000000 });

        alert(`Character: ${searchCharacter} Register Success`);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    cancelCharacterRegistration: async function() {
      try {
        const searchCharacter = document.getElementById('myCharName').value;
        const response = await fetch(`/findCharacter/${searchCharacter}`);
        const charID = await response.json();
    
        if (response.status === 404) {
          alert('Character does not exist! Check the character name.');
          return;
        }

        const instance = await App.contracts.ERC1155_token.deployed();
        await instance.UndisplayCharacter(charID, { from: App.currentAccount, gas: 5000000 });

        alert(`Character: ${searchCharacter} Register Canceled`);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    showAllSkins: async function() {
      try {
        const searchCharacter = document.getElementById('myCharName').value;
        const response = await fetch(`/findCharacter/${searchCharacter}`);
        const charID = await response.json();
    
        if (response.status === 404) {
          alert('Character does not exist! Check the character name.');
          return;
        }

        const instance = await App.contracts.ERC1155_token.deployed();
        const skinList = await instance.howAllSkinsOwnedByCharacter(charID, { from: App.currentAccount, gas: 5000000 });
        alert(`skinList: ${skinList} `);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    changeSkinPrice: async function() {
      try {
        const searchSkin = document.getElementById('mySkinName').value;
        const response = await fetch(`/findSkin/${searchSkin}`);
        const skinID = await response.json();
    
        if (response.status === 404) {
          alert('Skin does not exist! Check the skin name.');
          return;
        }    

        const price = document.getElementById('changeskinPrice').value;
        const priceInWei = web3.utils.toWei(price.toString(), 'ether');
        
        console.log(priceInWei);

        const instance = await App.contracts.ERC1155_token.deployed();
        await instance.changeTokenPrice(skinID, priceInWei, { from: App.currentAccount, gas: 5000000 });
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    registerSkinOnMarket: async function() {
      try {
        const searchSkin = document.getElementById('mySkinName').value;
        const response = await fetch(`/findSkin/${searchSkin}`);
        const skinID = await response.json();
    
        if (response.status === 404) {
          alert('Skin does not exist! Check the skin name.');
          return;
        }    
        
        const instance = await App.contracts.ERC1155_token.deployed();
        await instance.DisplayItem(skinID, { from: App.currentAccount, gas: 5000000 });
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    cancelSkinRegistration: async function() {
      try {
        const searchSkin = document.getElementById('mySkinName').value;
        const response = await fetch(`/findSkin/${searchSkin}`);
        const skinID = await response.json();
    
        if (response.status === 404) {
          console.log('Skin does not exist! Check the skin name.');
          return;
        }    
        
        const instance = await App.contracts.ERC1155_token.deployed();
        await instance.UndisplayItem(skinID, { from: App.currentAccount, gas: 5000000 });
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    toggleGameMasterDiv: async function() {
      const instance = await App.contracts.ERC1155_token.deployed();
      const isGameMaster = await instance.IsGameMaster({ from: App.currentAccount, gas: 5000000 });
      const gameMasterDiv = document.getElementById('gameMasterDiv');
      const registerForm = document.getElementById('registerForm');
      const buyInGameItemsForm = document.getElementById('buyInGameItemsForm');
      const nftSkinForm = document.getElementById('nftSkinForm');
      const buySkinForm = document.getElementById('buySkinForm');
      const buyCharacterForm = document.getElementById('buyCharacterForm');
      const characterInfo = document.getElementById('characterInfo');
  
      if (isGameMaster) {
          console.log('Game Master');
          gameMasterDiv.style.display = 'block';
          registerForm.style.display = 'none';
          buyInGameItemsForm.style.display = 'none';
          nftSkinForm.style.display = 'none';
          buySkinForm.style.display = 'none';
          buyCharacterForm.style.display = 'none';
          characterInfo.style.display = 'none';
      } else {
          gameMasterDiv.style.display = 'none';
          registerForm.style.display = 'block';
          buyInGameItemsForm.style.display = 'block';
          nftSkinForm.style.display = 'block';
          buySkinForm.style.display = 'block';
          buyCharacterForm.style.display = 'block';
          characterInfo.style.display = 'block';
      }
    },

    TransferSkin: function() {
      //no
    },

    GiveGold: async function() {
      var addr = document.getElementById('GoldAddress').value;
      const instance = await App.contracts.ERC1155_token.deployed();
      await instance.GiveGold_to_User(addr, { from: App.currentAccount, gas: 5000000 });    
    },

    UnregisterCharacter: async function() {
      try{
      const GMchar = document.getElementById('GMchar').value;
      const response = await fetch(`/findCharacter/${GMchar}`);
      const charID = await response.json();

      const r = await fetch(`/Owner/${GMchar}`);
      const owner = await r.json();
  
      if (response.status === 404) {
        console.log('Character does not exist! Check the character name.');
        return;
      }
      const instance = await App.contracts.ERC1155_token.deployed();
      await instance.unregisterCharacter(owner, charID, {from:App.currentAccount});
      await fetch(`/deleteCharacter/${GMchar}`, {
        method: 'DELETE'
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log(data);
        })
        .catch(error => {
          console.error('There has been a problem with your fetch operation:', error);
        });
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    DisplaySkins: async function() {
      response = await fetch(`/findSkinsbyOwner/${App.currentAccount}`);
      const ownedSkinsData = await response.json();
      const ownedSkinsList = document.getElementById('ownedSkinsList');
      ownedSkinsData.forEach(skin => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <strong>Name:</strong> ${skin.name}
        `;
        ownedSkinsList.appendChild(listItem);
      });
    },

    DisplayCharacters: async function() {
      response = await fetch(`/findCharactersbyOwner/${App.currentAccount}`);
      const ownedCharactersData = await response.json();
      const ownedCharactersList = document.getElementById('ownedCharactersList');
      ownedCharactersData.forEach(char => {
        const listItem = document.createElement('li');
        if (char.skinList === undefined) {
          char.skinList = '[]';
        }
        listItem.innerHTML = `
            <strong>Name:</strong> ${char.name}, 
            <strong>Skin List:</strong> ${char.skinList}
        `;
        ownedCharactersList.appendChild(listItem);
      });
    }
  };
  
  $(function () {
    $(window).on('load', function () {
      App.init();
  });
  });
  
  // code for reloading the page on account change
  window.ethereum.on('accountsChanged', function (){
    location.reload();
  })