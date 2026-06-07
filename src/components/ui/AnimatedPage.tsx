import type { ReactNode } from 'react'

export function AnimatedPage({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`animate-fade-in-up ${className}`}>
      {children}
    </div>
  )
}

export function StaggerGrid({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}
