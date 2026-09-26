import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/tokens.css'
import './styles/global.css'
import AdoptPage from './pages/AdoptPage.jsx'
import DevKit from './pages/DevKit.jsx'
import ApplyPage from './pages/ApplyPage.jsx'
import ApplicationsPage from './pages/ApplicationsPage.jsx'
import ShelterInboxPage from './pages/ShelterInboxPage.jsx'
import MyPetsPage from './pages/MyPetsPage.jsx'
import PetEditorPage from './pages/PetEditorPage.jsx'
import MessagesPage from './pages/MessagesPage.jsx'
import CheckInsPage from './pages/CheckInsPage.jsx'
import ShelterCheckInsPage from './pages/ShelterCheckInsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import RequireAuth from './components/auth/RequireAuth.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { FavoritesProvider } from './context/FavoritesContext.jsx'
import { UnreadProvider } from './context/UnreadContext.jsx'
import { CheckInsProvider } from './context/CheckInsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
    <FavoritesProvider>
    <UnreadProvider>
    <CheckInsProvider>
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
          {/* the shelter's inbox: the list stays mounted while the reading pane switches applications */}
          <Route path="/shelter/applications" element={<RequireAuth><ShelterInboxPage /></RequireAuth>}>
            <Route index element={null} />
            <Route path=":id" element={null} />
          </Route>
          {/* the shelter's listings, and the add / edit form */}
          <Route path="/shelter/animals" element={<RequireAuth><MyPetsPage /></RequireAuth>} />
          <Route path="/shelter/animals/new" element={<RequireAuth><PetEditorPage /></RequireAuth>} />
          <Route path="/shelter/animals/:id/edit" element={<RequireAuth><PetEditorPage /></RequireAuth>} />
          {/* the list stays mounted while conversations open and close */}
          <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>}>
            <Route index element={null} />
            <Route path=":threadId" element={null} />
          </Route>
          {/* post-adoption check-ins: the adopter's pet diary, and the shelter's overview */}
          <Route path="/checkins" element={<RequireAuth><CheckInsPage /></RequireAuth>} />
          <Route path="/shelter/checkins" element={<RequireAuth><ShelterCheckInsPage /></RequireAuth>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dev/kit" element={<DevKit />} />
        </Routes>
      </BrowserRouter>
    </CheckInsProvider>
    </UnreadProvider>
    </FavoritesProvider>
    </AuthProvider>
  </StrictMode>,
)
