import { ChakraProvider } from '@chakra-ui/react'
import api from '@shared/api'
import { AUTH_URL } from '@shared/consts'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { SWRConfig } from 'swr'
import Home from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SWRConfig value={{
        revalidateOnFocus: false,
        errorRetryInterval: 500,
        errorRetryCount: 5,
        onError: async (error) => {
          if (error.response.status === 401) {
            // Authenticate if recieving unauthorized errors
            await api.post(`${AUTH_URL}/authenticate`);
          }
        }
    }}
    >
      <ChakraProvider>
        <Home />
      </ChakraProvider>
    </SWRConfig>
  </React.StrictMode>
)
