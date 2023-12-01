const express = require('express');
const router = express.Router();


const db = require('../utils/db')
const { findDeploymentBlock, getAccountTokenTransfers,calcPnL } = require('../utils/chainAPI')
const {convertBigIntToString,convertStringToBigInt,convertBigIntToInt} = require('../utils')


router.get('/:account', async function(req, res, next) {
  const accountAddress = req.params.account;
  // Now, you can use the value of 'account' in your code
  res.send(`Account: ${accountValue}`);

});
router.get('/:account/:token',async  function(req, res, next) {
  const client = await db.connect();

  const accountAddress = req.params.account.toLowerCase();
  const tokenAddress = req.params.token.toLowerCase();
  console.log(accountAddress,tokenAddress)
  const arrPromises=[]
  
  try {
    // Perform database operations
    let tokens = client.collection('Tokens');
    let accounts = client.collection('Accounts');

    let previousTradingData = await accounts.findOne({account:accountAddress,token:tokenAddress});
    let lastState;
    if(previousTradingData == null)
    {
      let deployedBlockNumber;
      const data = await tokens.findOne({token:tokenAddress});
      if(data != null){
        deployedBlockNumber = data.deployedBlockNum;
      }
      else{
        deployedBlockNumber = await findDeploymentBlock(tokenAddress);
        let promise = tokens
          .insertOne({token:tokenAddress,deployedBlockNum: deployedBlockNumber})
          .then(res => {
            console.log('DatabaseAdd token suceess ',res)
          })
          .catch(err => {
            console.log('Database Error : Adding deployedBlockNum : ',err)
          })
        arrPromises.push(promise)
      }
      const {buySellStatus,tradingDetails} = await getAccountTokenTransfers(tokenAddress,accountAddress,deployedBlockNumber,{});
      convertBigIntToInt(buySellStatus)
      convertBigIntToInt(tradingDetails)
      let promise = accounts
          .insertOne({token:tokenAddress,account:accountAddress,buySellStatus,tradingDetails})
          .then(res => {
            console.log('DatabaseAdd tradingDetails suceess ',res)
          })
          .catch(err => {
            console.log('Database Error : Add tradingDetails : ',err)
          })
      arrPromises.push(promise)
      let pnl = await calcPnL(buySellStatus);
      res.json({pnl,buySellStatus,tradingDetails});
      
    }
    else{
      //previousTradingData = convertStringToBigInt(previousTradingData);
      let startBlockNumber = previousTradingData.buySellStatus.latestBlockNumber;
      const {buySellStatus,tradingDetails} = await getAccountTokenTransfers(tokenAddress,accountAddress,startBlockNumber,previousTradingData.buySellStatus);
      convertBigIntToInt(buySellStatus)
      convertBigIntToInt(tradingDetails)
      let promise = accounts
          .updateOne(
            {token:tokenAddress,account:accountAddress},
            {
              $set:{buySellStatus},
              $push:{
                tradingDetails:{
                  $each:tradingDetails
                }}
            })
          .then(res => {
            console.log('DatabaseUpdate tradingDetails suceess ',res)
          })
          .catch(err => {
            console.log('Database Error : UPdate tradingDetails : ',err)
          })
      arrPromises.push(promise)
      
      let pnl = await calcPnL(buySellStatus);
      const mergedTradingDetails = previousTradingData.tradingDetails.concat(tradingDetails);
      
      res.json({pnl,buySellStatus,tradingDetails:mergedTradingDetails});

    }
       
    
  } finally {
    await Promise.all(arrPromises)
    await db.close();
  }
  
  

});

module.exports = router;
