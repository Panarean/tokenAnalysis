const { ethers } = require("ethers")
const { quickNodeBuildEndPoint, quickNodeFreeEndPoint, WETH, MoralisAPIKey } = require("../constants")
const {UNIV2FactoryABI,UNIV2PairABI} = require('../constants/ABIs')
const {UNIv2factoryAddress} = require('../constants')
const {db} = require('../utils/db')
const {sleep} = require('../utils')
const addUniswapV2Pairs = async () => {
    while(db.on == false){
        await sleep(50)
      }

    const httpProvider = [
        new ethers.JsonRpcProvider('https://ethereum.publicnode.com'),
        new ethers.JsonRpcProvider('https://rpc.ankr.com/eth'),
        new ethers.JsonRpcProvider('https://eth.llamarpc.com'),
    ]
        
    let pairs = db.database.collection('Pairs');
    let orgCount = await pairs.countDocuments();
    
    const factoryContract = new ethers.Contract(UNIv2factoryAddress,UNIV2FactoryABI,httpProvider[1]);
    let length = await factoryContract.allPairsLength()
    
    let arrPromises = []
    console.log(orgCount,length)
    let documents = []
    for( let i = orgCount ; i < length ;i ++){
        let promise = factoryContract.allPairs(i).then(async (pairAddress) => {
            let pairContract = new ethers.Contract(pairAddress,UNIV2PairABI,httpProvider[1])
            let token0  = await pairContract.token0()
            let token1  = await pairContract.token1()
            
            documents.push({pairAddress:pairAddress.toLowerCase(),tokens: [token0.toLowerCase(),token1.toLowerCase()]})
            console.log({i,pairAddress})
        })
        arrPromises.push(promise)
        if(i%100 == 0){
            await Promise.all(arrPromises)
            arrPromises = []
        }
    }
    await Promise.all(arrPromises)
    if(documents.length)
        await pairs.insertMany(documents).then(res => console.log('Successfuly inserted')).catch(err => console.log('Failed Error:',err))
    console.log('finished')
}
const findPairs = async () => {
    while(db.on == false){
        await sleep(50)
      }
    let tokenAddress = '0x5d7ba3b98457fc1fade1f23bb00d2fe1574f63b2'.toLowerCase()
    let pairs = db.database.collection('Pairs');
    //db.client.db('asdf').collection('aa').find({"tokens": { $in } }).toArray()
    let p = (await pairs.find({"tokens": {$elemMatch:{$eq :tokenAddress}}}).toArray())
    console.log(p)

}  
//findPairs()
addUniswapV2Pairs();