import React, { Component } from "react";
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
// core components
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import GridItem from "components/Grid/GridItem.jsx";
import Switch from '@material-ui/core/Switch';
import Table from "components/Table/Table.jsx";

import web3 from "../../libs/web3";
import { getErc20BalanceAsync } from "./erc20GetBalanceAsync";
import {
  BigNumber,
  ContractWrappers
} from "0x.js";
import { Web3Wrapper } from '@0x/web3-wrapper';
import { NETWORK_CONFIGS } from '../../configs';
import { DECIMALS } from "../../constants";
import { contractAddresses } from '../../contracts';
import { metamaskProvider } from '../../provider_engine';

const styles = {
  cardCategoryWhite: {
    "&,& a,& a:hover,& a:focus": {
      color: "rgba(255,255,255,.62)",
      margin: "0",
      fontSize: "14px",
      marginTop: "0",
      marginBottom: "0"
    },
    "& a,& a:hover,& a:focus": {
      color: "#FFFFFF"
    }
  },
  cardTitleWhite: {
    color: "#FFFFFF",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none",
    "& small": {
      color: "#777",
      fontSize: "65%",
      fontWeight: "400",
      lineHeight: "1"
    }
  }
};

class WrapAllowance extends Component {
  state = {
    address: '',
    etherAllowance: false,
    zrxAllowance: false,
    balance: 0,
    wetherBalance: 0,
    zrxBalance: 0,

    // for wrap unwrap
    depositAmount: 0,
    withdrawAmount: 0,
  };

  async componentDidMount() {
    const providerEngine = metamaskProvider(window.web3.currentProvider);
    const contractWrappers = new ContractWrappers(providerEngine, { networkId: NETWORK_CONFIGS.networkId });
    const etherTokenAddress = contractAddresses['etherToken'];
    const zrxTokenAddress = contractAddresses['zrxToken'];

    // get allowance status
    const addresses = await web3.eth.getAccounts();
    const address = addresses[0];
    await this.setState({ address: address });

    const balance = await web3.eth.getBalance(address);
    await this.setState({ balance: await web3.utils.fromWei(balance, 'ether') });

    const etherAllowance = await contractWrappers.erc20Token.getAllowanceAsync(
      etherTokenAddress,
      address,
      contractAddresses['erc20Proxy']
    );
    const zrxAllowance = await contractWrappers.erc20Token.getAllowanceAsync(
      zrxTokenAddress,
      address,
      contractAddresses['erc20Proxy']
    );

    await this.setState({ etherAllowance: etherAllowance > 0 ? true : false });
    await this.setState({ zrxAllowance: zrxAllowance > 0 ? true : false });

    const wetherBalance = await getErc20BalanceAsync(address, etherTokenAddress);
    const zrxBalance = await getErc20BalanceAsync(address, zrxTokenAddress);

    await this.setState({ wetherBalance: wetherBalance });
    await this.setState({ zrxBalance: zrxBalance });
  };

  // Allowance
  allowanceHandleChange = async(event) => {
    const id = event.target.id;
    const checked = event.target.checked;

    const providerEngine = metamaskProvider(window.web3.currentProvider);
    const contractWrappers = new ContractWrappers(providerEngine, { networkId: NETWORK_CONFIGS.networkId });
    const tokenAddress = contractAddresses[event.target.value];
    const approvalTxHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
      tokenAddress,
      this.state.address,
    );

    await this.setState({ [id]: checked });
  };

  // Wrap Unwrap
  depositClick = async() => {
    const etherTokenAddress = contractAddresses['etherToken'];
    const providerEngine = metamaskProvider(window.web3.currentProvider);
    const contractWrappers = new ContractWrappers(providerEngine, { networkId: NETWORK_CONFIGS.networkId });
    const depositAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(this.state.depositAmount), DECIMALS);
    const depositTxHash = await contractWrappers.etherToken.depositAsync(
      etherTokenAddress,
      depositAmount,
      this.state.address,
    );

    console.log('depositHash:', depositTxHash);
  };

  withdrawClick = async() => {
    const etherTokenAddress = contractAddresses['etherToken'];
    const providerEngine = metamaskProvider(window.web3.currentProvider);
    const contractWrappers = new ContractWrappers(providerEngine, { networkId: NETWORK_CONFIGS.networkId });
    const withdrawAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(this.state.withdrawAmount), DECIMALS);
    const withdrawTxHash = await contractWrappers.etherToken.withdrawAsync(
      etherTokenAddress,
      withdrawAmount,
      this.state.address,
    );

    console.log('withdrawHash:', withdrawTxHash);
  };

  render() {
    const { classes } = this.props;
    // for table
    const wrappedEthTableData = [
      [
        "ETH",
        <img src="https://0x.org/images/ether.png" width="30" />,
        this.state.balance,
        <CustomInput
          labelText="Deposit Amount"
          id="deposit-amount"
          value={this.state.depositAmount}
          onChange={event => this.setState({ depositAmount: event.target.value }) }
          formControlProps={{
            fullWidth: true
          }}
        />,
        <Button onClick={this.depositClick} color="primary">WETHにする</Button>
      ],
      [
        "WETH",
        <img src="https://0x.org/images/token_icons/WETH.png" width="30" />,
        this.state.wetherBalance,
        <CustomInput
          labelText="Withdraw Amount"
          id="withdraw-amount"
          value={this.state.withdrawAmount}
          onChange={event => this.setState({ withdrawAmount: event.target.value }) }
          formControlProps={{
            fullWidth: true
          }}
        />,
        <Button onClick={this.withdrawClick} color="primary">ETHにする</Button>
      ]
    ];
    const allowanceTableData = [
      [
        "WETH",
        <img src="https://0x.org/images/token_icons/WETH.png" width="30" />,
        this.state.wetherBalance,
        <Switch
          checked={this.state.etherAllowance}
          onChange={this.allowanceHandleChange}
          id='etherAllowance'
          value='etherToken'
        />
      ],
      [
        "ZRX",
        <img src="https://0x.org/images/token_icons/ZRX.png" width="30" />,
        this.state.zrxBalance,
        <Switch
          checked={this.state.zrxAllowance}
          onChange={this.allowanceHandleChange}
          id='zrxAllowance'
          value='zrxToken'
        />
      ]
    ];

    return (
      <div>
        <GridContainer>
          <GridItem xs={12} sm={12} md={12}>
            <Card>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>Ether</h4>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Token", "Symbol", "Balance", "Exchange", ""]}
                  tableData={wrappedEthTableData}
                />
              </CardBody>
            </Card>
          </GridItem>

          <GridItem xs={12} sm={12} md={12}>
            <Card>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>トークン送金許可</h4>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Token", "Symbol", "Balance", "Allowance"]}
                  tableData={allowanceTableData}
                />
              </CardBody>
            </Card>
          </GridItem>
        </GridContainer>
      </div>
    );
  }
}

export default withStyles(styles)(WrapAllowance);
