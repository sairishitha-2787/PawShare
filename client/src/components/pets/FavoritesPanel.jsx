import Window from '../ui/Window.jsx'
import { useFavorites } from '../../context/FavoritesContext.jsx'
import './FavoritesPanel.css'

// FAVORITES/ window: saved pets as pill buttons that open the profile. Port of renderFavs().
export default function FavoritesPanel({ pets, onOpen }) {
  const { favs } = useFavorites()
  const saved = pets.filter((p) => favs.has(p.id))

  return (
    <Window title="FAVORITES/" barColor="pink" as="div">
      <div className="favs">
        {saved.length ? (
          <>
            <span>{saved.length} saved</span>
            <ul>
              {saved.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => onOpen?.(p.id)}>{p.name}</button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Folder is empty. Tap the heart on a profile to save a pet here.</p>
        )}
      </div>
    </Window>
  )
}
