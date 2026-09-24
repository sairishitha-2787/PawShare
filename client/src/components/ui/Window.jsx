import './Window.css'

// dots: true shows the usual three; a number shows that many (the ERROR window has one).
export default function Window({
  title,
  barColor = 'lav',
  dots = true,
  onClose,
  closeLabel = 'Close',
  as: Tag = 'section',
  className = '',
  children,
  ...rest
}) {
  const dotCount = dots === true ? 3 : dots || 0
  return (
    <Tag className={`win ${className}`.trim()} {...rest}>
      <div className={barColor === 'lav' ? 'bar' : `bar ${barColor}`}>
        <span>{title}</span>
        {onClose ? (
          <button type="button" className="xbtn" onClick={onClose} aria-label={closeLabel} data-autofocus>
            X
          </button>
        ) : dotCount > 0 && (
          <span className="dots" aria-hidden="true">
            {Array.from({ length: dotCount }, (_, i) => <i key={i} />)}
          </span>
        )}
      </div>
      {children}
    </Tag>
  )
}
