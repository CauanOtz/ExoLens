import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import DashboardPage from './pages/Dashboard/DashboardPage'
import { SettingsPage } from './pages/Settings/SettingsPage'
import TransitPage from './pages/Transit/TransitPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/dashboard/activity" element={<DashboardPage />} />
  <Route path="/transit" element={<TransitPage />} />
  <Route path="/settings" element={<SettingsPage />} />
        {/* Future routes */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
