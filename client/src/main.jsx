import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/tokens.css'
import './styles/global.css'
import AdoptPage from './pages/AdoptPage.jsx'
import DevKit from './pages/DevKit.jsx'
import { FavoritesProvider } from './context/FavoritesContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FavoritesProvider>
      <BrowserRouter>
        <Routes>
          {/* one layout route so the page (filters, street, view) stays mounted while profiles open and close */}
          <Route element={<AdoptPage />}>
            <Route index />
            <Route path="adopt" />
            <Route path="adopt/:petId" />
          </Route>
          <Route path="/dev/kit" element={<DevKit />} />
        </Routes>
      </BrowserRouter>
    </FavoritesProvider>
  </StrictMode>,
)
