'use client';

import { useEffect, useState } from 'react';
import { Button, Modal, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import { NewCaseForm } from './new-case-form';

interface CaseRow {
  id: number;
  internalRef: string;
  courtRef: string;
  title: string;
  type: string;
  status: string;
  clientName: string;
  court: string;
  leadLawyer: string;
  archive: string;
  updatedAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'blue',
  IN_PROGRESS: 'processing',
  DELIBERATION: 'gold',
  JUDGMENT_RENDERED: 'cyan',
  CLOSED: 'default',
  ARCHIVED: 'default',
};

const STATUS_AR: Record<string, string> = {
  OPEN: 'مفتوح',
  IN_PROGRESS: 'قيد المتابعة',
  DELIBERATION: 'مداولة',
  JUDGMENT_RENDERED: 'صدر الحكم',
  CLOSED: 'مغلق',
  ARCHIVED: ' مؤرشف',
};

const TYPE_AR: Record<string, string> = {
  CIVIL: 'مدني',
  PENAL: 'جنائي',
  COMMERCIAL: 'تجاري',
  SOCIAL: 'اجتماعي',
  ADMINISTRATIVE: 'إداري',
};

interface ApiCase {
  id: number;
  internalRef: string;
  courtRef: string | null;
  title: string;
  type: string;
  status: string;
  client: { fullNameAr: string };
  court: { nameAr: string } | null;
  leadLawyer: { fullName: string } | null;
  archiveCabinet: string | null;
  archiveShelf: string | null;
  archiveBox: string | null;
  updatedAt: string;
}

const toRow = (c: ApiCase): CaseRow => ({
  id: c.id,
  internalRef: c.internalRef,
  courtRef: c.courtRef ?? '—',
  title: c.title,
  type: c.type,
  status: c.status,
  clientName: c.client.fullNameAr,
  court: c.court?.nameAr ?? '—',
  leadLawyer: c.leadLawyer?.fullName ?? '—',
  archive: [c.archiveCabinet, c.archiveShelf, c.archiveBox].filter(Boolean).join('/') || '—',
  updatedAt: c.updatedAt?.slice(0, 10) ?? '—',
});

/**
 * جدول الملفات — يجلب من GET /cases (يعمل فور تشغيل الخلفية).
 * فرز، فلترة، تحديد صفوف وعمليات دفعة، وعمود الأرشيف الورقي.
 */
export function CasesTable() {
  const [data, setData] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [openNew, setOpenNew] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiCase[]>('/cases');
      setData(data.map(toRow));
    } catch {
      message.error('تعذّر تحميل الملفات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: ColumnsType<CaseRow> = [
    {
      title: 'مرجع المكتب',
      dataIndex: 'internalRef',
      sorter: (a, b) => a.internalRef.localeCompare(b.internalRef),
      fixed: 'left',
      width: 110,
    },
    {
      title: 'مرجع المحكمة',
      dataIndex: 'courtRef',
      width: 120,
    },
    {
      title: 'العنوان',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'النوع',
      dataIndex: 'type',
      width: 100,
      filters: Object.entries(TYPE_AR).map(([value, text]) => ({ text, value })),
      onFilter: (v, r) => r.type === v,
      render: (t: string) => TYPE_AR[t] ?? t,
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      width: 130,
      filters: Object.entries(STATUS_AR).map(([value, text]) => ({ text, value })),
      onFilter: (v, r) => r.status === v,
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_AR[s] ?? s}</Tag>,
    },
    {
      title: 'الزبون',
      dataIndex: 'clientName',
      ellipsis: true,
    },
    {
      title: 'المحكمة',
      dataIndex: 'court',
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: 'المحامي',
      dataIndex: 'leadLawyer',
      responsive: ['md'],
    },
    {
      title: 'الأرشيف',
      dataIndex: 'archive',
      width: 90,
      responsive: ['md'],
      render: (a: string) => <Typography.Text type="secondary">{a}</Typography.Text>,
    },
    {
      title: 'آخر تحديث',
      dataIndex: 'updatedAt',
      width: 110,
      sorter: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
      responsive: ['md'],
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>الملفات</Typography.Title>
        <Space>
          <Button icon={<SearchOutlined />}>بحث شامل</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenNew(true)}>فتح ملف جديد</Button>
        </Space>
      </div>

      <Modal open={openNew} onCancel={() => setOpenNew(false)} footer={null} width={640} title="فتح ملف جديد">
        <NewCaseForm onDone={() => { setOpenNew(false); load(); }} />
      </Modal>

      <Table<CaseRow>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{ pageSize: 10, showTotal: (t) => `إجمالي ${t} ملف` }}
        scroll={{ x: 900 }}
        size="middle"
      />

      {selectedRowKeys.length > 0 && (
        <Space>
          <span>محدد: {selectedRowKeys.length}</span>
          <Button size="small">أرشفة</Button>
          <Button size="small">إسناد</Button>
          <Button size="small">تصدير</Button>
        </Space>
      )}
    </Space>
  );
}