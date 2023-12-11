const { ethers } = require("ethers")
const { quickNodeBuildEndPoint, quickNodeFreeEndPoint, WETH, MoralisAPIKey } = require("../constants")
const { ERC20ABI }  = require('../constants/ABIs');
const Moralis = require('moralis').default

Moralis.start({
    apiKey: MoralisAPIKey
  });

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
const getInternalTransaction = async (httpProvider,txHash) => {
    
    while(1) {
        let res =await  httpProvider.send("ots_traceTransaction", [txHash])
            .then(result => {  return result; })
            .catch(err => {
                if(err.error.code == -32012 || err.error.code == -32007)
                    return -1;
                else if (err.error.code == -32601){
                    return 'NoInternalTransaction'
                }
                console.log('err',err)
                return []
            })
        if(res == -1)  {
            await sleep(100)
            continue;
        }
        return res;
    } 
    
}
const _getCode = async (httpProvider, contractAddress,blockNum) => {
    while(1) {
        let res =await  httpProvider.getCode(contractAddress,blockNum)
            .then(result => {  return result; })
            .catch(err => {
                if(err.error.code == -32012 || err.error.code == -32007)
                    return -1;
                
                console.log('err',err)
                return ''
            })
        if(res == -1)  {
            await sleep(100)
            continue;
        }
        return res;
    } 
}
const findDeploymentBlock = async (contractAddress) => {
    const httpProvider = new ethers.JsonRpcProvider(quickNodeBuildEndPoint[0]);
    let last = await httpProvider.getBlockNumber();
    
    if((await _getCode(httpProvider,contractAddress,parseInt(last-1) )) == '0x'){
        return -1;
    }
    let first = 1;
    while(last - first > 1){
        let mid = parseInt((last + first) / 2);
        if((await _getCode(httpProvider,contractAddress,mid)) == '0x'){
            first = mid
        }
        else{
            last = mid
        }
    }
    return last;
}
const _getTransferLogs = async (tokenContract, filter,from , to) => {
    while(1){
        let res =await  tokenContract.queryFilter(filter,from,to)
            .then(result => {  return result; })
            .catch(err => {
                if(err.error.code == -32012 || err.error.code == -32007)
                    return -1;
                console.log('err',err)
                return []
            })
        if(res == -1)  {
            await sleep(100)
            continue;
        }
        return res;
    }
    
}
const _getTransactionReceipt = async (httpProvider,tx) => {
    while(1){
        let res = await httpProvider.getTransactionReceipt(tx)
            .then(result => {  return result; })
            .catch(err => {
                if(err.error.code == -32012 || err.error.code == -32007)
                    return -1;
                console.log('err',err)
                return []
            })
        if(res == -1)  {
            await sleep(100)
            continue;
        }
        return res;
    }
    
}
const _getLogs = async (httpProvider,filter) => {

    while(1){
        let res =await  httpProvider.getLogs(filter)
            .then(result => {  return result; })
            .catch(err => {
                
                if(err.code == -32012 || err.code == -32007)
                    return -1;
                console.log('err',err)
                return []
            })
        if(res == -1)  {
            await sleep(100)
            continue;
        }
        return res;
    }
}
const getAccountTokenTransfers = async (tokenAddress,accountAddress,startBlockNum,initialStatus) => {
    tokenAddress = tokenAddress.toLowerCase();
    accountAddress = accountAddress.toLowerCase();
    const httpProvider = new ethers.JsonRpcProvider(quickNodeBuildEndPoint[0]);
    const tokenContract = new ethers.Contract(tokenAddress,ERC20ABI,httpProvider);

    let last = await httpProvider.getBlockNumber();
    let transactions = [];
    let arrPromises = [];
    for(let i = startBlockNum ;  i < last  ; i += 10000){
        let filter = tokenContract.filteracs.Transfer(accountAddress);
        let promise = _getTransferLogs(tokenContract,filter,i,i+9999)
            .then(res => {
                transactions.push(...(res.map(elm => elm.transactionHash)));
            } )
        arrPromises.push(promise)  

        filter = tokenContract.filters.Transfer(null,accountAddress);
        promise = _getTransferLogs(tokenContract,filter,i,i+9999)
            .then(res => {
                transactions.push(...(res.map(elm => elm.transactionHash)));
            } )

    }
    
    await Promise.all(arrPromises);
    arrPromises = []
    transactions = [...new Set(transactions)];
    console.log(transactions)
    console.log(transactions.length)
    let transferLogs = [];
    
    for (let i = 0 ; i < transactions.length; i++){
        let tx = transactions[i]
        let promise =  _getTransactionReceipt(httpProvider,tx)
            .then(async (txReceipt) => {
                console.log(`--analyzing transaction ${i+1}/${transactions.length}`)
                let swapFlag = 0;
                let logs = txReceipt.logs
                    .filter(elm => {
                        return  elm.topics[0] == ethers.id("Transfer(address,address,uint256)")
                    })
                    .filter(elm => {
                        let address1 = addressConvert(elm.topics[1],false)
                        let address2 = addressConvert(elm.topics[2],false)
                        return  (addressConvert(elm.topics[1],false) == accountAddress || addressConvert(elm.topics[2],false) == accountAddress)
                    })
                    .map(elm => {
                        let isBuy = addressConvert(elm.topics[2],false) == accountAddress
                        swapFlag = swapFlag | (1 << isBuy)
                        return {
                            token:elm.address.toLowerCase(),
                            isBuy,
                            amount: elm.data,
                        }
                    })
                let internaltransactions = await getInternalTransaction(httpProvider,tx);
                
                let valueChanges = internaltransactions
                    .filter(elm => elm.value!='0x0' && (elm.from == accountAddress || elm.to == accountAddress))
                    .map(elm => {
                        return {
                            token: WETH.toLowerCase(),
                            isBuy: elm.to == accountAddress,
                            amount: elm.value
                        }
                    })
                
                logs.push(...valueChanges)
                transferLogs.push({transfers: logs, tx,blockNum:txReceipt.blockNumber})
                console.log(`analyzing transaction ${i+1}/${transactions.length}`)
            });
        if(i%3 ==0)
        {
            await Promise.all(arrPromises)
            arrPromises = []
        }
        arrPromises.push(promise)
    }
    await Promise.all(arrPromises)
    arrPromises = []
    console.log(transferLogs)
    let buySellStatus = initialStatus, tradingDetails= []
    
    transferLogs
        .sort((fir,sec)=>{ fir.blockNum-sec.blockNum > 0})
        .forEach(transaction => {
            let transactionBuySell = {}
            transaction.transfers.forEach(transfer => {
                if(transactionBuySell[transfer.token] == undefined)
                    transactionBuySell[transfer.token] = 0n;
                if(transfer.isBuy)
                    transactionBuySell[transfer.token] += BigInt(transfer.amount);
                else 
                    transactionBuySell[transfer.token] -= BigInt(transfer.amount);
            })
            let swapFlag = 0;
            Object.keys(transactionBuySell).map(key => {
                if(transactionBuySell[key] < 0n )  swapFlag |= 1
                if(transactionBuySell[key] > 0n )  swapFlag |= 2
            })
            if(swapFlag != 3)   {
                return;
            }
            Object.keys(transactionBuySell).map(key => {
                if(buySellStatus[key] == undefined)
                    buySellStatus[key] = 0n;
                buySellStatus[key] += transactionBuySell[key]
            })
            tradingDetails.push({transactionBuySell,tx:transaction.tx,blockNum:transaction.blockNum})
        })
    return {
        buySellStatus: {...buySellStatus,latestBlockNumber: last},
        tradingDetails
    }
    
}
const calcPnL = async (buySellStatus) => {
    let arrPromises = []
    let RealizedProfit = 0, UnrealizedProfit = 0;
    Object.keys(buySellStatus).map(async (key) => {
        if(key != "latestBlockNumber"){
            let promise = getTokenPrice(key).then(price => {
                
                let tokenPrice = parseFloat(price);
                RealizedProfit += buySellStatus[key] * tokenPrice , UnrealizedProfit += buySellStatus[key] * tokenPrice
            })
            arrPromises.push(promise)
        }
    })
    await Promise.all(arrPromises);
    return {RealizedProfit, UnrealizedProfit}
}
const getTokenAnalysis = async (tokenAddress,startBlockNum,swaps) => {
    let pairs=['0x1a1b82217094953c05c3fa7d2f134b360a82390c']
    //let pairs=['0xc52a840200dc61a94a63bac75afbf1ad0b05c6ce','0x1a1b82217094953c05c3fa7d2f134b360a82390c']
    const httpProvider = new ethers.JsonRpcProvider(quickNodeBuildEndPoint[0]);
    const httpPublicProvider = new ethers.JsonRpcProvider("https://ethereum.publicnode.com")
    let last = await httpPublicProvider.getBlockNumber();
    let transactions = []
    let arrPromises = []
    for(let i = startBlockNum ;  i < last  ; i += 10000){
        let filter = {address:pairs,topics:['0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'],fromBlock:i,toBlock:i+9999}
        let promise = _getLogs(httpProvider,filter)
            .then(res => {
                transactions.push(...res.map(elm => {return elm.transactionHash}));
            } )
        arrPromises.push(promise) 
    }
    await Promise.all(arrPromises)
    arrPromises = []
    transactions = [...new Set(transactions)];
    //transactions = ['0xc51fd12a8569545355209414bf2a13fcdd9fd2c167ac4cf13e95f25eac8309e2']

    for (let i = 0 ; i < transactions.length; i++){
        let tx = transactions[i]
        let promise =  _getTransactionReceipt(httpProvider,tx)
            .then(async (txReceipt) => {
                console.log(`--analyzing transaction ${i+1}/${transactions.length}`)
                let logs = txReceipt.logs
                    .filter(elm => {
                        return elm.topics[0] == '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822' && pairs.includes(elm.address.toLowerCase())
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
        
        if(i%5 == 0)
        {
            await Promise.all(arrPromises)
            arrPromises = []
        }
    }
    await Promise.all(arrPromises);
    
    arrPromises = []
    let status = {}
    swaps.forEach(swap => {
        if(!status[swap.trader]){
            status[swap.trader]={}
            status[swap.trader].transactions=[]
        }
        status[swap.trader].transactions.push(swap)
    })
    Object.keys(status).map((account) => {
        
        let balance = 0;
        let RealizedProfit = 0
        let InvestAmount = 0;
        for(let i = 0 ; i < status[account].transactions.length; i++){
            let transaction = status[account].transactions[i]
            if(balance == 0){
                InvestAmount += Math.abs(transaction.token1)
            }
            else if(balance > 0 ){
                if(transaction.token0 > 0){
                    InvestAmount += Math.abs(transaction.token1)
                }
                else {
                    if(balance < -transaction.token0){
                        let newInvestAmount = -transaction.token1 * (balance+transaction.token0) / transaction.token0
                        RealizedProfit += (transaction.token1-newInvestAmount) - InvestAmount
                        InvestAmount = newInvestAmount

                    }
                    else{
                        let newInvestAmount = InvestAmount*(balance+transaction.token0)/balance
                        RealizedProfit += transaction.token1-(InvestAmount-newInvestAmount)
                        InvestAmount = newInvestAmount
                    }
                }
            }
            else{
                if(transaction.token0 < 0){
                    InvestAmount += Math.abs(transaction.token1)
                }
                else {
                    if(-balance < transaction.token0){
                        let newInvestAmount = -transaction.token1 * (balance+transaction.token0) / transaction.token0
                        RealizedProfit += (transaction.token1+newInvestAmount) + InvestAmount
                        InvestAmount = newInvestAmount

                    }
                    else{
                        let newInvestAmount = InvestAmount*(balance+transaction.token0)/balance
                        RealizedProfit += transaction.token1+(InvestAmount-newInvestAmount)
                        InvestAmount = newInvestAmount
                    }
                }
            }
            balance += transaction.token0
        }
        status[account].balance =balance ;
        status[account].InvestAmount = InvestAmount;
        status[account].RealizedProfit = RealizedProfit;
    })
    
    return {status,swaps,last}
}
module.exports = {
    addressConvert,
    getInternalTransaction,
    findDeploymentBlock,
    getAccountTokenTransfers,
    calcPnL,
    getTokenAnalysis,
    _getTransactionReceipt
}