export function aiFlagTone(severity?: string) {
  const normalized = severity?.trim().toLowerCase()
  if (normalized === 'high') {
    return 'border-[#F5C2C7] bg-[#FFF1F3] text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118] dark:text-[#FCA5A5]'
  }
  if (normalized === 'medium') {
    return 'border-[#E2E8F0] bg-white text-[#92400E] dark:border-white/10 dark:bg-white/5 dark:text-[#F6D28A]'
  }
  return 'border-[#E2E8F0] bg-white text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-[#CBD5E1]'
}
