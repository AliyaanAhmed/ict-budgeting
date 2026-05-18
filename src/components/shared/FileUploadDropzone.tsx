import { useCallback, useRef, useState } from 'react'
import { X, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

interface FileUploadDropzoneProps {
  files: File[]
  onChange: (files: File[]) => void
  accept?: string
  maxSizeMB?: number
}

const RESTRICTED_FILE_EXTENSIONS = new Set([
  'ade',
  'adp',
  'apk',
  'app',
  'appx',
  'bat',
  'cab',
  'chm',
  'cmd',
  'com',
  'cpl',
  'dll',
  'exe',
  'gadget',
  'hta',
  'inf',
  'ins',
  'iso',
  'jar',
  'js',
  'jse',
  'lib',
  'lnk',
  'mde',
  'msc',
  'msi',
  'msp',
  'mst',
  'pif',
  'ps1',
  'ps1xml',
  'ps2',
  'ps2xml',
  'psc1',
  'psc2',
  'reg',
  'scr',
  'sh',
  'sys',
  'vb',
  'vbe',
  'vbs',
  'ws',
  'wsc',
  'wsf',
  'wsh',
])

const FILE_TYPE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pdf: { bg: '#FEE2E2', color: '#DC2626', label: 'PDF' },
  doc: { bg: '#DBEAFE', color: '#2563EB', label: 'DOC' },
  docx: { bg: '#DBEAFE', color: '#2563EB', label: 'DOC' },
  xls: { bg: '#DCFCE7', color: '#16A34A', label: 'XLS' },
  xlsx: { bg: '#DCFCE7', color: '#16A34A', label: 'XLS' },
  png: { bg: '#F3E8FF', color: '#9333EA', label: 'IMG' },
  jpg: { bg: '#F3E8FF', color: '#9333EA', label: 'IMG' },
  jpeg: { bg: '#F3E8FF', color: '#9333EA', label: 'IMG' },
  gif: { bg: '#F3E8FF', color: '#9333EA', label: 'IMG' },
  ppt: { bg: '#FFEDD5', color: '#EA580C', label: 'PPT' },
  pptx: { bg: '#FFEDD5', color: '#EA580C', label: 'PPT' },
  txt: { bg: '#F1F5F9', color: '#475569', label: 'TXT' },
  csv: { bg: '#DCFCE7', color: '#16A34A', label: 'CSV' },
}

function getFileTypeConfig(extension: string) {
  return (
    FILE_TYPE_CONFIG[extension.toLowerCase()] ?? {
      bg: '#F1F5F9',
      color: '#475569',
      label: extension.toUpperCase().slice(0, 3) || 'FILE',
    }
  )
}

function FileTypeIcon({ extension }: { extension: string }) {
  const config = getFileTypeConfig(extension)
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold tracking-wide"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.trim().toLowerCase() ?? ''
}

function getAcceptedExtensions(accept: string) {
  return new Set(
    accept
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.startsWith('.'))
      .map((token) => token.slice(1))
  )
}

export function FileUploadDropzone({
  files,
  onChange,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.ppt,.pptx,.txt,.csv',
  maxSizeMB = 20,
}: FileUploadDropzoneProps) {
  const { showErrorToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const dragCounter = useRef(0)
  const acceptedExtensions = getAcceptedExtensions(accept)

  const addFiles = useCallback(
    (incoming: File[]) => {
      const rejectedZeroKb: string[] = []
      const rejectedOversize: string[] = []
      const rejectedRestrictedType: string[] = []
      const rejectedUnsupportedType: string[] = []
      const valid = incoming.filter((f) => {
        const extension = getFileExtension(f.name)
        if (f.size <= 0) {
          rejectedZeroKb.push(f.name)
          return false
        }
        if (f.size > maxSizeMB * 1024 * 1024) {
          rejectedOversize.push(f.name)
          return false
        }
        if (!extension || RESTRICTED_FILE_EXTENSIONS.has(extension)) {
          rejectedRestrictedType.push(f.name)
          return false
        }
        if (acceptedExtensions.size > 0 && !acceptedExtensions.has(extension)) {
          rejectedUnsupportedType.push(f.name)
          return false
        }
        const already = files.some((existing) => existing.name === f.name && existing.size === f.size)
        return !already
      })
      if (rejectedZeroKb.length > 0) {
        showErrorToast(
          'Empty files are not allowed',
          `${rejectedZeroKb.join(', ')} ${rejectedZeroKb.length === 1 ? 'is' : 'are'} 0 KB and cannot be uploaded.`
        )
      }
      if (rejectedOversize.length > 0) {
        showErrorToast(
          'File size exceeded',
          `${rejectedOversize.join(', ')} ${rejectedOversize.length === 1 ? 'is' : 'are'} larger than ${maxSizeMB} MB and cannot be uploaded.`
        )
      }
      if (rejectedRestrictedType.length > 0) {
        showErrorToast(
          'Restricted file type',
          `${rejectedRestrictedType.join(', ')} ${rejectedRestrictedType.length === 1 ? 'is' : 'are'} not allowed for security reasons.`
        )
      }
      if (rejectedUnsupportedType.length > 0) {
        showErrorToast(
          'Unsupported file type',
          `${rejectedUnsupportedType.join(', ')} ${rejectedUnsupportedType.length === 1 ? 'is' : 'are'} not in the supported file types list.`
        )
      }
      if (valid.length > 0) onChange([...files, ...valid])
    },
    [acceptedExtensions, files, maxSizeMB, onChange, showErrorToast]
  )

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current += 1
    setDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current === 0) setDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload files — click or drag and drop"
        className={cn(
          'group relative cursor-pointer select-none rounded-xl border-2 border-dashed p-8 text-center outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2',
          dragging
            ? 'scale-[1.01] border-[#286CFF] bg-[#E7F5FF] dark:bg-[#1A2E4A]'
            : 'border-[#BFD8FF] bg-[#F8FBFF] hover:border-[#286CFF] hover:bg-[#EFF6FF] dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10'
        )}
      >
        <div
          className={cn(
            'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200',
            dragging
              ? 'border-[#286CFF] bg-[#286CFF] text-white'
              : 'border-[#BFD8FF] bg-[#EFF6FF] text-[#286CFF] group-hover:border-[#286CFF] group-hover:bg-[#286CFF] group-hover:text-white dark:border-white/20 dark:bg-white/10 dark:text-white'
          )}
        >
          <Upload
            className={cn('h-5 w-5 transition-transform duration-200', dragging ? '-translate-y-1' : 'group-hover:-translate-y-1')}
          />
        </div>

        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
          {dragging ? 'Release to upload' : 'Drop files here or click to browse'}
        </p>
        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
          PDF, DOCX, XLSX, PNG, JPG, PPT supported · Max {maxSizeMB} MB per file
        </p>

        {files.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#286CFF]/10 px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/20">
            <span>{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
            <span className="opacity-60">· click to add more</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const ext = file.name.split('.').pop() ?? ''
            return (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="group flex items-center gap-3 rounded-xl border border-[#DDEBFF] bg-white px-4 py-3 shadow-sm transition-all hover:border-[#B0DBFF] hover:shadow dark:border-white/10 dark:bg-[#1E293B]"
              >
                <FileTypeIcon extension={ext} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-slate-300">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
