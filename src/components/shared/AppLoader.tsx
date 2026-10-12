import { cn } from '@/lib/utils'
import { createPortal } from 'react-dom'

interface AppLoaderProps {
  open: boolean
  message?: string
  fullscreen?: boolean
  className?: string
}

const DOT_COLORS = ['#286CFF', '#4F98FF', '#81C1FF', '#0B32A4', '#B0DBFF', '#286CFF']

export function AppLoader({
  open,
  message = 'Processing request...',
  fullscreen = true,
  className,
}: AppLoaderProps) {
  if (!open) return null

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="app-loader-wheel relative h-16 w-16">
        {DOT_COLORS.map((color, index) => {
          const angle = index * 60
          return (
            <span
              key={`${color}-${index}`}
              className="app-loader-dot absolute left-1/2 top-1/2 h-3.5 w-3.5 rounded-full"
              style={{
                backgroundColor: color,
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(24px)`,
                animationDelay: `${index * 0.1}s`,
              }}
            />
          )
        })}
      </div>
      <p className="text-sm font-medium text-[#0F172A] dark:text-white">{message}</p>
    </div>
  )

  if (!fullscreen) return content

  const overlay = (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/75 backdrop-blur-sm dark:bg-[#0F172A]/70">
      {content}
    </div>
  )

  return createPortal(overlay, document.body)
}
