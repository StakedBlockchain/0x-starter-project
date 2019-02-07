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
import web3Utils from "../../libs/web3Utils";
import { getErc20BalanceAsync } from "../../libs/erc20GetBalanceAsync";
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
    repAllowance: false,
    daiAllowance: false,
    omgAllowance: false,

    balance: 0,
    wetherBalance: 0,
    zrxBalance: 0,
    repBalance: 0,
    daiBalance: 0,
    omgBalance: 0,

    // for wrap unwrap
    depositAmount: 0,
    withdrawAmount: 0,

    web3Enable: false
  };

  async componentWillMount() {
    let web3Enable = false;
    if (await web3Utils.isKovanNetwork(web3)) {
      const providerEngine = metamaskProvider(window.web3.currentProvider);
      const contractWrappers = new ContractWrappers(providerEngine, { networkId: NETWORK_CONFIGS.networkId });
      const etherTokenAddress = contractAddresses['etherToken'];
      const zrxTokenAddress = contractAddresses['zrxToken'];
      const repTokenAddress = contractAddresses['repToken'];
      const daiTokenAddress = contractAddresses['daiToken'];
      const omgTokenAddress = contractAddresses['omgToken'];

      // get allowance status
      const addresses = await web3.eth.getAccounts();
      if (addresses.length > 0) {
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
        const repAllowance = await contractWrappers.erc20Token.getAllowanceAsync(
          repTokenAddress,
          address,
          contractAddresses['erc20Proxy']
        );
        const daiAllowance = await contractWrappers.erc20Token.getAllowanceAsync(
          daiTokenAddress,
          address,
          contractAddresses['erc20Proxy']
        );
        const omgAllowance = await contractWrappers.erc20Token.getAllowanceAsync(
          omgTokenAddress,
          address,
          contractAddresses['erc20Proxy']
        );

        await this.setState({ etherAllowance: etherAllowance > 0 ? true : false });
        await this.setState({ zrxAllowance: zrxAllowance > 0 ? true : false });
        await this.setState({ repAllowance: repAllowance > 0 ? true : false });
        await this.setState({ daiAllowance: daiAllowance > 0 ? true : false });
        await this.setState({ omgAllowance: omgAllowance > 0 ? true : false });

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

        // Kovanかつログイン済みならOK
        web3Enable = true;
      }
    }
    await this.setState({ web3Enable: web3Enable });
  }

  async componentDidMount() {
  }

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
  }

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
  }

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
        <Button onClick={this.depositClick} color="primary" disabled={ !this.state.web3Enable }>WETHにする</Button>
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
        <Button onClick={this.withdrawClick} color="primary" disabled={ !this.state.web3Enable }>ETHにする</Button>
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
          disabled={ !this.state.web3Enable }
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
          disabled={ !this.state.web3Enable }
        />
      ],
      [
        "REP",
        <img src="https://0x.org/images/token_icons/REP.png" width="30" />,
        this.state.repBalance,
        <Switch
          checked={this.state.repAllowance}
          onChange={this.allowanceHandleChange}
          id='repAllowance'
          value='repToken'
          disabled={ !this.state.web3Enable }
        />
      ],
      [
        "DAI",
        <img src="https://0x.org/images/token_icons/DAI.png" width="30" />,
        this.state.daiBalance,
        <Switch
          checked={this.state.daiAllowance}
          onChange={this.allowanceHandleChange}
          id='daiAllowance'
          value='daiToken'
          disabled={ !this.state.web3Enable }
        />
      ],
      [
        "OMG",
        <img src="https://0x.org/images/token_icons/OMG.png" width="30" />,
        this.state.omgBalance,
        <Switch
          checked={this.state.omgAllowance}
          onChange={this.allowanceHandleChange}
          id='omgAllowance'
          value='omgToken'
          disabled={ !this.state.web3Enable }
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
