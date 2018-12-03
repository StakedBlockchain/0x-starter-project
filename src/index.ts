import {
    assetDataUtils,
    BigNumber,
    ContractWrappers,
    DecodedLogEvent,
    ExchangeCancelEventArgs,
    ExchangeEvents,
    ExchangeFillEventArgs,
    generatePseudoRandomSalt,
    Order,
    orderHashUtils,
    signatureUtils,
    SignedOrder,
} from '0x.js';
import { APIOrder, OrderbookResponse } from '@0x/connect';
import { Web3Wrapper } from '@0x/web3-wrapper';

import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as request from 'request';

import { DECIMALS, NULL_ADDRESS, ZERO } from './constants';
import { getContractAddressesForNetwork, getContractWrappersConfig } from './contracts';
import { getRandomFutureDateInSeconds } from './utils';
import { NETWORK_CONFIGS, TX_DEFAULTS } from './configs';
import { providerEngine } from './provider_engine';

const HTTP_OK_STATUS = 200;
const HTTP_BAD_REQUEST_STATUS = 400;
const HTTP_PORT = 3001;
// const RELAYER_URL = 'https://api.kovan.radarrelay.com/0x/v2';
const RELAYER_URL = 'http://localhost:3000/v2';

// Global state
const orders: SignedOrder[] = [];
const ordersByHash: { [hash: string]: SignedOrder } = {};

// HTTP Server
const app = express();
app.use(bodyParser.json());

app.get('/v2/order', async (req, res) => {
    console.log('HTTP: GET order');
    const makerAssetProxyId = req.query.makerAssetProxyId;
    const takerAssetProxyId = req.query.takerAssetProxyId;

    const option = {
        url: RELAYER_URL + '/orders',
        method: 'GET',
    };
    request(option, (err, response, body) => {
        if (err) {
            res.status(HTTP_BAD_REQUEST_STATUS).send({});
        }

        res.status(HTTP_OK_STATUS).send(body);
    });
});

app.post('/v2/order', async (req, res) => {
    console.log('HTTP: POST order');

    /*
    {exchange: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
     erc20Proxy: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
     erc721Proxy: '0x1d7022f5b17d2f8b695918fb48fa1089c9f85401',
     zrxToken: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
     etherToken: '0x0b1ba0af832d7c05fd64161e0db78e85978e8082',
     assetProxyOwner: '0x34d402f14d58e001d8efbe6585051bf9706aa064',
     forwarder: '0xb69e673309512a9d726f87304c6984054f87a93b',
     orderValidator: '0xe86bb98fcf9bff3512c74589b78fb168200cc546'}
    */

    // Initialize the ContractWrappers, this provides helper functions around calling
    const contractWrappers = new ContractWrappers(providerEngine, getContractWrappersConfig(NETWORK_CONFIGS.networkId));
    const web3Wrapper = new Web3Wrapper(providerEngine);
    const [maker, taker] = await web3Wrapper.getAvailableAddressesAsync();
    const contractAddresses = getContractAddressesForNetwork(NETWORK_CONFIGS.networkId);
    const makerTokenAddress = contractAddresses.zrxToken;
    const takerTokenAddress = contractAddresses.etherToken;

    // Initialize the Web3Wrapper, this provides helper functions around fetching
    const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
    const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);
    // the amount the maker is selling of maker asset
    const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), DECIMALS);
    // the amount the maker wants of taker asset
    const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(0.1), DECIMALS);

    // Allow the 0x ERC20 Proxy to move ZRX on behalf of makerAccount
    const makerZRXApprovalTxHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
        makerTokenAddress,
        maker,
    );
    await web3Wrapper.awaitTransactionSuccessAsync(makerZRXApprovalTxHash);

    // Allow the 0x ERC20 Proxy to move WETH on behalf of takerAccount
    const takerWETHApprovalTxHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
        takerTokenAddress,
        taker,
    );
    await web3Wrapper.awaitTransactionSuccessAsync(takerWETHApprovalTxHash);

    // Convert ETH into WETH for taker by depositing ETH into the WETH contract
    const takerWETHDepositTxHash = await contractWrappers.etherToken.depositAsync(
        takerTokenAddress,
        takerAssetAmount,
        taker,
    );
    await web3Wrapper.awaitTransactionSuccessAsync(takerWETHDepositTxHash);

    // Set up the Order and fill it
    const randomExpiration = getRandomFutureDateInSeconds();
    const exchangeAddress = contractAddresses.exchange;

    // Create the order
    const order: Order = {
        exchangeAddress,
        makerAddress: maker,
        takerAddress: NULL_ADDRESS,
        senderAddress: NULL_ADDRESS,
        feeRecipientAddress: NULL_ADDRESS,
        expirationTimeSeconds: randomExpiration,
        salt: generatePseudoRandomSalt(),
        makerAssetAmount,
        takerAssetAmount,
        makerAssetData,
        takerAssetData,
        makerFee: ZERO,
        takerFee: ZERO,
    };

    // Generate the order hash and sign it
    const orderHashHex = orderHashUtils.getOrderHashHex(order);
    const signature = await signatureUtils.ecSignHashAsync(providerEngine, orderHashHex, maker);
    const signedOrder = { ...order, signature };

    await contractWrappers.exchange.validateFillOrderThrowIfInvalidAsync(signedOrder, takerAssetAmount, taker);

    const txHash = await contractWrappers.exchange.fillOrderAsync(signedOrder, takerAssetAmount, taker, {
        gasLimit: TX_DEFAULTS.gas,
    });
    await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    const option = {
        url: RELAYER_URL + '/order',
        method: 'POST',
        body: signedOrder,
        json: true,
    };
    request(option, (err, response, body) => {
        if (err) {
            res.status(HTTP_BAD_REQUEST_STATUS).send({});
        }

        res.status(HTTP_OK_STATUS).send(body);
    });

    // Stop the Provider Engine
    providerEngine.stop();
});

app.listen(HTTP_PORT, () => console.log(`API (HTTP) listening on port ${HTTP_PORT}!`));
