import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceGuard } from '@/components/providers/WorkspaceGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceGuard>
      <AppLayout>{children}</AppLayout>
    </WorkspaceGuard>
  )
}
