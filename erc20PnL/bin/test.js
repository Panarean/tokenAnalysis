const {getTokenAnalysis} = require('../controllers/tokens')
//const {getTokenSwaps} = require('../utils/chainAPI')
//const {gettok}
const { provider } = require('../utils/wrapperProvider')
const main = async () => {
    let res = await getTokenAnalysis("0x5483dc6abda5f094865120b2d251b5744fc2ecb5")
    //18787379
    //let res = await getTokenAnalysis("0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2")
    //let arr = []
    //let start = new Date()
    //for(let i = 0; i < 500; i ++)
    ///{
      //  let promise = provider.getCode("0xcd8804fe8a25325f4ec56e1d5fb5e3b93ecb9e6e",i)
        ///arr.push(promise)
    //}
    //await Promise.all(arr)
    //console.log(new Date() - start)



    //console.log(res)
}




main()