import AntdProvider from '@/components/providers/antd-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {/* المزوّد متاح لكل الصفحات (الهبوط والدخول واللوحة) ليدعم مكوّنات Ant أينما استُعملت */}
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}