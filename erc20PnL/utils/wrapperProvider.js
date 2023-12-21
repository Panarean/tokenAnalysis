const { ethers } = require("ethers")

const { quickNodeBuildEndPoint, publicProviderEndPoint, WETH, MoralisAPIKey } = require("../constants")
const { sleep, Semaphore, Mutex} = require('./index')


class wrapperProvider  {
    constructor() {
        this.proProviders = []
        this.proProviderStatus = []
        this.proProviderBandwidth = 550;
        
        for( let i = 0 ; i < quickNodeBuildEndPoint.length; i ++ ){
            this.proProviders.push(new ethers.JsonRpcProvider(quickNodeBuildEndPoint[i]))
            let mutex = new Mutex()
            this.proProviderStatus.push({mutex,lastTimestamps:[]})
        }
        this.publicProvider = new ethers.JsonRpcProvider(publicProviderEndPoint)
        this.proProviderCnt = quickNodeBuildEndPoint.length;
    }
    appropriateProvider() {
        const arr = this.proProviderStatus.map(elm => elm.lastTimestamps.length)
        const minValue = Math.min(...arr);
        const minInstances = arr.map((value,index) => {return {index, bMin : value === minValue} })
            .filter(elm => elm.bMin == true)
        let minIndex = minInstances[parseInt(Math.random()*minInstances.length)].index
       
        return minIndex
    }
    async getBlockNumber(...args) {
        let res = await this.publicProvider.getBlockNumber();
        return res;
    }

    async excuteFunc(funcName, args){
        
        let providerId = parseInt(Math.random()*this.proProviderCnt)
        
        let providerStatus = this.proProviderStatus[providerId];
        while(1) { 
            
            await providerStatus.mutex.lock()
            let curTime = new Date();
            while(providerStatus.lastTimestamps.length > 10 && curTime-providerStatus.lastTimestamps[0]<1000)
            {
                await sleep(1000-(curTime-providerStatus.lastTimestamps[0]))
                curTime = new Date();
            }
            providerStatus.mutex.unlock()
            if(providerStatus.lastTimestamps.length > 10 )
            {
                providerStatus.lastTimestamps.shift()
            }
            providerStatus.lastTimestamps.push(new Date())
            let res = await  this.proProviders[providerId][funcName](...args)
                .then(result => {  
                    return result;
                  })
                .catch(err => {
                    console.log(err,Math.random())
                    if(err.error)
                    {
                        if(err.error.code == -32012 || err.error.code == -32007)
                            return -1;
                    }
                    if(err.code == -32012 || err.code == -32007)
                        return -1;
                    return ''
                  })
            
            if(res == -1)  {
                continue;
            }
            return res;
        } 
    }

    async getCode(...args) {
        let res = await this.excuteFunc("getCode",args)
        return res;
    }
    async getLogs(...args) {
        let res = await this.excuteFunc("getLogs",args)
        return res;
    }
    async getTransactionReceipt(...args) {
        let res = await this.excuteFunc("getTransactionReceipt",args)
        return res;
    }
}

const provider = new wrapperProvider();
module.exports = {
    provider 
}