import AntdProvider from '@/components/providers/antd-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import AppShell from '@/components/layout/app-shell';
import ProtectedRoute from '@/components/layout/protected-route';

/**
 * قالب منطقة العمل المحمية:
 * مزوّدات RTL + سياق المصادقة ← فحص الحماية ← الهيكل (قائمة جانبية + ترويسة).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AntdProvider>
      <AuthProvider>
        <ProtectedRoute>
          <AppShell>{children}</AppShell>
        </ProtectedRoute>
      </AuthProvider>
    </AntdProvider>
  );
}