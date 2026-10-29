'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, Layout, Menu, Tag, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  BankOutlined,
  CalendarOutlined,
  ContactsOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FolderOutlined,
  LogoutOutlined,
  MoneyCollectOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/providers/auth-provider';

const { Sider, Header, Content } = Layout;

const ROLE_TAG: Record<string, { color: string; label: string }> = {
  LEAD_LAWYER: { color: 'gold', label: 'بارِع' },
  ASSOCIATE: { color: 'blue', label: 'مساعد' },
  TRAINEE: { color: 'default', label: 'تلميذ' },
  SECRETARY: { color: 'cyan', label: 'كاتب' },
  ACCOUNTANT: { color: 'green', label: 'محاسب' },
};

/**
 * الهيكل الحامي: قائمة جانبية بوحدات النظام. كل وحدة تُعرض وفق الصلاحيات
 * (مصدرها الواجهة من /auth/me). المرحلة 2 تملأ شاشات الوحدات نفسها.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, permissions, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const items = useMemo<MenuProps['items']>(() => {
    const can = (res: string) => permissions.some((p) => p.resource === res);
    const list: NonNullable<MenuProps['items']> = [];

    if (can('CASES') || can('HEARINGS') || can('TASKS')) {
      list.push({
        key: 'g-main',
        type: 'group',
        label: 'القضايا',
        children: [
          ...(can('CASES')
            ? [
                {
                  key: '/cases',
                  icon: <FolderOutlined />,
                  label: <Link href="/cases">الملفات</Link>,
                },
              ]
            : []),
          ...(can('HEARINGS')
            ? [
                {
                  key: '/hearings',
                  icon: <CalendarOutlined />,
                  label: <Link href="/hearings">الجلسات</Link>,
                },
              ]
            : []),
          ...(can('TASKS')
            ? [
                {
                  key: '/tasks',
                  icon: <FileDoneOutlined />,
                  label: <Link href="/tasks">المهام</Link>,
                },
              ]
            : []),
        ],
      });
    }

    if (can('CLIENTS') || can('CONTACTS')) {
      list.push({
        key: 'g-relations',
        type: 'group',
        label: 'الأطراف',
        children: [
          ...(can('CLIENTS')
            ? [
                {
                  key: '/clients',
                  icon: <TeamOutlined />,
                  label: <Link href="/clients">الزبناء</Link>,
                },
              ]
            : []),
          ...(can('CONTACTS')
            ? [
                {
                  key: '/contacts',
                  icon: <ContactsOutlined />,
                  label: <Link href="/contacts">المتراسلون</Link>,
                },
              ]
            : []),
        ],
      });
    }

    if (can('FINANCE')) {
      list.push({
        key: '/finance',
        icon: <MoneyCollectOutlined />,
        label: <Link href="/finance">المالية</Link>,
      });
    }

    if (can('REPORTS')) {
      list.push({
        key: '/reports',
        icon: <DashboardOutlined />,
        label: <Link href="/reports">التقارير</Link>,
      });
    }

    if (can('SETTINGS') || can('USERS')) {
      list.push({
        key: 'g-system',
        type: 'group',
        label: 'النظام',
        children: [
          ...(can('USERS')
            ? [
                {
                  key: '/users',
                  icon: <BankOutlined />,
                  label: <Link href="/users">المستخدمون</Link>,
                },
              ]
            : []),
          ...(can('SETTINGS')
            ? [
                {
                  key: '/settings',
                  icon: <SettingOutlined />,
                  label: <Link href="/settings">الإعدادات</Link>,
                },
              ]
            : []),
        ],
      });
    }

    return list;
  }, [permissions]);

  const role = user ? ROLE_TAG[user.roleCode] : undefined;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" width={230}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
          SGBA
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={['g-main', 'g-relations', 'g-system']}
          items={items}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {role && <Tag color={role.color}>{role.label}</Tag>}
            <span>{user?.fullName}</span>
            <Avatar style={{ background: '#1d4ed8' }}>{user?.fullName?.charAt(0)}</Avatar>
            <LogoutOutlined onClick={() => logout()} style={{ cursor: 'pointer' }} />
          </div>
        </Header>
        <Content style={{ margin: 16 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}