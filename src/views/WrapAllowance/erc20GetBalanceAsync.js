import erc20GetBalanceAbi from "./erc20GetBalanceAbi";
import {
  BigNumber
} from "0x.js";
import web3 from "../../libs/web3";

export async function getErc20BalanceAsync(walletAddress, tokenAddress) {
  const contract = new web3.eth.Contract(erc20GetBalanceAbi, tokenAddress);
  const balance = await contract.methods.balanceOf(walletAddress).call();
  const decimals = await contract.methods.decimals().call();

  return new BigNumber(balance).div(10 ** decimals).toString();
}