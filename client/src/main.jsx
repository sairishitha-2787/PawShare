/* eslint-disable react/only-export-components -- the entry file exports nothing, so fast refresh doesn't apply */
import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/tokens.css'
import './styles/global.css'
import AdoptPage from './pages/AdoptPage.jsx'
import DesktopPage from './pages/DesktopPage.jsx'
import ShellLayout from './components/shell/ShellLayout.jsx'
import RequireAuth from './components/auth/RequireAuth.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { FavoritesProvider } from './context/FavoritesContext.jsx'
import { UnreadProvider } from './context/UnreadContext.jsx'
import { CheckInsProvider } from './context/CheckInsContext.jsx'
import { AdminProvider } from './context/AdminContext.jsx'

// The desktop and the neighborhood load with the app; every other page is fetched the first time it opens
// (ShellLayout shows a LOADING... window meanwhile). The dev kit only exists in dev builds.
const ApplyPage = lazy(() => import('./pages/ApplyPage.jsx'))
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage.jsx'))
const ShelterInboxPage = lazy(() => import('./pages/ShelterInboxPage.jsx'))
const MyPetsPage = lazy(() => import('./pages/MyPetsPage.jsx'))
const PetEditorPage = lazy(() => import('./pages/PetEditorPage.jsx'))
const MessagesPage = lazy(() => import('./pages/MessagesPage.jsx'))
const CheckInsPage = lazy(() => import('./pages/CheckInsPage.jsx'))
const ShelterCheckInsPage = lazy(() => import('./pages/ShelterCheckInsPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'))
const ShelterProfilePage = lazy(() => import('./pages/ShelterProfilePage.jsx'))
const VerificationPage = lazy(() => import('./pages/VerificationPage.jsx'))
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'))
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const DevKit = import.meta.env.DEV ? lazy(() => import('./pages/DevKit.jsx')) : null

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
    <FavoritesProvider>
    <UnreadProvider>
    <CheckInsProvider>
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          {/* every page sits in the shell: the page, then the shared taskbar with the Start menu */}
          <Route element={<ShellLayout />}>
            {/* the desktop home */}
            <Route index element={<DesktopPage />} />
            {/* one layout route so the page (filters, street, view) stays mounted while profiles open and close */}
            <Route element={<AdoptPage />}>
              {/* element={null}: AdoptPage renders everything, the children only match URLs */}
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
            {/* a shelter's public profile (#general, #pets, #reviews, #history pick the tab), and its verification request */}
            <Route path="/shelters/:id" element={<ShelterProfilePage />} />
            <Route path="/shelter/verification" element={<RequireAuth><VerificationPage /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>}>
              <Route index element={null} />
              <Route path=":section" element={null} />
            </Route>
            <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            {DevKit && <Route path="/dev/kit" element={<DevKit />} />}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminProvider>
    </CheckInsProvider>
    </UnreadProvider>
    </FavoritesProvider>
    </AuthProvider>
  </StrictMode>,
)
