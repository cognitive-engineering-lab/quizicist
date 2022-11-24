import React from 'react'
import ReactDOM from 'react-dom/client'
import { SWRConfig } from 'swr'
import Home from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SWRConfig value={{ revalidateOnFocus: false }}>
      <Home />
    </SWRConfig>
  </React.StrictMode>
)
