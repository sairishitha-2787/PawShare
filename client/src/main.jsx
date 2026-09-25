import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/tokens.css'
import './styles/global.css'
import AdoptPage from './pages/AdoptPage.jsx'
import DevKit from './pages/DevKit.jsx'
import ApplyPage from './pages/ApplyPage.jsx'
import ApplicationsPage from './pages/ApplicationsPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import RequireAuth from './components/auth/RequireAuth.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { FavoritesProvider } from './context/FavoritesContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
    <FavoritesProvider>
      <BrowserRouter>
        <Routes>
          {/* one layout route so the page (filters, street, view) stays mounted while profiles open and close */}
          <Route element={<AdoptPage />}>
            {/* element={null}: AdoptPage renders everything, the children only match URLs */}
            <Route index element={null} />
            <Route path="adopt" element={null} />
            <Route path="adopt/:petId" element={null} />
          </Route>
          <Route path="/apply/:petId" element={<RequireAuth><ApplyPage /></RequireAuth>} />
          {/* like the neighborhood: the list stays mounted while an application's detail opens and closes */}
          <Route path="/applications" element={<RequireAuth><ApplicationsPage /></RequireAuth>}>
            <Route index element={null} />
            <Route path=":id" element={null} />
          </Route>
          {/* placeholders: the shelter's inbox arrives in session 12, messages in session 14 */}
          <Route
            path="/shelter/applications"
            element={
              <RequireAuth>
                <PlaceholderPage title="INCOMING_APPLICATIONS/" text="Applications for your pets will be listed here soon." />
              </RequireAuth>
            }
          />
          <Route
            path="/messages"
            element={
              <RequireAuth>
                <PlaceholderPage title="MESSAGES.EXE" text="Your conversations with shelters will be here soon." />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dev/kit" element={<DevKit />} />
        </Routes>
      </BrowserRouter>
    </FavoritesProvider>
    </AuthProvider>
  </StrictMode>,
)
