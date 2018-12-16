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

import { NETWORK_CONFIGS, TX_DEFAULTS } from './configs';
import { DECIMALS, NULL_ADDRESS, ZERO } from './constants';
import { contractAddresses } from './contracts';
import { providerEngine } from './provider_engine';
import { getRandomFutureDateInSeconds } from './utils';

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
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/orders', async (req, res) => {
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

app.post('/order', async (req, res) => {
    const maker = req.body.address.toLowerCase();
    const taker = !req.body.taker ? req.body.taker.toLowerCase() : NULL_ADDRESS;
    // @NOTE: 動的に変更する
    const makerAssetType = 'etherToken';
    const takerAssetType = 'zrxToken';
    const makerAmount = req.body.makerAmount;
    const takerAmount = req.body.takerAmount;
    const expiration = req.body.expiration;

    // Initialize the ContractWrappers, this provides helper functions around calling
    const contractWrappers = new ContractWrappers(providerEngine, { networkId: NETWORK_CONFIGS.networkId });
    const web3Wrapper = new Web3Wrapper(providerEngine);
    const makerTokenAddress = contractAddresses[makerAssetType];
    const takerTokenAddress = contractAddresses[takerAssetType];

    // Initialize the Web3Wrapper, this provides helper functions around fetching
    const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
    const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);
    // the amount the maker is selling of maker asset
    const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(makerAmount), DECIMALS);
    // the amount the maker wants of taker asset
    const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(takerAmount), DECIMALS);

    // Set up the Order and fill it
    // @NOTE: UNIX TIME
    const randomExpiration = expiration;
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

    // Stop the Provider Engine
    providerEngine.stop();

    // Generate the order hash and sign it
    const orderHashHex = orderHashUtils.getOrderHashHex(order);

    // Return the order hash
    res.status(HTTP_OK_STATUS).json({
      'status': 'success',
      'order': order,
      'orderHash': orderHashHex,
    });
});

app.listen(HTTP_PORT, () => console.log(`API (HTTP) listening on port ${HTTP_PORT}!`));
