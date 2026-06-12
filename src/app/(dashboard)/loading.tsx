import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full blur-xl bg-indigo-500/20 animate-pulse" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Chargement de la page...
        </p>
      </div>
    </div>
  )
}
