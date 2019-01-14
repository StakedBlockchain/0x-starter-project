import React from "react";
import { Link } from 'react-router-dom'
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import InputLabel from "@material-ui/core/InputLabel";
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';


// core components
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardAvatar from "components/Card/CardAvatar.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardFooter from "components/Card/CardFooter.jsx";

import avatar from "assets/img/faces/marc.jpg";
import { CardContent, Avatar, Grid, CardActionArea, CardMedia, CardActions } from "@material-ui/core";

const styles = theme => ({
  root: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },

  card: {
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },

  media: {
    height: 250,
  },
});

function PaperSheet(props) {
  const { classes } = props;

  return (
    <div>
      <GridContainer className={classes.root} elevation={1}>
        <GridContainer xs={12}>
          <GridItem xs={12} sm={12}>
            <Card className={classes.card}>
              <CardBody>
                <Typography>
                  <h1>デジタル・アセットの分散型取引をすべての人に</h1>
                  <h4>【テストネット版】ブロックチェーンを応用し、秘密鍵を自分で管理しながら、集権的な第三者を通さずにウォレット間で取引を実現します。</h4>
                </Typography>
              </CardBody>
            </Card>
          </GridItem>
        </GridContainer>

        <GridContainer xs={12}>
          <GridItem xs={12}　sm={12}>
            <Card className={classes.card}>
              <CardHeader>
                <Typography>
                  <h2>使用方法</h2>
                  <h4><b>1.</b> MetamaskをインストールしKovanテストネットに接続してください。</h4>
                  <h4><b>2.</b> KovanテストネットでETHを入手する必要があります。入手するには<a href="https://gitter.im/kovan-testnet/faucet">こちら</a>でETHアドレスを送信すると自動的に振り込まれます。</h4>
                  <h4><b>3.</b> 画面左のWrap/Allowanceでは、ETH（Ethereumの通貨）をWrapped ETHに変換する作業を行います。ETHはEthereum上で発行されたERC20トークンと直接交換することができません。ETHをERC20トークン仕様にするためにWrapという作業を通してWETHを発行します。また、AllowanceではETHとWETHを交換する許可を設定します。</h4>
                  <h4><b>4.</b> Ordersの画面では、オーダーの作成と交換を行います。交換したい通貨と欲しい通貨を選択しオーダーを提出します。</h4>
                  <h4><b>5.</b> オーダーは画面中央で蓄積され、そのオーダーをタップしFillボタンを押すことによって交換を行うことができます。</h4>
                </Typography>
              </CardHeader>
            </Card>
          </GridItem>
        </GridContainer>
        

        <GridContainer xs={12} sm={12}>
          <GridItem xs={12}>
            <Card className={classes.card}>
              <CardHeader>
                <Typography><h2>なぜ分散型取引所が重要なのか？</h2></Typography>
              </CardHeader>
              <CardContent>
                <GridContainer>
                  <GridItem xs={12} sm={6}>
                    <GridContainer>
                     <Card className={classes.card}>
                       <CardActionArea>
                        <CardMedia
                          className={classes.media}
                          image="img/wallet.jpg"
                          title="Contemplative Reptile"
                        />
                        <CardContent>
                          <Typography gutterBottom variant="h5" component="h2">
                            ウォレット間の取引
                          </Typography>
                          <Typography component="p">
                            分散型取引所では、既存の取引所のような集権的な機関を通すことなくスマートコントラクトを通して送信者と受信者の間でトラストレスに交換を行うことができます。
                          </Typography>
                        </CardContent>
                        </CardActionArea>
                        <CardActions>
                         <Button size="small" color="primary" target="_blank" href="https://alis.to/Watanabesota/articles/KJNObpxev6pd">
                           もっと学ぶ
                         </Button>
                        </CardActions>
                    </Card>
                    </GridContainer>
                  </GridItem>

                  <GridItem xs={12} sm={6}>
                    <GridContainer>
                     <Card className={classes.card}>
                       <CardActionArea>
                        <CardMedia
                          className={classes.media}
                          image="img/secure.jpg"
                          title="Contemplative Reptile"
                        />
                        <CardContent>
                          <Typography gutterBottom variant="h5" component="h2">
                            オーナーシップ
                          </Typography>
                          <Typography component="p">
                            既存の取引所ではユーザーの資産を預かる形で管理しています。分散取引所ではユーザーが自分の資産を管理することができるため、ハッキングリスクが軽減します。
                          </Typography>
                        </CardContent>
                        </CardActionArea>
                        <CardActions>
                          <Button size="small" color="primary"　target="_blank" href="https://alis.to/Watanabesota/articles/KJNObpxev6pd">
                            もっと学ぶ
                          </Button>
                        </CardActions>
                    </Card>
                    </GridContainer>
                  </GridItem>

                  <GridItem xs={12} sm={6}>
                    <GridContainer>
                     <Card className={classes.card}>
                       <CardActionArea>
                        <CardMedia
                          className={classes.media}
                          image="img/borderless.jpg"
                          title="Contemplative Reptile"
                        />
                        <CardContent>
                          <Typography gutterBottom variant="h5" component="h2">
                            ボーダレスな取引
                          </Typography>
                          <Typography component="p">
                            分散取引所には国境がありません。需給に応じてニーズがマッチする人と取引ができます。
                          </Typography>
                        </CardContent>
                        </CardActionArea>
                        <CardActions>
                         <Button size="small" color="primary" target="_blank" href="https://alis.to/Watanabesota/articles/KJNObpxev6pd">
                           もっと学ぶ
                         </Button>
                        </CardActions>
                    </Card>
                    </GridContainer>
                  </GridItem>

                  <GridItem xs={12} sm={6}>
                    <GridContainer>
                     <Card className={classes.card}>
                       <CardActionArea>
                        <CardMedia
                          className={classes.media}
                          image="img/multipletokens.jpg"
                        />
                        <CardContent>
                          <Typography gutterBottom variant="h5" component="h2">
                            フリクションの少なさ
                          </Typography>
                          <Typography component="p">
                          流動性がある常態下では既存の取引所に比べ分散型取引所の手数料は安く、速く決済を行うことができます。
                          </Typography>
                        </CardContent>
                        </CardActionArea>
                        <CardActions>
                         <Button size="small" color="primary" target="_blank" href="https://alis.to/Watanabesota/articles/KJNObpxev6pd">
                           もっと学ぶ
                         </Button>
                        </CardActions>
                    </Card>
                    </GridContainer>
                  </GridItem>

                </GridContainer>
              </CardContent>
            </Card>
          </GridItem>
        </GridContainer>
        </GridContainer>
    </div>
  );
}

PaperSheet.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PaperSheet);
