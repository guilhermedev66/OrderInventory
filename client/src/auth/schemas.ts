import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

// Mirrors ASP.NET Core Identity's configured password policy (Program.cs):
// min length 12, requires digit, lowercase, uppercase, and non-alphanumeric char.
export const registerSchema = z
  .object({
    email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
    password: z
      .string()
      .min(12, 'A senha deve ter ao menos 12 caracteres')
      .regex(/[a-z]/, 'A senha deve conter ao menos uma letra minúscula')
      .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula')
      .regex(/[0-9]/, 'A senha deve conter ao menos um número')
      .regex(/[^a-zA-Z0-9]/, 'A senha deve conter ao menos um caractere especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
export type RegisterFormValues = z.infer<typeof registerSchema>
