import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-center"
        duration={2400}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              'font-sans flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-3 text-sm text-white shadow-lg w-[356px] max-w-[calc(100vw-32px)]',
            error: '!bg-bordeaux',
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
