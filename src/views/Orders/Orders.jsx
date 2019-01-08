import React, { Component } from "react";
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

const styles = theme => ({
  // for selectbox
  root: {
    display: 'flex',
    flexWrap: 'wrap',
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
});

class Orders extends Component {
  state = {
    address: '',
    balance: 0,
    makerAssetType: 'etherToken',
    takerAssetType: 'zrxToken',
    makerAmount: 0,
    takerAmount: 0,
    expiration: 0,
    taker: '',

    fillMakerAmount: 0,
    fillTakerAmount: 0,
    fillExpiration: 0,
    fillTaker: '',

    selectedOrderIndex: null,
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
    await this.reloadOrder(this.state.makerAssetType, this.state.takerAssetType);
  }

  handleChangeIndex = index => {
    this.setState({ value: index });
  }

  changeAssetType = async(e) => {
    const stateName = e.target.name;
    const stateValue = e.target.value;
    await this.setState({[stateName]: stateValue});
    await this.reloadOrder(this.state.makerAssetType, this.state.takerAssetType);
  }

  reloadOrder = async(makerAssetType, takerAssetType) => {
    const makerTokenAddress = contractAddresses[makerAssetType];
    const takerTokenAddress = contractAddresses[takerAssetType];
    const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
    const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);

    axios
      .get(RELAYER_HOST + '/v2/orders', {
        params: {
          'makerAssetData': makerAssetData,
          'takerAssetData': takerAssetData
        }
      })
      .then(async (res) => {
        const dataList = res.data.records;
        await this.setState({ orderList: dataList });
      }).catch((err) => {
        console.error(err);
        alert('ERROR\n' + err.message);
      });
  }

  submitOrderClick = async() => {
    const maker = this.state.address.toLowerCase();
    const taker = !this.state.taker ? NULL_ADDRESS : this.state.taker.toLowerCase();

    const makerAssetType = this.state.makerAssetType;
    const takerAssetType = this.state.takerAssetType;
    const makerAmount = this.state.makerAmount;
    const takerAmount = this.state.takerAmount;
    const expiration = "1550161320";

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
      .post(RELAYER_HOST + '/v2/order', signedOrder)
      .then(async (res) => {
        console.log(res);

        await this.reloadOrder(makerAssetType, takerAssetType);
      }).catch((err) => {
        console.error(err);
        alert('ERROR\n' + err.message);
      });
  };

  orderClick = async(index) => {
    console.log('order:', this.state.orderList[index].order);

    // set index
    await this.setState({ selectedOrderIndex: index });

    // set order
    const order = this.state.orderList[index].order;
    await this.setState({ fillMakerAmount: await web3.utils.fromWei(order.makerAssetAmount, 'ether') });
    await this.setState({ fillTakerAmount: await web3.utils.fromWei(order.takerAssetAmount, 'ether') });
    await this.setState({ fillExpiration: moment(new Date(order.expirationTimeSeconds * 1000)).format('YYYY-MM-DD HH:mm') });
    await this.setState({ fillTaker: order.fillTaker });
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
                <h4 className={classes.cardTitleWhite}>Wallet Information</h4>
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
                </GridContainer>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={12} md={4}>
            <Card>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>Generate Order</h4>
              </CardHeader>
              <CardBody>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={12}>
                    <FormControl className={classes.formControl}>
                      <InputLabel htmlFor="maker-asset-type">MakerAssetType</InputLabel>
                      <Select
                        labelText="Maker Asset Type"
                        value={this.state.makerAssetType}
                        onChange={this.changeAssetType}
                        inputProps={{
                          id: 'maker-asset-type',
                          name: 'makerAssetType'
                        }}
                      >
                        <MenuItem value={'etherToken'}>WETH</MenuItem>
                        <MenuItem value={'zrxToken'}>ZRX</MenuItem>
                      </Select>
                    </FormControl>
                  </GridItem>
                  <GridItem xs={12} sm={12} md={12}>
                    <FormControl className={classes.formControl}>
                      <InputLabel htmlFor="taker-asset-type">TakerAssetType</InputLabel>
                      <Select
                        labelText="Taker Asset Type"
                        value={this.state.takerAssetType}
                        onChange={this.changeAssetType}
                        inputProps={{
                          id: 'taker-asset-type',
                          name: 'takerAssetType'
                        }}
                      >
                        <MenuItem value={'etherToken'}>WETH</MenuItem>
                        <MenuItem value={'zrxToken'}>ZRX</MenuItem>
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
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Expiration"
                      id="expiration"
                      value={this.state.expiration}
                      onChange={event => this.setState({ expiration: event.target.value })}
                      formControlProps={{
                        fullWidth: true
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomInput
                      labelText="Taker"
                      id="taker"
                      value={this.state.taker}
                      onChange={event => this.setState({ taker: event.target.value })}
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
            <Card>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>Fill Order</h4>
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
                <Button onClick={this.executeOrderClick} color="primary">Execute Order</Button>
              </CardFooter>
            </Card>
          </GridItem>
        </GridContainer>
      </div>
    );
  }
}

export default withStyles(styles, tableStyle)(Orders);
