import React from "react";
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import tableStyle from "assets/jss/material-dashboard-react/components/tableStyle.jsx";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
// core components
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardFooter from "components/Card/CardFooter.jsx";

import axios from 'axios';
import web3 from "../../web3";
import {
  assetDataUtils,
  BigNumber,
  ContractWrappers,
  generatePseudoRandomSalt,
  orderHashUtils,
  signatureUtils
} from "0x.js";
import { Web3Wrapper } from '@0x/web3-wrapper';

import {
  NETWORK_CONFIGS,
  TX_DEFAULTS
} from '../../configs';

import {
  DECIMALS,
  NULL_ADDRESS,
  RELAYER_HOST,
  ZERO
} from "../../constants";

import { contractAddresses } from '../../contracts';
import { metamaskProvider } from '../../provider_engine';

const styles = {
  cardCategoryWhite: {
    color: "rgba(255,255,255,.62)",
    margin: "0",
    fontSize: "14px",
    marginTop: "0",
    marginBottom: "0"
  },
  cardTitleWhite: {
    color: "#FFFFFF",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none"
  }
};

class Dashboard extends React.Component {
  state = {
    address: '',
    balance: 0,
    makerAmount: 0.01,
    takerAmount: 10,
    expiration: 0,
    taker: '',

    fillAddress: '',
    fillBalance: 0,
    fillMakerAmount: 0,
    fillTakerAmount: 0,
    fillExpiration: 0,
    fillTaker: '',

    orderList: []
  };

  async componentDidMount() {
    const addresses = await web3.eth.getAccounts();
    await this.setState({ address: addresses[0].toLowerCase() });
    await this.setState({ fillAddress: addresses[0].toLowerCase() });

    const balance = await web3.eth.getBalance(addresses[0]);
    await this.setState({ balance: await web3.utils.fromWei(balance, 'ether') });
    await this.setState({ fillBalance: await web3.utils.fromWei(balance, 'ether') });

    metamaskProvider(web3.currentProvider);

    axios
      .get(RELAYER_HOST + '/v2/orders')
      .then(async (res) => {
        const dataList = res.data.records;
        await this.setState({ orderList: dataList });
      }).catch((err) => {
        console.error(err);
        alert('ERROR\n' + err.message);
      });
  }

  handleChange = (event, value) => {
    this.setState({ value });
  };

  handleChangeIndex = index => {
    this.setState({ value: index });
  };

  submitOrderClick = async() => {
    const maker = this.state.address.toLowerCase();
    const taker = !this.state.taker ? NULL_ADDRESS : this.state.taker.toLowerCase();

    const makerAssetType = 'etherToken';
    const takerAssetType = 'zrxToken';
    const makerAmount = this.state.makerAmount;
    const takerAmount = this.state.takerAmount;
    const expiration = "1550161320";

    const providerEngine = metamaskProvider(web3.currentProvider);
    const makerTokenAddress = contractAddresses[makerAssetType];
    const takerTokenAddress = contractAddresses[takerAssetType];
    const exchangeAddress = contractAddresses.exchange;

    const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
    const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);

