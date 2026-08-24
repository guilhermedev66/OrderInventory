import { z } from 'zod'

// Mirrors ASP.NET Core Identity's configured password policy (Program.cs),
// same as public registration.
export const createUserSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z
    .string()
    .min(12, 'A senha deve ter ao menos 12 caracteres')
    .regex(/[a-z]/, 'A senha deve conter ao menos uma letra minúscula')
    .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'A senha deve conter ao menos um número')
    .regex(/[^a-zA-Z0-9]/, 'A senha deve conter ao menos um caractere especial'),
  role: z.enum(['User', 'Manager', 'Admin']),
})
export type CreateUserFormValues = z.infer<typeof createUserSchema>
