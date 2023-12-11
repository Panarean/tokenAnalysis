const express = require('express');
const router = express.Router();


const {db} = require('../utils/db')
const { findDeploymentBlock, getAccountTokenTransfers,calcPnL, getTokenAnalysis } = require('../utils/chainAPI')
const {sleep} = require('../utils')


router.get('/:token', async function(req, res, next) {
  
    while(db.on == false){
      await sleep(50)
    }
    const tokenAddress = req.params.token.toLowerCase();
    console.log(tokenAddress)
    const arrPromises=[]
    
    let tokens = db.database.collection('Tokens');
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
    let originalSwapsLength = swaps.length;
    let result = await getTokenAnalysis(tokenAddress,lastBlockNumber,swaps);
    let additionals = result.swaps.slice(originalSwapsLength)
    console.log(additionals.length)
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
});



module.exports = router;
