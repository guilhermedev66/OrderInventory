import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { loginSchema, type LoginFormValues } from '@/auth/schemas'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { ApiError } from '@/lib/apiError'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)
    try {
      await login(values.email, values.password)
      const from = (location.state as { from?: Location })?.from
      navigate(from ? `${from.pathname}${from.search ?? ''}` : '/', { replace: true })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
    }
  }

  return (
    <AuthLayout
      title="Acesse sua operação"
      description="Entre para acompanhar pedidos, produtos e estoque."
      footer={<>Não tem conta?{' '}<Link to="/register" className="font-semibold text-accent-subtle-text hover:text-accent">Criar conta</Link></>}
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
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            {formError ? (
              <p className="rounded-sm bg-danger-subtle px-3 py-2 text-[13px] text-danger-subtle-text" role="alert">
                {formError}
              </p>
            ) : null}

            <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
              Entrar
            </Button>
          </form>
    </AuthLayout>
  )
}
