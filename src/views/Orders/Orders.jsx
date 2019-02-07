import React, { Component } from "react";
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import tableStyle from "assets/jss/material-dashboard-react/components/tableStyle.jsx";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
// core components
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardFooter from "components/Card/CardFooter.jsx";

import axios from 'axios';
import moment from 'moment';
import web3 from "../../libs/web3";
import web3Utils from "../../libs/web3Utils";
import { getErc20BalanceAsync } from "../../libs/erc20GetBalanceAsync";
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
import { CardContent } from "@material-ui/core";

const styles = theme => ({
  // for selectbox
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    flexGrow: 1,
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing.unit * 2,
  },
  // for card
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
  },
  centerBlock: {
    margin: "0 auto"
  },
  textCenter: {
    textAlign: "center"
  },
});
const activeOpacity = 1.0;
const inactiveOpacity = 0.6;
const assetPair = {
  'WETH/ZRX': 'etherToken/zrxToken',
  'WETH/REP': 'etherToken/repToken',
  'WETH/DAI': 'etherToken/daiToken',
  'WETH/OMG': 'etherToken/omgToken',
  'ZRX/REP': 'zrxToken/repToken',
  'ZRX/DAI': 'zrxToken/daiToken',
  'ZRX/OMG': 'zrxToken/omgToken',
  'REP/DAI': 'repToken/daiToken',
  'REP/OMG': 'repToken/omgToken',
  'DAI/OMG': 'daiToken/omgToken',
}

class Orders extends Component {
  state = {
    address: '',
    wetherBalance: 0,
    zrxBalance: 0,
    repBalance: 0,
    daiBalance: 0,
    omgBalance: 0,
    assetPair: 'etherToken/zrxToken',
    makerAssetType: 'etherToken',
    makerAmount: 0,
    takerAssetType: 'zrxToken',
    takerAmount: 0,
    expiration: 0,
    taker: '',

    fillMakerAmount: 0,
    fillTakerAmount: 0,
    fillExpiration: 0,
    fillTaker: '',

    selectedOrderIndex: null,
    orderList: [],

    generateOrderStyle: { opacity: activeOpacity },
    fillOrderStyle: { opacity: inactiveOpacity },

    web3Enable: false,

    tabValue: 0
  }

  async componentWillMount() {
    if (await web3Utils.isKovanNetwork(web3)) {
      const addresses = await web3.eth.getAccounts();
      if (addresses.length > 0) {
        const address = addresses[0].toLowerCase();
        await this.setState({ address: address });

        const etherTokenAddress = contractAddresses['etherToken'];
        const zrxTokenAddress = contractAddresses['zrxToken'];
        const repTokenAddress = contractAddresses['repToken'];
        const daiTokenAddress = contractAddresses['daiToken'];
        const omgTokenAddress = contractAddresses['omgToken'];
        const wetherBalance = await getErc20BalanceAsync(address, etherTokenAddress);
        const zrxBalance = await getErc20BalanceAsync(address, zrxTokenAddress);
        const repBalance = await getErc20BalanceAsync(address, repTokenAddress);
        const daiBalance = await getErc20BalanceAsync(address, daiTokenAddress);
        const omgBalance = await getErc20BalanceAsync(address, omgTokenAddress);

        await this.setState({ wetherBalance: wetherBalance });
        await this.setState({ zrxBalance: zrxBalance });
        await this.setState({ repBalance: repBalance });
        await this.setState({ daiBalance: daiBalance });
        await this.setState({ omgBalance: omgBalance });

        metamaskProvider(web3.currentProvider);

        const assetPairList = this.state.assetPair.split('/');
        await this.reloadOrder(assetPairList[0], assetPairList[1]);

        await this.setState({ web3Enable: true });
      }
    }
  }

  handleChangeIndex = index => {
    this.setState({ value: index });
  }

