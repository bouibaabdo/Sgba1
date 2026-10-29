'use client';

import Link from 'next/link';
import { Button, Card, Col, Row, Typography } from 'antd';
import {
  CalculatorOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  FolderOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';

/**
 * صفحة الهبوط — صورة تعريفية أصلية (عربية RTL) تحاكي بنية صفحات الهبوط
 * لمكاتب المحاماة المغربية: مميزات، تفاصيل، أسعار، دعوة للتسجيل.
 * المحتوى أصلي 100% — لا ننسخ نصوص الموقع الأصلي.
 */
export default function LandingPage() {
  const features = [
    { icon: <FolderOutlined />, title: 'إدارة الملفات', desc: 'ملف رقمي كامل لكل قضية: المرجع، المحكمة، النوع، الحالة، وموقع الملف الورقي في الخزانة.' },
    { icon: <CalendarOutlined />, title: 'تقويم الجلسات', desc: 'جلساتك القادمة في تقويم واحد، مع تسجيل المقرر والخطوة الموالية لكل جلسة.' },
    { icon: <WalletOutlined />, title: 'تتبع الأتعاب', desc: 'متابعة الأقساط المدفوعة (Provisions) والمبالغ المستحقة المرتبطة بكل ملف.' },
    { icon: <TeamOutlined />, title: 'إدارة الأطراف', desc: 'الزبناء، الأطراف المقابلة، الزملاء المحامون والقضاة في سجل موحّد.' },
    { icon: <FileSearchOutlined />, title: 'بحث شامل', desc: 'ابحث عن أي ملف بمرجعه أو باسم الزبون أو برقم الخزانة فورًا.' },
    { icon: <CalculatorOutlined />, title: 'تقارير مالية', desc: 'تقارير إحصائية عن نتائج الجلسات وأداء المكتب لاتخاذ القرار.' },
  ];

  const plans = [
    { name: 'الأساسي', desc: 'لمكاتب الاستهلاك الخفيف', items: ['إدارة القضايا بسهولة', 'إدارة العملاء والمواعيد', 'تقارير مالية أساسية', 'دعم فني أساسي'] },
    { name: 'المتقدم', desc: 'للمكاتب الكبيرة ومتعددة المحامين', items: ['إدارة متقدمة للموارد البشرية', 'إدارة الشكاوى والقضايا المعقدة', 'دعم فني متميز', 'تخصيص التقارير'] },
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* الترويسة */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1d4ed8' }}>SGBA-ERP</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>نظام تدبير مكاتب المحاماة</div>
          </div>
          <Link href="/login">
            <Button type="primary" size="large">دخول</Button>
          </Link>
        </div>
      </header>

      {/* الواجهة */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <Typography.Title level={1} style={{ fontSize: 40, marginBottom: 16 }}>
          برنامج تدبير مكتب المحاماة
        </Typography.Title>
        <Typography.Paragraph style={{ fontSize: 18, maxWidth: 760, margin: '0 auto 32px', color: '#4b5563' }}>
          نظّم ملفات قضاياك، جلساتك، زبناءك وأتعابك في واجهة واحدة سهلة. ركّز على الدفاع والوكالة،
          واترك لنا تنظيم العمل الإداري للمكتب.
        </Typography.Paragraph>
        <Link href="/login">
          <Button type="primary" size="large" style={{ height: 48, padding: '0 32px' }}>
            ابدأ الآن — سجّل الدخول
          </Button>
        </Link>
      </section>

      {/* المميزات */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          ميزات تجعل إدارة المكتب أسهل
        </Typography.Title>
        <Row gutter={[16, 16]}>
          {features.map((f) => (
            <Col xs={24} sm={12} lg={8} key={f.title}>
              <Card>
                <div style={{ fontSize: 32, color: '#1d4ed8', marginBottom: 12 }}>{f.icon}</div>
                <Typography.Title level={5}>{f.title}</Typography.Title>
                <Typography.Paragraph type="secondary">{f.desc}</Typography.Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* الأسعار */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          باقات تناسب حجم مكتبك
        </Typography.Title>
        <Row gutter={[16, 16]}>
          {plans.map((p) => (
            <Col xs={24} md={12} key={p.name}>
              <Card style={{ textAlign: 'center' }}>
                <Typography.Title level={4}>{p.name}</Typography.Title>
                <Typography.Paragraph type="secondary">{p.desc}</Typography.Paragraph>
                <ul style={{ listStyle: 'none', padding: 0, textAlign: 'right' }}>
                  {p.items.map((i) => (
                    <li key={i} style={{ padding: '6px 0' }}>✓ {i}</li>
                  ))}
                </ul>
                <Button type={p.name === 'المتقدم' ? 'primary' : 'default'} block>
                  تواصل للحصول على السعر
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* التذييل */}
      <footer style={{ background: '#1f2937', color: '#fff', marginTop: 32 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', textAlign: 'center' }}>
          © {new Date().getFullYear()} SGBA-ERP — نظام أصلي لإدارة مكاتب المحاماة
        </div>
      </footer>
    </div>
  );
}