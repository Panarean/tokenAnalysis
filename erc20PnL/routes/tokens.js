const express = require('express');
const router = express.Router();

const { getTokenAnalysis } = require('../controllers/tokens')

router.get('/:token', async function(req, res, next) {
  
    
    const tokenAddress = req.params.token.toLowerCase();
    console.log(tokenAddress)

    let res = getTokenAnalysis(tokenAddress)

    

    const swapDetails = getTokenAnalysis(swaps)
    res.json(swapDetails);
    await Promise.all(arrPromises)


    {
    
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
        }
});



module.exports = router;