    const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(makerAmount), DECIMALS);
    const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(takerAmount), DECIMALS);

    const order = {
      exchangeAddress,
      makerAddress: maker,
      takerAddress: taker,
      senderAddress: NULL_ADDRESS,
      // @TODO: feeRecipientAddressの設定
      feeRecipientAddress: NULL_ADDRESS,
      expirationTimeSeconds: expiration,
      salt: generatePseudoRandomSalt(),
      makerAssetAmount,
      takerAssetAmount,
      makerAssetData,
      takerAssetData,
      // @TODO: 手数料の調整
      makerFee: ZERO,
      takerFee: ZERO,
    };

    const orderHashHex = orderHashUtils.getOrderHashHex(order);
    const signature = await signatureUtils.ecSignHashAsync(providerEngine, orderHashHex, maker);
    const signedOrder = { ...order, signature };

    axios
      .post(RELAYER_HOST + '/v2/order', signedOrder)
      .then((res) => {
        console.log(res);
      }).catch((err) => {
        console.error(err);
        alert('ERROR\n' + err.message);
      });
  };

  orderClick = async(id) => {
    console.log('order:', this.state.orderList[id].order);

    try {
      const signedOrder = this.state.orderList[id].order;
      const taker = this.state.fillAddress;
      const takerAssetAmount = new BigNumber(signedOrder.takerAssetAmount);
      signedOrder.makerAssetAmount = new BigNumber(signedOrder.makerAssetAmount);
      signedOrder.takerAssetAmount = new BigNumber(signedOrder.takerAssetAmount);
      signedOrder.expirationTimeSeconds = new BigNumber(signedOrder.expirationTimeSeconds);

      const providerEngine = metamaskProvider(web3.currentProvider);
      const contractWrappers = new ContractWrappers(providerEngine, { networkId: NETWORK_CONFIGS.networkId });
      await contractWrappers.exchange.validateFillOrderThrowIfInvalidAsync(signedOrder, takerAssetAmount, taker);

      // Fill the Order via 0x Exchange contract
      const txHash = await contractWrappers.exchange.fillOrderAsync(signedOrder, takerAssetAmount, taker, {
        gasLimit: TX_DEFAULTS.gas,
      });
      console.log('txHash:', txHash);
    } catch (err) {
      console.error(err);
      alert('ERROR\n' + err.message);
    };
  }

  executeOrderClick = async() => {
    const maker = this.state.fillAddress.toLowerCase();
    const taker = !this.state.fillTaker ? NULL_ADDRESS : this.state.fillTaker.toLowerCase();
  }

  render() {
    const { classes, tableHeaderColor } = this.props;
    return (
      <div>
        <GridContainer>
          <GridItem xs={12} sm={12} md={4}>
            <Card>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>Generate Order</h4>
              </CardHeader>
              <CardBody>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="YOUR ADDRESS"
                      id="your-address"
                      onChange={ event => this.setState({ address: event.target.value }) }
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        readOnly: true,
                        value: this.state.address
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="YOUR BALANCE"
                      id="your-balance"
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        readOnly: true,
                        value: this.state.balance
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Maker Amount(WETH)"
                      id="maker-amount"
                      onChange={ event => this.setState({ makerAmount: event.target.value }) }
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        value: this.state.makerAmount
                      }}
                    />
                  </GridItem>
                </GridContainer>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Taker Amount(ZRX)"
                      id="taker-amount"
                      onChange={ event => this.setState({ takerAmount: event.target.value }) }
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        value: this.state.takerAmount
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Expiration"
                      id="expiration"
                      onChange={ event => this.setState({ expiration: event.target.value }) }
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        value: this.state.expiration
                      }}
                    />
                  </GridItem>
                </GridContainer>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Taker"
                      id="taker"
                      value={ this.state.taker }
                      onChange={ event => this.setState({ taker: event.target.value }) }
                      formControlProps={{
                        fullWidth: true
                      }}
                    />
                  </GridItem>
                </GridContainer>
              </CardBody>
              <CardFooter>
                <Button onClick={ this.submitOrderClick } color="primary">Submit Order</Button>
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={12} md={4}>
            <Card className={classes.tableResponsive}>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>Orders</h4>
              </CardHeader>
              <CardBody>
                <Table className={classes.table}>
                  <TableHead className={classes[tableHeaderColor + "TableHeader"]}>
                    <TableRow>
                      <TableCell
                        className={classes.tableCell + " " + classes.tableHeadCell}
                      >
                        価格 WETH
                      </TableCell>
                      <TableCell
                        className={classes.tableCell + " " + classes.tableHeadCell}
                      >
                        量 ZRX
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {this.state.orderList.map((prop, key) => {
                      return (
                        <TableRow key={key} onClick={ () => this.orderClick(key) }>
                          <TableCell className={classes.tableCell}>
                            {web3.utils.fromWei(prop.order.makerAssetAmount, 'ether')}
                          </TableCell>
                          <TableCell className={classes.tableCell}>
                            {web3.utils.fromWei(prop.order.takerAssetAmount, 'ether')}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={12} md={4}>
            <Card>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>Fill Order</h4>
              </CardHeader>
              <CardBody>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Fill ADDRESS"
                      id="fill-address"
                      onChange={ event => this.setState({ fillAddress: event.target.value }) }
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        readOnly: true,
                        value: this.state.fillAddress
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Fill BALANCE"
                      id="fill-balance"
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        readOnly: true,
                        value: this.state.fillBalance
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Fill Maker Amount(WETH)"
                      id="fill-maker-amount"
                      onChange={ event => this.setState({ fillMakerAmount: event.target.value }) }
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        readOnly: true,
                        value: this.state.fillMakerAmount
                      }}
                    />
                  </GridItem>
                </GridContainer>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Taker Amount(ZRX)"
                      id="fill-taker-amount"
                      onChange={ event => this.setState({ fillTakerAmount: event.target.value }) }
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        readOnly: true,
                        value: this.state.fillTakerAmount
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Expiration"
                      id="fillExpiration"
                      onChange={ event => this.setState({ fillExpiration: event.target.value }) }
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        readOnly: true,
                        value: this.state.fillExpiration
                      }}
                    />
                  </GridItem>
                </GridContainer>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Taker"
                      id="fillTaker"
                      value={ this.state.fillTaker }
                      onChange={ event => this.setState({ fillTaker: event.target.value }) }
                      formControlProps={{
                        readOnly: true,
                        fullWidth: true
                      }}
                    />
                  </GridItem>
                </GridContainer>
              </CardBody>
              <CardFooter>
                <Button onClick={ this.executeOrderClick } color="primary">Execute Order</Button>
              </CardFooter>
            </Card>
          </GridItem>
        </GridContainer>
      </div>
    );
  }
}

export default withStyles(styles, tableStyle)(Dashboard);
