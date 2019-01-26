export default class Web3Utils {
  static async isKovanNetwork(web3) {
    if (web3 != null) {
      let network = await web3.eth.net.getNetworkType();
      if (network === 'kovan') {
        return true;
      } else {
        return false;
      }

      // web3.eth.net.getNetworkType().then(network => {
      //   if (network === 'kovan') {
      //     return true;
      //   } else {
      //     return false;
      //   }
      // });
    }
  }
}