  handleTab = async(event, value) => {
    await this.setState({ tabValue: value });
    await this.setAssetType();
    await this.reloadOrder(this.state.makerAssetType, this.state.takerAssetType);
  };

  changeAssetType = async(e) => {
    await this.setState({ assetPair: e.target.value });
    await this.setAssetType();
    await this.reloadOrder(this.state.makerAssetType, this.state.takerAssetType);
  }

  setAssetType = async() => {
    const assetPairList = this.state.assetPair.split('/');
    const buyAssetIndex = this.state.tabValue;
    const sellAssetIndex = this.state.tabValue === 0 ? 1 : 0;
    await this.setState({ makerAssetType: assetPairList[buyAssetIndex] });
    await this.setState({ takerAssetType: assetPairList[sellAssetIndex] });
  }

  reloadOrder = async(makerAssetType, takerAssetType) => {
    if (web3Utils.isKovanNetwork(web3)) {
      const makerTokenAddress = contractAddresses[makerAssetType];
      const takerTokenAddress = contractAddresses[takerAssetType];
      const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
      const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);

      axios
        .get(RELAYER_HOST + '/orders', {
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          params: {
            'makerAssetData': makerAssetData,
            'takerAssetData': takerAssetData
          }
        }).then(async (res) => {
          const dataList = res.data.records;
          await this.setState({ orderList: dataList });
        }).catch((err) => {
          console.error(err);
          alert('ERROR\n' + err.message);
        });
    }
  }

  submitOrderClick = async() => {
    const maker = this.state.address.toLowerCase();
    const taker = !this.state.taker ? NULL_ADDRESS : this.state.taker.toLowerCase();

    const makerAssetType = this.state.makerAssetType;
    const takerAssetType = this.state.takerAssetType;
    const makerAmount = this.state.makerAmount;
    const takerAmount = this.state.takerAmount;
    // 一旦、2週間で固定する
    const expiration = String(moment().add(2, 'weeks').unix());

    const providerEngine = metamaskProvider(window.web3.currentProvider);
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
      .post(
        RELAYER_HOST + '/order',
        signedOrder, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
      }).then(async (res) => {
        console.log(res);

        await this.reloadOrder(makerAssetType, takerAssetType);
      }).catch((err) => {
        console.error(err);
        alert('ERROR\n' + err.message);
      });
  };

  orderClick = async(index) => {
    // set index
    await this.setState({ selectedOrderIndex: index });

    // set order
    const order = this.state.orderList[index].order;
    await this.setState({ fillMakerAmount: await web3.utils.fromWei(order.makerAssetAmount, 'ether') });
    await this.setState({ fillTakerAmount: await web3.utils.fromWei(order.takerAssetAmount, 'ether') });
    await this.setState({ fillExpiration: moment(new Date(order.expirationTimeSeconds * 1000)).format('YYYY-MM-DD HH:mm') });
    await this.setState({ fillTaker: order.fillTaker });

    // change box opacity
    await this.setState({ generateOrderStyle: { opacity: inactiveOpacity } });
    await this.setState({ fillOrderStyle: { opacity: activeOpacity } });
  }

  generateOrderClick = async() => {
    await this.setState({ fillOrderStyle: { opacity: inactiveOpacity } });
    await this.setState({ generateOrderStyle: { opacity: activeOpacity } });
  }

  executeOrderClick = async() => {
    try {
      const index = this.state.selectedOrderIndex;
      const signedOrder = this.state.orderList[index].order;
      const taker = this.state.address;
      const takerAssetAmount = new BigNumber(signedOrder.takerAssetAmount);
      signedOrder.makerAssetAmount = new BigNumber(signedOrder.makerAssetAmount);
      signedOrder.takerAssetAmount = new BigNumber(signedOrder.takerAssetAmount);
      signedOrder.expirationTimeSeconds = new BigNumber(signedOrder.expirationTimeSeconds);

      const providerEngine = metamaskProvider(window.web3.currentProvider);
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
    }
  }

  render() {
    const { classes, tableHeaderColor } = this.props;
    return (
      <div>
        <GridContainer>
          <GridItem xs={12} sm={12} md={12}>
            <Card>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>ウォレットの情報</h4>
              </CardHeader>
              <CardBody>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="YOUR ADDRESS"
                      id="your-address"
                      value={this.state.address}
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        readOnly: true
                      }}
                    />
                  </GridItem>
                  <GridItem xs={6} sm={3} md={3}>
                    <Card>
                      <CardContent>
                        <GridContainer>
                          <GridItem xs={12} sm={4} md={4}>
                            <img src="https://0x.org/images/token_icons/WETH.png" width="40" />
                          </GridItem>
                          <GridItem xs={12} sm={6} md={6}>
                            { this.state.wetherBalance } WETH
                          </GridItem>
                        </GridContainer>
                      </CardContent>
                    </Card>
                  </GridItem>
                  <GridItem xs={6} sm={3} md={3}>
                    <Card>
                      <CardContent>
                        <GridContainer>
                          <GridItem xs={12} sm={4} md={4}>
                            <img src="https://0x.org/images/token_icons/ZRX.png" width="40" />
                          </GridItem>
                          <GridItem xs={12} sm={6} md={6}>
                            { this.state.zrxBalance } ZRX
                          </GridItem>
                        </GridContainer>
                      </CardContent>
                    </Card>
                  </GridItem>
                  <GridItem xs={6} sm={3} md={3}>
                    <Card>
                      <CardContent>
                        <GridContainer>
                          <GridItem xs={12} sm={4} md={4}>
                            <img src="https://0x.org/images/token_icons/REP.png" width="40" />
                          </GridItem>
                          <GridItem xs={12} sm={6} md={6}>
                            { this.state.repBalance } REP
                          </GridItem>
                        </GridContainer>
                      </CardContent>
                    </Card>
                  </GridItem>
                  <GridItem xs={6} sm={3} md={3}>
                    <Card>
                      <CardContent>
                        <GridContainer>
                          <GridItem xs={12} sm={4} md={4}>
                            <img src="https://0x.org/images/token_icons/DAI.png" width="40" />
                          </GridItem>
                          <GridItem xs={12} sm={6} md={6}>
                            { this.state.daiBalance } DAI
                          </GridItem>
                        </GridContainer>
                      </CardContent>
                    </Card>
                  </GridItem>
                  <GridItem xs={6} sm={3} md={3}>
                    <Card>
                      <CardContent>
                        <GridContainer>
                          <GridItem xs={12} sm={4} md={4}>
                            <img src="https://0x.org/images/token_icons/OMG.png" width="40" />
                          </GridItem>
                          <GridItem xs={12} sm={6} md={6}>
                            { this.state.omgBalance } OMG
                          </GridItem>
                        </GridContainer>
                      </CardContent>
                    </Card>
                  </GridItem>
                </GridContainer>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={12} md={4} onClick={this.generateOrderClick}>
            <div style={this.state.generateOrderStyle}>
              <Card>
                <CardHeader color="primary">
                  <h4 className={classes.cardTitleWhite}>オーダーを作成する</h4>
                </CardHeader>
                <CardBody>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={12}>
                      <Tabs
                        value={this.state.tabValue}
                        onChange={this.handleTab}
                        indicatorColor="primary"
                        textColor="primary"
                        centered
                      >
                        <Tab label="買い" />
                        <Tab label="売り" />
                      </Tabs>
                    </GridItem>
                    <GridItem xs={12} sm={12} md={12}>
                      <FormControl className={classes.formControl}>
                        <InputLabel htmlFor="asset-pair">Asset Pair</InputLabel>
                        <Select
                          labelText="Asset Pair"
                          value={this.state.assetPair}
                          onChange={this.changeAssetType}
                          inputProps={{
                            id: 'asset-pair',
                            name: 'assetPair'
                          }}
                        >
                          {Object.keys(assetPair).map((value, index) => {
                            return (
                              <MenuItem value={assetPair[value]}>{value}</MenuItem>
                            )
                          })}
                        </Select>
                      </FormControl>
                    </GridItem>
                    <GridItem xs={12} sm={12} md={12}>
                      <CustomInput
                        labelText="Maker Amount"
                        id="maker-amount"
                        value={this.state.makerAmount}
                        onChange={event => this.setState({ makerAmount: event.target.value }) }
                        formControlProps={{
                          fullWidth: true
                        }}
                      />
                    </GridItem>
                    <GridItem xs={12} sm={12} md={12}>
                      <CustomInput
                        labelText="Taker Amount"
                        id="taker-amount"
                        value={this.state.takerAmount}
                        onChange={event => this.setState({ takerAmount: event.target.value })}
                        formControlProps={{
                          fullWidth: true
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                </CardBody>
                <CardFooter>
                  {this.state.tabValue === 0 &&
                    <Button onClick={ this.submitOrderClick } color="primary" disabled={ !this.state.web3Enable }>購入する</Button>
                  }
                  {this.state.tabValue === 1 &&
                    <Button onClick={ this.submitOrderClick } color="primary" disabled={ !this.state.web3Enable }>売却する</Button>
                  }
                </CardFooter>
              </Card>
            </div>
          </GridItem>
          <GridItem xs={12} sm={12} md={4}>
            <Card className={classes.tableResponsive}>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>オーダー</h4>
              </CardHeader>
              <CardBody>
                <Table className={classes.table}>
                  <TableHead className={classes[tableHeaderColor + "TableHeader"]}>
                    <TableRow>
                      <TableCell
                        className={classes.tableCell + " " + classes.tableHeadCell}
                      >
                        価格
                      </TableCell>
                      <TableCell
                        className={classes.tableCell + " " + classes.tableHeadCell}
                      >
                        量
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {this.state.orderList.map((prop, key) => {
                      return (
                        <TableRow key={key} onClick={ () => this.orderClick(key) } hover={true}>
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
            <div style={this.state.fillOrderStyle}>
              <Card>
                <CardHeader color="primary">
                  <h4 className={classes.cardTitleWhite}>オーダーを実行する</h4>
                </CardHeader>
                <CardBody>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={12}>
                      <CustomInput
                        labelText="Maker Amount"
                        id="fill-maker-amount"
                        value={this.state.fillMakerAmount}
                        onChange={event => this.setState({ fillMakerAmount: event.target.value })}
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          readOnly: true
                        }}
                      />
                    </GridItem>
                    <GridItem xs={12} sm={12} md={12}>
                      <CustomInput
                        labelText="Taker Amount"
                        id="fill-taker-amount"
                        value={this.state.fillTakerAmount}
                        onChange={event => this.setState({ fillTakerAmount: event.target.value })}
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          readOnly: true
                        }}
                      />
                    </GridItem>
                    <GridItem xs={12} sm={12} md={12}>
                      <CustomInput
                        labelText="Expiration"
                        id="fillExpiration"
                        value={this.state.fillExpiration}
                        onChange={event => this.setState({ fillExpiration: event.target.value })}
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          readOnly: true
                        }}
                      />
                    </GridItem>
                    <GridItem xs={12} sm={12} md={12}>
                      <CustomInput
                        labelText="Taker"
                        id="fillTaker"
                        value={this.state.fillTaker}
                        onChange={event => this.setState({ fillTaker: event.target.value })}
                        formControlProps={{
                          readOnly: true,
                          fullWidth: true
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                </CardBody>
                <CardFooter>
                  <Button onClick={this.executeOrderClick} color="primary" disabled={ !this.state.web3Enable }>実行する</Button>
                </CardFooter>
              </Card>
            </div>
          </GridItem>
        </GridContainer>
      </div>
    );
  }
}

export default withStyles(styles, tableStyle)(Orders);
