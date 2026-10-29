'use client';

import { ConfigProvider, theme } from 'antd';
import arEG from 'antd/locale/ar_EG';
import 'dayjs/locale/ar';
import dayjs from 'dayjs';

dayjs.locale('ar');

/**
 * مزود Ant Design موجّه للعربية (RTL) مع خط Cairo.
 * يلتف حول كل المحتوى الخادم عبر AntdProvider.
 */
export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      direction="rtl"
      locale={arEG}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          fontFamily: "'Cairo', 'Open Sans', sans-serif",
          colorPrimary: '#1d4ed8', // أزرق مؤسسي
          borderRadius: 6,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}