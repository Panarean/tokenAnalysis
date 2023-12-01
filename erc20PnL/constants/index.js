const PROD = 0
const MAINNET = 1
const mongoUser = 'mcollin081'
const mongoPassword = 'Bn3i31jxHOtzlWXm'

const quickNodeBuildEndPoint=MAINNET?['https://icy-few-fire.quiknode.pro/9955a49e46912dd53ec8a7e728a03b97eec54bea/']:["https://lingering-light-panorama.ethereum-goerli.quiknode.pro/e356861b929a0ea9d24864d092cb3ce1587b8747/"]
const quickNodeFreeEndPoint=['https://nameless-ancient-wish.ethereum-goerli.quiknode.pro/387ba170e46321989c453a00acffdf02ad2c58c5/']
const WETH  = MAINNET?'0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2':'0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
module.exports = {
    mongoURI : `mongodb+srv://${mongoUser}:${mongoPassword}@smartestdev.ptx7cq0.mongodb.net/?retryWrites=true&w=majority`,
    dbName : 'ERC20PnL',
    quickNodeBuildEndPoint,
    quickNodeFreeEndPoint,
    WETH,
    MoralisAPIKey: 'uEFDTkFRXhFFveZ2SX2XXglLGji3eC6LaJpN9zRILWxFfgkaO3GTNSR9i5Wwq11G'

}