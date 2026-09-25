import { useId } from 'react'
import { INK } from '../../utils/pets.js'

function Eyes() {
  return (
    <>
      <circle cx="24" cy="34" r="2.4" fill={INK} />
      <circle cx="36" cy="34" r="2.4" fill={INK} />
      <ellipse cx="19.5" cy="39.5" rx="3" ry="1.8" fill="#FF9EBB" opacity=".75" />
      <ellipse cx="40.5" cy="39.5" rx="3" ry="1.8" fill="#FF9EBB" opacity=".75" />
    </>
  )
}

function Features({ species, fur: f, dark: d }) {
  if (species === 'dog') {
    return (
      <>
        <ellipse cx="16" cy="33" rx="7" ry="12" fill={d} transform="rotate(18 16 33)" />
        <ellipse cx="44" cy="33" rx="7" ry="12" fill={d} transform="rotate(-18 44 33)" />
        <circle cx="30" cy="35" r="15" fill={f} />
        <ellipse cx="30" cy="41" rx="7.5" ry="5.5" fill="#FFF6EA" />
        <Eyes />
        <ellipse cx="30" cy="38.5" rx="3" ry="2.2" fill={INK} />
        <path d="M27 42.5q3 2.4 6 0" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </>
    )
  }
  if (species === 'cat') {
    return (
      <>
        <polygon points="15,30 18,11 29,22" fill={d} />
        <polygon points="45,30 42,11 31,22" fill={d} />
        <polygon points="18,25 19.5,16 24.5,21" fill="#FFB8CB" />
        <polygon points="42,25 40.5,16 35.5,21" fill="#FFB8CB" />
        <circle cx="30" cy="35" r="15" fill={f} />
        <Eyes />
        <path d="M28.5 38.5h3l-1.5 1.8z" fill="#E9668E" />
        <path d="M12 38h8M12 42h8M40 38h8M40 42h8" stroke={INK} strokeWidth=".9" opacity=".6" />
      </>
    )
  }
  if (species === 'bunny') {
    return (
      <>
        <ellipse cx="23" cy="15" rx="5.5" ry="13" fill={f} stroke={d} strokeWidth="1" />
        <ellipse cx="37" cy="15" rx="5.5" ry="13" fill={f} stroke={d} strokeWidth="1" />
        <ellipse cx="23" cy="16" rx="2.4" ry="9" fill="#FFB8CB" />
        <ellipse cx="37" cy="16" rx="2.4" ry="9" fill="#FFB8CB" />
        <circle cx="30" cy="37" r="14" fill={f} stroke={d} strokeWidth="1" />
        <Eyes />
        <path d="M28.5 39h3l-1.5 1.6z" fill="#E9668E" />
      </>
    )
  }
  if (species === 'bird') {
    return (
      <>
        <ellipse cx="27" cy="14" rx="3" ry="9" fill={d} transform="rotate(-20 27 14)" />
        <ellipse cx="33" cy="13" rx="3" ry="10" fill={d} transform="rotate(12 33 13)" />
        <circle cx="30" cy="35" r="15" fill={f} />
        <Eyes />
        <path d="M26.5 37.5h7l-3.5 6z" fill="#F4A340" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
      </>
    )
  }
  // guinea (hamsters use the guinea face for now)
  return (
    <>
      <circle cx="15" cy="27" r="4.5" fill={d} />
      <circle cx="45" cy="27" r="4.5" fill={d} />
      <ellipse cx="30" cy="37" rx="18" ry="14.5" fill={f} />
      <ellipse cx="22" cy="32" rx="7.5" ry="9" fill={d} opacity=".85" />
      <Eyes />
      <path d="M28.5 39.5h3l-1.5 1.6z" fill="#E9668E" />
    </>
  )
}

// 60×60 face clipped to a circle. Extra props (x, y, className…) go on the <svg>,
// so it also works nested inside another svg (see Pin).
export default function PetFace({ pet, size = 60, ...rest }) {
  const clipId = `face-${useId().replace(/:/g, '')}`
  const { fur, dark, bg } = pet.colors
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true" {...rest}>
      <defs>
        <clipPath id={clipId}><circle cx="30" cy="30" r="29" /></clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="60" height="60" fill={bg} />
        {pet.photoUrl
          ? <image href={pet.photoUrl} width="60" height="60" preserveAspectRatio="xMidYMid slice" />
          : <Features species={pet.species} fur={fur} dark={dark} />}
      </g>
    </svg>
  )
}
