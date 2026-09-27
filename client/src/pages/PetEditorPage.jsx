import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import PetForm from '../components/shelter/PetForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { createAnimal, getAnimalRecord, updateAnimal } from '../api/animals.js'
import { editTitle, emptyForm, formFromAnimal } from '../utils/listing.js'
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
  return (
    <div className="desk editor-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>
      <Window title={title} className="editor" aria-label={title}>
        {children}
      </Window>
    </div>
  )
}

// An admin who opened the editor from CONTROL_PANEL.EXE › Listings goes back there; everyone else to MY_PETS/.
const listPath = (fromAdmin) => (fromAdmin ? '/admin/listings' : '/shelter/animals')
const backToList = (navigate, name, fromAdmin = false) => navigate(listPath(fromAdmin), { state: { saved: name } })

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
  const location = useLocation()
  const load = useAnimalRecord(id)
  const fromAdmin = user.role === 'admin' && location.state?.from === 'admin'
  const back = () => navigate(listPath(fromAdmin))

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
          backToList(navigate, body.name, fromAdmin)
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
