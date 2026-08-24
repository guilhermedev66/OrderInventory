import { FileQuestion } from 'lucide-react'
import { LinkButton } from '@/components/ui/LinkButton'

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <FileQuestion className="size-8 text-text-muted" aria-hidden="true" />
      <h1 className="text-[17px] font-semibold text-text-primary">Página não encontrada</h1>
      <p className="max-w-sm text-[13px] text-text-tertiary">
        O endereço acessado não existe ou foi movido.
      </p>
      <LinkButton to="/" variant="secondary" size="sm">
        Voltar ao painel
      </LinkButton>
    </div>
  )
}
