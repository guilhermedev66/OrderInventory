import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <div className="hidden lg:block"><Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} /></div>
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="relative z-10 h-full animate-[drawer-in_200ms_cubic-bezier(0.23,1,0.32,1)]"><Sidebar onNavigate={() => setMobileNavOpen(false)} /></div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} onSidebarToggle={() => setSidebarCollapsed((value) => !value)} />
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  )
}
