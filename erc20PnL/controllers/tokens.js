
const {db} = require('../utils/db')
const { findDeploymentBlock, getTokenSwaps } = require('../utils/chainAPI')
const {sleep} = require('../utils')
const {WETH} = require('../constants')
const parsePair = async (pair) => {
  let deployedBlockNumber = -1, lastBlockNumber = -1
  let swaps=[];
  if(pair.deployedBlockNumber)
    deployedBlockNumber = pair.deployedBlockNumber;

  if(pair.lastBlockNumber)
    lastBlockNumber = pair.lastBlockNumber+1;
    
  if(deployedBlockNumber == -1)
  {
    deployedBlockNumber = await findDeploymentBlock(pair.pairAddress);
  }
  if(lastBlockNumber == -1)
    lastBlockNumber = deployedBlockNumber
  if(pair.swaps)
    swaps = pair.swaps
  return { pairAddress : pair.pairAddress, deployedBlockNumber, lastBlockNumber, swaps }
}

const findPairs = async (tokenAddress,pairs) => {
  
  let res = (await pairs.find({"tokens": {$elemMatch:{$eq :tokenAddress}}}).toArray())
  res = res.filter(elm => elm.tokens.includes(WETH))
  return res;
} 


const getTokenAnalysis = async (tokenAddress) => {

    const arrPromises=[]

    while(db.on == false){
      await sleep(50)
    }

    let pairs = db.database.collection('Pairs');
    
    const matchPairs = await findPairs(tokenAddress,pairs)
    
    for(let i in matchPairs) {
      let pair = matchPairs[i]
      const {pairAddress,deployedBlockNumber, lastBlockNumber, swaps } = await parsePair(pair)
      console.log(pairAddress,deployedBlockNumber, lastBlockNumber, swaps)
      
      const swapDetails = await getTokenSwaps(pairAddress,lastBlockNumber);
      console.log(swapDetails.swaps,swapDetails.last)
      let promise = pairs
          .updateOne({pairAddress},{
            
            $set:{lastBlockNumber:swapDetails.last, deployedBlockNumber},
            $push:{
              swaps:{
                $each:swapDetails.swaps
              }}
          })
          .then(res => {
            console.log('DatabaseAdd swaps suceess ',res)
          })
          .catch(err => {
            console.log('Database Error : Adding swaps : ',err)
          })
      arrPromises.push(promise)
      swaps.push(...swapDetails.swaps)

      console.log(swaps)
    }
} 

module.exports = {
    getTokenAnalysis
}