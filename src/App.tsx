import React from 'react'
import Layout from './components/layout/Layout'
import AppRoutes from './routes/AppRoutes'
import { UserProvider } from './lib/auth/UserContext'
import { ThemeProvider } from './lib/theme/ThemeProvider'
import { SettingsProvider } from './lib/settings/SettingsContext'
import { ToastContainer } from 'react-toastify'

export default function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <SettingsProvider>
          <Layout>
            <AppRoutes />
          </Layout>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
          />
        </SettingsProvider>
      </ThemeProvider>
    </UserProvider>
  )
}

