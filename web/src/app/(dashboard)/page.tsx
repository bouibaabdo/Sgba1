'use client';

import { Card, Col, Row, Statistic, Typography } from 'antd';
import { FolderOpenOutlined, ScheduleOutlined, CheckCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { useAuth } from '@/components/providers/auth-provider';

/**
 * لوحة القيادة — المرحلة 2/1: نموذج أولي يعرض مؤشرات المكتب.
 * عند توفّر لقطات الشاشة الأصلية نضبط الأرقام والبطاقات والتخطيط بالضبط.
 */
export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  return (
    <div>
      <Typography.Title level={3}>مرحبًا، {user?.fullName}</Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="الملفات الجارية" value={34} prefix={<FolderOpenOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="جلسات هذا الأسبوع" value={12} prefix={<ScheduleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="مهام قيد الإنجاز" value={8} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        {hasPermission('FINANCE', 'READ') && (
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="مستحقات (Provisions)" value={46_500} precision={0} suffix="د.م" prefix={<WalletOutlined />} />
            </Card>
          </Col>
        )}
      </Row>

      <Card style={{ marginTop: 16 }} title="القضايا حسب الحالة" loading={false}>
        <Typography.Paragraph type="secondary">
          هنا سيُعرض رسم بياني / جدول بتوزيع الملفات حسب الحالة (مفتوح، قيد المتابعة، مداولة، مغلق، مؤرشف)
          عند توفر بيانات من API الملفات في المرحلة التالية.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
