import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'

import  { BACKEND_URL}  from './config'

function App() {
  const [count, setCount] = useState(0)
  const [loading,setLoading] = useState(false)
  const [tokenAddress,setTokenAddress] = useState('0x6982508145454ce325ddbe47a25d4ec3d2311933')
  const [accountAddress,setAccountAddress] = useState('0x7D158C0eCC53056444B0f92487CB1b0c67441d28')
  const [apiResult,setapiResult]=useState(null)
  const getAPI = async () => {
    setLoading(true)
    let res = await axios.get(`${BACKEND_URL}/accounts/${accountAddress}/${tokenAddress}`)
    setLoading(false)
    setapiResult(res.data)
  }
  return (
    <>
      address: <input type='text' value={accountAddress} onChange={(e) => setAccountAddress(e.target.value)} />
      token: <input type='text' value={tokenAddress}onChange={(e) => setTokenAddress(e.target.value)} />
      <button onClick={getAPI}> get </button>
      <div>
        {
          loading && (<>Loading</>)
        }
        {
          !loading &&  apiResult!=null &&(
              <>
                pnL: {apiResult.pnl.RealizedProfit}
                <br/>
                lastState: {JSON.stringify(apiResult.buySellStatus)}
                <br/>
                Tradings: {JSON.stringify(apiResult.tradingDetails.map(elm => {return elm.transactionBuySell}))}
              </>
            )
        }
      </div>
    </>
  )
}

export default App
