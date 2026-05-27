import { AdminSidebar } from '@/components/admin-sidebar';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminSidebar>{children}</AdminSidebar>;
}
