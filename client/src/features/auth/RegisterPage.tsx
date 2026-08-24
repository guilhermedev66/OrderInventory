import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { registerSchema, type RegisterFormValues } from '@/auth/schemas'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { ApiError } from '@/lib/apiError'

export function RegisterPage() {
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null)
    try {
      await registerAccount(values.email, values.password)
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível criar a conta.')
    }
  }

  return (
    <AuthLayout
      title="Crie sua conta"
      description="Novas contas iniciam com perfil de usuário padrão."
      footer={<>Já tem conta?{' '}<Link to="/login" className="font-semibold text-accent-subtle-text hover:text-accent">Entrar</Link></>}
    >
          <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              label="E-mail"
              type="email"
              autoComplete="email"
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
            <TextField
              label="Confirmar senha"
              type="password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {formError ? (
              <p className="rounded-sm bg-danger-subtle px-3 py-2 text-[13px] text-danger-subtle-text" role="alert">
                {formError}
              </p>
            ) : null}

            <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
              Criar conta
            </Button>
          </form>
    </AuthLayout>
  )
}
