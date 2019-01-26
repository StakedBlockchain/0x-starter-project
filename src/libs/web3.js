import Web3 from 'web3';

let web3 = null;
if (typeof window.web3 !== 'undefined') {
  if (window.web3.currentProvider.isMetaMask === true) {
    web3 = new Web3(window.web3.currentProvider);
  }
} else {
  alert('MetaMaskをインストールしてください');
}

export default web3;