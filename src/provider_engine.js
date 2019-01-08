import { RPCSubprovider, Web3ProviderEngine } from '0x.js';
import { MetamaskSubprovider, MnemonicWalletSubprovider } from '@0x/subproviders';

import { BASE_DERIVATION_PATH, MNEMONIC, NETWORK_CONFIGS } from './configs';

export const mnemonicWallet = new MnemonicWalletSubprovider({
    mnemonic: MNEMONIC,
    baseDerivationPath: BASE_DERIVATION_PATH,
});

export const pe = new Web3ProviderEngine();
pe.addProvider(mnemonicWallet);
pe.addProvider(new RPCSubprovider(NETWORK_CONFIGS.rpcUrl));
pe.start();

export const providerEngine = pe;

export function mnemonicWalletProvider() {
    const pe = new Web3ProviderEngine();
    pe.addProvider(mnemonicWallet);
    pe.addProvider(new RPCSubprovider(NETWORK_CONFIGS.rpcUrl));
    pe.start();

    return pe;
}

export function metamaskProvider(provider) {
    const signer = new MetamaskSubprovider(provider);
    const pe = new Web3ProviderEngine();
    pe.addProvider(signer);
    pe.addProvider(new RPCSubprovider(NETWORK_CONFIGS.rpcUrl));
    pe.start();

    return pe;
}