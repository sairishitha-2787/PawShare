import './Button.css'

export default function Button({ variant = 'default', type = 'button', className = '', ...props }) {
  const cls = ['btn', variant === 'primary' && 'primary', className].filter(Boolean).join(' ')
  return <button type={type} className={cls} {...props} />
}
