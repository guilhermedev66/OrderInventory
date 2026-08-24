import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createUser } from '@/api/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Panel'
import { createUserSchema, type CreateUserFormValues } from '@/features/admin/schemas'
import { ApiError } from '@/lib/apiError'
import { ROLE_LABEL } from '@/lib/labels'
import type { CreateUserResponse } from '@/types/api'

export function AdminUsersPage() {
  const [created, setCreated] = useState<CreateUserResponse[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'User' },
  })

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      setCreated((prev) => [user, ...prev])
      reset({ email: '', password: '', role: 'User' })
      setFormError(null)
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : 'Erro ao criar usuário.')
    },
  })

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Criação administrativa de contas com perfil definido. Não há listagem de usuários existentes na API."
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="text-[13px] font-semibold text-text-primary">Nova conta</h2>
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            noValidate
          >
            <TextField
              label="E-mail"
              type="email"
              autoComplete="off"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Senha"
              type="password"
              autoComplete="new-password"
              required
              hint="Mínimo 12 caracteres, com maiúscula, minúscula, número e símbolo."
              error={errors.password?.message}
              {...register('password')}
            />
            <SelectField label="Perfil" required error={errors.role?.message} {...register('role')}>
              <option value="User">Usuário</option>
              <option value="Manager">Gerente</option>
              <option value="Admin">Administrador</option>
            </SelectField>

            {formError ? (
              <p className="rounded-sm bg-danger-subtle px-3 py-2 text-[13px] text-danger-subtle-text" role="alert">
                {formError}
              </p>
            ) : null}

            <Button type="submit" variant="primary" loading={isSubmitting || mutation.isPending}>
              Criar conta
            </Button>
          </form>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-[13px] font-semibold text-text-primary">Criadas nesta sessão</h2>
          {created.length === 0 ? (
            <p className="mt-3 text-[13px] text-text-tertiary">Nenhuma conta criada ainda.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {created.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between rounded-sm border border-border px-3 py-2 text-[13px]"
                >
                  <span className="text-text-primary">{user.email}</span>
                  <Badge tone="info">{ROLE_LABEL[user.role] ?? user.role}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
