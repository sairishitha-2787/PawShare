import { Suspense } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Taskbar from '../ui/Taskbar.jsx'
import ErrorDialog from '../ui/ErrorDialog.jsx'
import LoadingWindow from '../ui/LoadingWindow.jsx'
import StartMenu from './StartMenu.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCheckInsTask } from '../../context/CheckInsContext.jsx'
import { useAdminTask } from '../../context/AdminContext.jsx'
import { TaskCountsProvider, useTaskCounts } from '../../context/TaskCountsContext.jsx'
import { BootProvider, useBoot } from '../../context/BootContext.jsx'
import { applicationsTaskLabel, inboxTaskLabel } from '../../utils/applications.js'
import { messagesTaskLabel } from '../../utils/messages.js'
import { displayName } from '../../utils/auth.js'
import { profileTask, shelterPath } from '../../utils/shelters.js'
import { rolePages } from '../../utils/shell.js'
import { API_CONFIGURED } from '../../api/client.js'
import './Shell.css'

// The taskbar under every page: the Start menu, one task per place (the page you're on is a plain label),
// the user and the clock. Below 520px only start, the current page, tasks with something waiting and the
// clock stay; everything else is in the Start menu.
function ShellTaskbar() {
  const { user, loading, logout } = useAuth()
  const counts = useTaskCounts()
  const { replay } = useBoot()
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname } = location
  const on = (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  const role = user?.role

  const onAdopt = on('/adopt')
  const onCheckIns = on('/checkins') || on('/shelter/checkins')
  const checkInsTask = useCheckInsTask(navigate, { current: onCheckIns })
  const adminTask = useAdminTask(navigate, { current: on('/admin') })
  const onOwnProfile = role === 'shelter' && pathname === shelterPath(user.id)

  // a task: a button unless it's the current page; hidden on small screens unless current or showing a count
  const task = (id, label, to, { current = false, count = null } = {}) => ({
    id,
    label,
    ...(!current && { onClick: () => navigate(to) }),
    hideOnSmall: !current && !(count > 0),
  })

  const items = [
    task('hood', 'Neighborhood.exe', '/adopt', { current: onAdopt }),
    ...(onAdopt
      ? [
          { id: 'key', label: 'Key.txt', hideOnSmall: true },
          counts.favorites != null && { id: 'fav', label: `Favorites (${counts.favorites})`, hideOnSmall: true },
        ]
      : []),
    role === 'adopter' &&
      task('apps', applicationsTaskLabel(counts.applications), '/applications', {
        current: on('/applications'),
        count: counts.applications,
      }),
    role === 'shelter' && task('mypets', 'My pets', '/shelter/animals', { current: pathname === '/shelter/animals' }),
    adminTask && { ...adminTask, hideOnSmall: Boolean(adminTask.onClick) && !(counts.admin > 0) },
    (role === 'shelter' || role === 'admin') &&
      task('inbox', inboxTaskLabel(counts.inbox), '/shelter/applications', {
        current: on('/shelter/applications'),
        count: counts.inbox,
      }),
    role === 'shelter' && { ...profileTask(user, navigate, { current: onOwnProfile }), hideOnSmall: !onOwnProfile },
    checkInsTask,
    user && task('msgs', messagesTaskLabel(counts.unread), '/messages', { current: on('/messages'), count: counts.unread }),
    user && { id: 'me', label: `${displayName(user)} · ${user.role}`, hideOnSmall: true },
    user && { id: 'logout', label: 'Log out', onClick: logout, hideOnSmall: true },
    // nothing while a saved login is being checked, so "Log in" doesn't flash up
    !user && !loading && pathname !== '/login' && {
      id: 'login',
      label: 'Log in',
      onClick: () => navigate('/login', { state: { from: location } }),
      hideOnSmall: true,
    },
  ]

  const badge = { apps: counts.applications, inbox: counts.inbox, checkins: counts.checkIns, msgs: counts.unread, admin: counts.admin }
  const place = (item) => ({ ...item, current: on(item.to), badge: badge[item.id] })
  const account = user
    ? [
        { id: 'account', label: 'Account settings', to: '/account', current: pathname === '/account' },
        { id: 'logout', label: 'Log out', onSelect: logout },
      ]
    : [
        { id: 'login', label: 'Log in', to: '/login', current: pathname === '/login' },
        { id: 'signup', label: 'Sign up', to: '/signup', current: pathname === '/signup' },
      ]
  const groups = [
    [
      { id: 'home', label: 'Home', to: '/', current: pathname === '/' },
      { id: 'hood', label: 'Neighborhood', to: '/adopt', current: onAdopt },
    ],
    rolePages(user).map(place),
    loading && !user ? [] : account,
    [{ id: 'restart', label: 'Restart PawShare OS', onSelect: replay }],
  ]

  return (
    <Taskbar
      start={<StartMenu groups={groups} header={user && `${user.name} · ${user.role}`} />}
      items={items.filter(Boolean)}
    />
  )
}

// A production build made without VITE_API_URL can't reach any API (sample-pet mode doesn't need one)
const API_MISSING = !API_CONFIGURED && import.meta.env.VITE_USE_MOCK !== 'true'

// "Skip to content" moves focus to the page without touching the URL hash (tabs and #list use it)
function skipToPage(e) {
  e.preventDefault()
  document.getElementById('page')?.focus()
}

// The layout route around every page: the page, then the shared taskbar; BOOT.EXE over both once per session.
export default function ShellLayout() {
  return (
    <BootProvider skip={API_MISSING}>
    <TaskCountsProvider>
      <a className="skip-link" href="#page" onClick={skipToPage}>Skip to content</a>
      <div className="shell">
        <div className="shell-page" id="page" tabIndex={-1}>
          {API_MISSING ? (
            <div className="shell-wait">
              <ErrorDialog message="API URL NOT CONFIGURED." onOk={() => window.location.reload()} />
            </div>
          ) : (
            // lazy pages (main.jsx) load here; the taskbar below stays put meanwhile
            <Suspense fallback={<div className="shell-wait"><LoadingWindow label="Opening the program" /></div>}>
              <Outlet />
            </Suspense>
          )}
        </div>
        <div className="desk shell-bar">
          <ShellTaskbar />
        </div>
      </div>
    </TaskCountsProvider>
    </BootProvider>
  )
}
