import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link2, Plus, Truck } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listSuppliers, setSupplierStatus } from '@/api/suppliers'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Pagination } from '@/components/ui/Pagination'
import { Panel } from '@/components/ui/Panel'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/States'
import { Table, TableScroll, Th, Thead } from '@/components/ui/Table'
import { useToast } from '@/components/ui/useToast'
import { CreateSupplierDialog } from '@/features/suppliers/CreateSupplierDialog'
import { LinkProductDialog } from '@/features/suppliers/LinkProductDialog'
import { ApiError } from '@/lib/apiError'
import { formatDate } from '@/lib/format'
import type { Supplier } from '@/types/api'

const PAGE_SIZE = 20

export function SuppliersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const includeInactive = searchParams.get('includeInactive') === 'true'
  const page = Number(searchParams.get('page') ?? '1')
  const [createOpen, setCreateOpen] = useState(false)
  const [linkingSupplier, setLinkingSupplier] = useState<Supplier | null>(null)
  const queryClient = useQueryClient()
  const { push } = useToast()

  const query = useQuery({
    queryKey: ['suppliers', { includeInactive, page }],
    queryFn: () => listSuppliers({ includeInactive, page, pageSize: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setSupplierStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      push('Status do fornecedor atualizado.', 'success')
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Erro ao alterar status.', 'danger'),
  })

  function updateParams(next: Record<string, string | boolean | number | undefined>) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === '' || value === false) params.delete(key)
      else params.set(key, String(value))
    }
    if (!('page' in next)) params.delete('page')
    setSearchParams(params)
  }

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description="Cadastro de fornecedores e vínculo com produtos."
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Novo fornecedor
          </Button>
        }
      />

      <div className="flex items-center gap-3 px-6 pt-4">
        <Checkbox
          label="Incluir inativos"
          checked={includeInactive}
          onChange={(e) => updateParams({ includeInactive: e.target.checked })}
        />
      </div>

      <div className="p-6">
        <Panel>
          {query.isLoading ? (
            <LoadingRows rows={6} columns={4} />
          ) : query.isError ? (
            <ErrorState
              message={query.error instanceof ApiError ? query.error.message : 'Erro ao carregar fornecedores.'}
              onRetry={() => query.refetch()}
            />
          ) : !query.data || query.data.items.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Nenhum fornecedor cadastrado"
              description="Cadastre o primeiro fornecedor para vincular a produtos e registrar recebimentos."
              action={
                <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="size-3.5" />
                  Novo fornecedor
                </Button>
              }
            />
          ) : (
            <>
              <TableScroll>
              <Table minWidth={780}>
                <Thead>
                  <Th>Nome</Th>
                  <Th>Contato</Th>
                  <Th>Status</Th>
                  <Th>Desde</Th>
                  <Th />
                </Thead>
                <tbody className="divide-y divide-border">
                  {query.data.items.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-surface-hover">
                      <td className="px-4 py-2.5 font-medium text-text-primary">{supplier.name}</td>
                      <td className="px-4 py-2.5 text-text-tertiary">{supplier.contactEmail ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={supplier.isActive ? 'success' : 'neutral'}>
                          {supplier.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-text-tertiary">{formatDate(supplier.createdAtUtc)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => setLinkingSupplier(supplier)}>
                            <Link2 className="size-3.5" />
                            Vincular produto
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              statusMutation.mutate({ id: supplier.id, active: !supplier.isActive })
                            }
                          >
                            {supplier.isActive ? 'Inativar' : 'Ativar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              </TableScroll>
              <Pagination
                page={query.data.page}
                pageSize={query.data.pageSize}
                totalCount={query.data.totalCount}
                onPageChange={(p) => updateParams({ page: p })}
              />
            </>
          )}
        </Panel>
      </div>

      <CreateSupplierDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <LinkProductDialog open={!!linkingSupplier} supplier={linkingSupplier} onClose={() => setLinkingSupplier(null)} />
    </div>
  )
}
