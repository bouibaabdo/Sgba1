'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Form, Input, Typography, App as AntApp } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '@/components/providers/auth-provider';

/**
 * شاشة تسجيل الدخول — المسار العام الوحيد داخل التطبيق.
 * بعد نجاح الدخول نوجّه إلى اللوحة، وتُبنى القوائم من صلاحيات الدور.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { message } = AntApp.useApp();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setError(null);
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('مرحبًا بك');
      router.replace('/');
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(detail ?? 'تعذّر تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>SGBA-ERP</Typography.Title>
          <Typography.Text type="secondary">نظام تدبير مكاتب المحاماة</Typography.Text>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} initialValues={{ email: '', password: '' }}>
          <Form.Item name="email" label="البريد الإلكتروني" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<UserOutlined />} placeholder="admin@cabinet.ma" size="large" />
          </Form.Item>
          <Form.Item name="password" label="كلمة السر" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            دخول
          </Button>
        </Form>
      </Card>
    </div>
  );
}