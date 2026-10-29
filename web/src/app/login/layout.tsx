import AntdProvider from '@/components/providers/antd-provider';
import { AuthProvider } from '@/components/providers/auth-provider';

/**
 * قالب صفحة الدخول (مسار عام) — يلفّها بالمزوّدين فقط بلا حماية (ProtectedRoute)
 * لأنها الشاشة المفتوحة لغير المسجّلين.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <AntdProvider>
      <AuthProvider>{children}</AuthProvider>
    </AntdProvider>
  );
}