const { _getTransactionReceipt} = require('./utils/chainAPI')
const { ethers } = require("ethers")
const { quickNodeBuildEndPoint, quickNodeFreeEndPoint, WETH, MoralisAPIKey  } = require("./constants")
const main  =  async () => {
    const httpProvider = new ethers.JsonRpcProvider(quickNodeBuildEndPoint[0]);
    let res = await _getTransactionReceipt(httpProvider,"0x0fbe5607e4445647d751aa230a89dfef7ddb939bbdd7b0a69ac68146bfb18e5a")
    
}
main()