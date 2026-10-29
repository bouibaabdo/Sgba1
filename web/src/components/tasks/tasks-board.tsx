'use client';

import { Avatar, List, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

interface Task {
  id: number;
  title: string;
  caseRef: string;
  assignee: string;
  due: string;
  done: boolean;
}

const MOCK: Task[] = [
  { id: 1, title: 'إعداد مذكرة دفاع', caseRef: '2026/014', assignee: 'فاطمة الزهراء', due: '2026-11-02', done: false },
  { id: 2, title: 'معاينة ملف ورقي من الأرشيف', caseRef: '2026/011', assignee: 'سعيد الكاتب', due: '2026-10-31', done: false },
  { id: 3, title: 'مراسلة الطرف المقابل', caseRef: '2026/009', assignee: 'أحمد العلوي', due: '2026-10-30', done: true },
];

/**
 * لوحة المهام — تُظهر الإسناد والتأجيل والحالة.
 * منطق الإسناد/الإتمام الخلفي الكامل في المرحلة 4 (محرك سير العمل).
 */
export function TasksBoard() {
  return (
    <List<Task>
      header={<Typography.Title level={4} style={{ margin: 0 }}>المهام</Typography.Title>}
      dataSource={MOCK}
      renderItem={(t) => (
        <List.Item
          actions={[
            t.done ? <Tag color="success" icon={<CheckCircleOutlined />}>منجز</Tag> : <Tag color="warning" icon={<ClockCircleOutlined />}>قيد الإنجاز</Tag>,
          ]}
        >
          <List.Item.Meta
            avatar={<Avatar style={{ background: '#1d4ed8' }}>{t.assignee.charAt(0)}</Avatar>}
            title={
              <span>
                {t.title} — <Typography.Text type="secondary">{t.caseRef}</Typography.Text>
              </span>
            }
            description={`المسند: ${t.assignee} • الموعد: ${t.due}`}
          />
        </List.Item>
      )}
    />
  );
}