const { ethers } = require("ethers")
const Moralis = require('moralis').default

const {provider} = require('./wrapperProvider')
const { quickNodeBuildEndPoint, publicProviderEndPoint, WETH, MoralisAPIKey } = require("../constants")
const { ERC20ABI }  = require('../constants/ABIs');

Moralis.start({
    apiKey: MoralisAPIKey
  });



const addressConvert = (address,expand=true) => {
    if(expand == true){
        return `0x000000000000000000000000${address.slice(2)}`
    }
    else{
        return `0x${address.slice(26)}`
    }
}
const getTokenPrice = async (tokenAddress,toBlock) => {
    try {
        const response = await Moralis.EvmApi.token.getTokenPrice({
          "chain": "0x1",
          "address": tokenAddress,
          toBlock
        });
        return response.toJSON().usdPrice * Math.pow(10,20-response.toJSON().tokenDecimals);
      } catch (e) {
        console.error(e);
        let price = await getTokenPrice(tokenAddress)
        return price
    }
}


const findDeploymentBlock = async (contractAddress) => {
    
    let last = await provider.getBlockNumber();
       
    if((await provider.getCode(contractAddress,parseInt(last-1) )) == '0x'){
        return -1;
    }
    let first = 1;
    while(last - first > 1){
        let mid = parseInt((last + first) / 2);
        if((await provider.getCode(contractAddress,mid)) == '0x'){
            first = mid
        }
        else{
            last = mid
        }
    }
    return last;
}
const getTokenSwaps = async (pairAddress, startBlockNumber) => {
    let last = await provider.getBlockNumber();
    let transactions = []
    let arrPromises = []
    for(let i = startBlockNumber ;  i < last  ; i += 10000){
        let filter = {address:pairAddress,topics:['0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'],fromBlock:i,toBlock:i+9999}
        let promise = provider.getLogs(filter)
            .then(res => {
                transactions.push(...res.map(elm => {return elm.transactionHash}));
            } )
        arrPromises.push(promise) 
    }
    await Promise.all(arrPromises)
    arrPromises = []
    transactions = [...new Set(transactions)];
    console.log(transactions)
    let swaps = []
    for (let i = 0 ; i < transactions.length; i++){
        let tx = transactions[i]
        let promise =  provider.getTransactionReceipt(tx)
            .then(async (txReceipt) => {
                console.log(`--analyzing transaction ${i+1}/${transactions.length}`)
                let logs = txReceipt.logs
                    .filter(elm => {
                        return elm.topics[0] == '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822' && pairAddress == elm.address.toLowerCase()
                    })

                    .map(elm => {
                        let token0 = parseInt('0x'+elm.data.slice(130,194))-parseInt('0x'+elm.data.slice(2,66))
                        let token1 = parseInt('0x'+elm.data.slice(194,258))-parseInt('0x'+elm.data.slice(66,130))
                        return {
                            trader: txReceipt.from,
                            token0,
                            token1,
                            tx: txReceipt.hash,
                            blockNumber:txReceipt.blockNumber
                        }
                    })
                swaps.push(...logs)
                console.log(`analyzing transaction ${i+1}/${transactions.length}`)
            })
        arrPromises.push(promise)
        
    }
    await Promise.all(arrPromises);
    return {swaps,last:last+1 }
}

module.exports = {
    findDeploymentBlock,
    getTokenSwaps,
    
    addressConvert
}