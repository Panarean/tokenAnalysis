import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'

import  { BACKEND_URL}  from './config'

function App() {
  const [count, setCount] = useState(0)
  const [loading,setLoading] = useState(false)
  const [tokenAddress,setTokenAddress] = useState('0x960b252E38D1f213C10be331D7f1cf10C9b803d1')
  const [accountAddress,setAccountAddress] = useState('0x7D158C0eCC53056444B0f92487CB1b0c67441d28')
  const [apiResult,setapiResult]=useState(null)
  const getAPI = async () => {
    setLoading(true)
    let res = await axios.get(`${BACKEND_URL}/tokens/${tokenAddress}`)
    console.log(res)
    console.log(Object.keys(res.data).map(account => {
      return (
          res.data[account].transactions/*.map((transaction) => {
            
            return (  
                  `token0: ${transaction.token0}  token1: ${transaction.token1}`

            )
          })*/

      )
    }))
    //let res = await axios.get(`${BACKEND_URL}/accounts/${accountAddress}/${tokenAddress}`)
    setLoading(false)
    setapiResult(res.data)
    
  }
  return (
    <>
      {/*address: <input type='text' value={accountAddress} onChange={(e) => setAccountAddress(e.target.value)} />*/}
      token: <input type='text' value={tokenAddress}onChange={(e) => setTokenAddress(e.target.value)} />
      <button onClick={getAPI}> get </button>
      <div>
        {
          loading && (<>Loading</>)
        }
        {
          !loading &&  apiResult!=null && (
            <>
            {
              Object.keys(apiResult).map(account => {
                return (
                  <>
                  <h2>{account}</h2>
                  <p>RealizedProfit : {apiResult[account].RealizedProfit}</p>
                  <p>Transaction History</p>
                  {
                    apiResult[account].transactions.map((transaction) => {
                      
                      return (  
                          <p>
                            token0: {transaction.token0} &lt;-&gt; token1: {transaction.token1}
                          </p>
                      )
                    })
                  }
                  </>
                )
              })
            }
            </>
              
            )
        }
      </div>
    </>
  )
}

export default App
