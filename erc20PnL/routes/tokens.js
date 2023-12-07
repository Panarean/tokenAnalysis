const express = require('express');
const router = express.Router();


const db = require('../utils/db')
const { findDeploymentBlock, getAccountTokenTransfers,calcPnL, getTokenAnalysis } = require('../utils/chainAPI')
const {convertBigIntToString,convertStringToBigInt,convertBigIntToInt} = require('../utils')


router.get('/:token', async function(req, res, next) {
  
    const client = await db.connect();
    const tokenAddress = req.params.token.toLowerCase();
    console.log(tokenAddress)
    const arrPromises=[]

    let tokens = client.collection('Tokens');
    let deployedBlockNumber = -1, lastBlockNumber = -1
    const tokenData = await tokens.findOne({token:tokenAddress});
    let swaps = []
    if(tokenData != null){
        if(tokenData.deployedBlockNum)
            deployedBlockNumber = tokenData.deployedBlockNum;
        if(tokenData.lastBlockNumber)
        {
            lastBlockNumber = tokenData.lastBlockNumber+1;
            swaps = tokenData.swaps
        }
    }
    if(deployedBlockNumber == -1)
    {
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
    if(lastBlockNumber == -1)
        lastBlockNumber = deployedBlockNumber
    let orgswaps = JSON.parse(JSON.stringify(swaps))
    let result = await getTokenAnalysis(tokenAddress,lastBlockNumber,swaps);
    let additionals = result.swaps.filter(item => orgswaps.indexOf(item) === -1)
    console.log(additionals)
    let promise = tokens
          .updateOne({token:tokenAddress},{
            $set:{lastBlockNumber:result.last},
            $push:{
              swaps:{
                $each:additionals
              }}
          })
          .then(res => {
            console.log('DatabaseAdd token suceess ',res)
          })
          .catch(err => {
            console.log('Database Error : Adding deployedBlockNum : ',err)
          })
    arrPromises.push(promise)
    res.json(result.status);
    await Promise.all(arrPromises)
    db.close();

});



module.exports = router;
