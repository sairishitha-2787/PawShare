import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import PetForm from '../components/shelter/PetForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { useCheckInsTask } from '../context/CheckInsContext.jsx'
import { messagesTaskLabel } from '../utils/messages.js'
import { createAnimal, getAnimalRecord, updateAnimal } from '../api/animals.js'
import { editTitle, emptyForm, formFromAnimal } from '../utils/listing.js'
import { firstName } from '../utils/auth.js'
import { profileTask } from '../utils/shelters.js'
import './PetEditorPage.css'

// The listing being edited, straight from the API. status: 'loading' | 'ready' | 'error' (error: the Error)
function useAnimalRecord(id) {
  const [load, setLoad] = useState({ status: 'loading' })
  useEffect(() => {
    const ctrl = new AbortController()
    getAnimalRecord(id, { signal: ctrl.signal })
      .then((animal) => setLoad({ status: 'ready', animal }))
      .catch((err) => {
        if (err.name !== 'AbortError') setLoad({ status: 'error', error: err })
      })
    return () => ctrl.abort()
  }, [id])
  return load
}

function Shell({ title, children }) {
  const { user, logout } = useAuth()
  const { count: unread } = useUnread()
  const navigate = useNavigate()
  const checkInsTask = useCheckInsTask(navigate)
  return (
    <div className="desk editor-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>
      <Window title={title} className="editor" aria-label={title}>
        {children}
      </Window>
      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt'), hideOnSmall: true },
          { id: 'mypets', label: 'My pets', onClick: () => navigate('/shelter/animals') },
          profileTask(user, navigate),
          checkInsTask,
          { id: 'msgs', label: messagesTaskLabel(unread), onClick: () => navigate('/messages') },
          { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
          { id: 'logout', label: 'Log out', onClick: logout },
        ]}
      />
    </div>
  )
}

const backToList = (navigate, name) => navigate('/shelter/animals', { state: { saved: name } })

function AddPet() {
  const { user } = useAuth()
  const navigate = useNavigate()
  // new listings go where the shelter is (its city, and its map point if it has one)
  const [initial] = useState(() => emptyForm(user.location?.city || ''))

  // POST needs a verified shelter: MY_PETS/ explains why the button is off
  if (user.role === 'shelter' && !user.isVerified) return <Navigate to="/shelter/animals" replace />

  return (
    <Shell title="ADD_PET.EXE">
      <PetForm
        initial={initial}
        location={user.location}
        onSave={async (body) => {
          await createAnimal(body)
          backToList(navigate, body.name)
        }}
        onCancel={() => navigate('/shelter/animals')}
      />
    </Shell>
  )
}

function EditPet({ id }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const load = useAnimalRecord(id)
  const back = () => navigate('/shelter/animals')

  if (load.status !== 'ready') {
    const message = load.error?.status === 404 ? "WE COULDN'T FIND THAT PET." : "COULDN'T LOAD THAT PET."
    return (
      <Shell title="EDIT.EXE">
        <div className="editor-wait">
          {load.status === 'loading' && <LoadingWindow label="Opening the listing" />}
          {load.status === 'error' && <ErrorDialog message={message} onOk={back} />}
        </div>
      </Shell>
    )
  }

  const { animal } = load
  const ownerId = animal.owner?._id || animal.owner
  if (ownerId !== user.id && user.role !== 'admin') {
    return (
      <Shell title="EDIT.EXE">
        <div className="editor-wait">
          <ErrorDialog message="YOU CAN ONLY EDIT YOUR OWN LISTINGS." onOk={back} />
        </div>
      </Shell>
    )
  }

  return (
    <Shell title={editTitle(animal.name)}>
      <PetForm
        initial={formFromAnimal(animal)}
        location={animal.location}
        animalId={animal._id}
        status={animal.status}
        onSave={async (body) => {
          await updateAnimal(animal._id, body)
          backToList(navigate, body.name)
        }}
        onCancel={back}
      />
    </Shell>
  )
}

// /shelter/animals/new and /shelter/animals/:id/edit (behind RequireAuth), shelters and admins.
export default function PetEditorPage() {
  const { user } = useAuth()
  const { id } = useParams()
  if (user.role === 'adopter') return <Navigate to="/adopt" replace />
  // key: a different pet's edit link starts a fresh form
  return id ? <EditPet key={id} id={id} /> : <AddPet />
}
