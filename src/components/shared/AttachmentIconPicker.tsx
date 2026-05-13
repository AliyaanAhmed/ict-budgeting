import { useCallback, useRef } from 'react'
import { Paperclip, X } from 'lucide-react'

interface AttachmentIconPickerProps {
  files: File[]
  onChange: (files: File[]) => void
  accept?: string
  maxSizeMB?: number
}

export function AttachmentIconPicker({
  files,
  onChange,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.ppt,.pptx,.txt,.csv',
  maxSizeMB = 20,
}: AttachmentIconPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(
    (incoming: File[]) => {
      const valid = incoming.filter((file) => {
        if (file.size > maxSizeMB * 1024 * 1024) return false
        return !files.some((existing) => existing.name === file.name && existing.size === file.size)
      })

      if (valid.length > 0) onChange([...files, ...valid])
    },
    [files, maxSizeMB, onChange],
  )

  const removeFile = (index: number) => {
    onChange(files.filter((_, fileIndex) => fileIndex !== index))
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(Array.from(event.target.files))
      event.target.value = ''
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#BFD8FF] bg-[#F8FBFF] px-3 text-xs font-semibold text-[#286CFF] shadow-sm transition-all hover:border-[#286CFF] hover:bg-[#E7F5FF] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF]/30 dark:border-white/10 dark:bg-white/5 dark:text-[#4F98FF] dark:hover:bg-white/10"
        title="Attach files"
        aria-label="Attach files"
      >
        <Paperclip className="h-3.5 w-3.5" />
        Attach
      </button>

      {files.length > 0 && (
        <span className="shrink-0 rounded-full bg-[#286CFF]/10 px-2 py-0.5 text-[10px] font-bold text-[#286CFF] dark:bg-[#286CFF]/20">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </span>
      )}

      {files.map((file, index) => {
        const ext = file.name.split('.').pop() || 'file'

        return (
          <span
            key={`${file.name}-${file.size}-${index}`}
            className="inline-flex max-w-[180px] items-center gap-1.5 rounded-full border border-[#DDEBFF] bg-white px-2 py-1 text-[11px] font-semibold text-[#475569] shadow-sm dark:border-white/10 dark:bg-[#1E293B] dark:text-slate-200"
            title={file.name}
          >
            <span className="shrink-0 rounded bg-[#E7F5FF] px-1.5 py-0.5 text-[9px] font-bold text-[#286CFF]">
              {ext.slice(0, 4).toUpperCase()}
            </span>
            <span className="truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              aria-label={`Remove ${file.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )
      })}
    </div>
  )
}
