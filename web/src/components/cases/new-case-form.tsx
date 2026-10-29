'use client';

import { useState } from 'react';
import { App, Button, Form, Input, Result, Select, Steps } from 'antd';
import { api } from '@/lib/api';

const { TextArea } = Input;

interface CaseDraft {
  internalRef: string;
  courtRef?: string;
  title: string;
  type: string;
  courtId?: number;
  clientKind?: string;
  clientName: string;
  clientPhone?: string;
  clientCin?: string;
  archiveCabinet?: string;
  archiveShelf?: string;
  archiveBox?: string;
  archiveNotes?: string;
}

/**
 * نموذج متعدد الخطوات لفتح ملف جديد:
 *  1) البيانات الأساسية  2) الزبون  3) الأرشفة المادية  4) تأكيد
 * يُرسل إلى POST /cases عند الإتمام.
 */
export function NewCaseForm({ onDone }: { onDone?: () => void }) {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm<CaseDraft>();
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const steps = [
    { title: 'البيانات الأساسية' },
    { title: 'الزبون' },
    { title: 'الأرشفة المادية' },
    { title: 'التأكيد' },
  ];

  const next = async () => {
    try {
      await form.validateFields();
      setCurrent((c) => c + 1);
    } catch {
      /* اعرض رسائل التحقق داخل النموذج */
    }
  };
  const prev = () => setCurrent((c) => c - 1);

  const submit = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);
      const payload = {
        internalRef: v.internalRef,
        courtRef: v.courtRef,
        title: v.title,
        type: v.type,
        courtId: v.courtId,
        client: {
          kind: v.clientKind ?? 'PERSON',
          fullNameAr: v.clientName,
          phone: v.clientPhone,
          cin: v.clientCin,
        },
        archive: {
          cabinet: v.archiveCabinet,
          shelf: v.archiveShelf,
          box: v.archiveBox,
          notes: v.archiveNotes,
        },
      };
      await api.post('/cases', payload);
      message.success('تم فتح الملف بنجاح');
      setFinished(true);
    } catch (e) {
      const detail = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(detail ?? 'تعذّر فتح الملف');
    } finally {
      setSubmitting(false);
    }
  };

  if (finished) {
    return (
      <Result
        status="success"
        title="تم فتح الملف بنجاح"
        subTitle={`أودع الملف الورقي في الخزانة رقم ${form.getFieldValue('archiveCabinet') ?? '—'}`}
        extra={<Button type="primary" onClick={onDone}>إغلاق</Button>}
      />
    );
  }

  return (
    <div>
      <Steps current={current} items={steps} style={{ marginBottom: 24 }} />

      <Form form={form} layout="vertical" initialValues={{ type: 'CIVIL', clientKind: 'PERSON' }}>
        {current === 0 && (
          <>
            <Form.Item name="internalRef" label="المرجع الداخلي للمكتب" rules={[{ required: true }]}>
              <Input placeholder="مثال: 2026/015" />
            </Form.Item>
            <Form.Item name="courtRef" label="مرجع قيد المحكمة">
              <Input placeholder="مثال: 2145/2026" />
            </Form.Item>
            <Form.Item name="title" label="عنوان النزاع" rules={[{ required: true }]}>
              <Input placeholder="موجز عن النزاع" />
            </Form.Item>
            <Form.Item name="type" label="نوع القضية" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'CIVIL', label: 'مدني' },
                  { value: 'PENAL', label: 'جنائي' },
                  { value: 'COMMERCIAL', label: 'تجاري' },
                  { value: 'SOCIAL', label: 'اجتماعي (شغل)' },
                  { value: 'ADMINISTRATIVE', label: 'إداري' },
                ]}
              />
            </Form.Item>
            <Form.Item name="courtId" label="المحكمة">
              <Select
                showSearch
                placeholder="(يُحمّل من Seeder المحاكم المغربية — يتطلب تشغيل الخلفية)"
                options={[]}
              />
            </Form.Item>
          </>
        )}

        {current === 1 && (
          <>
            <Form.Item name="clientKind" label="نوع الزبون">
              <Select
                options={[
                  { value: 'PERSON', label: 'شخص ذاتي' },
                  { value: 'COMPANY', label: 'مقاولة' },
                ]}
              />
            </Form.Item>
            <Form.Item name="clientName" label="اسم الزبون" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="clientPhone" label="الهاتف">
              <Input />
            </Form.Item>
            <Form.Item name="clientCin" label="رقم البطاقة الوطنية / المعرّف ICE">
              <Input />
            </Form.Item>
          </>
        )}

        {current === 2 && (
          <>
            <Form.Item name="archiveCabinet" label="رقم الخزانة" rules={[{ required: true, message: 'حدد مكان الملف الورقي' }]}>
              <Input placeholder="مثال: أ" />
            </Form.Item>
            <Form.Item name="archiveShelf" label="رقم الرف" rules={[{ required: true }]}>
              <Input placeholder="مثال: 3" />
            </Form.Item>
            <Form.Item name="archiveBox" label="رقم العلبة">
              <Input placeholder="مثال: 12" />
            </Form.Item>
            <Form.Item name="archiveNotes" label="ملاحظات الأرشفة">
              <TextArea rows={2} placeholder="مثال: الجزء الثاني لدى المحاسب" />
            </Form.Item>
          </>
        )}

        {current === 3 && (
          <p>
            راجع البيانات ثم اضغط "فتح الملف". ستُعرض ملخصات الخطوات الثلاث هنا قبل الإرسال النهائي.
          </p>
        )}
      </Form>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
        {current > 0 && <Button onClick={prev}>السابق</Button>}
        {current < steps.length - 1 && (
          <Button type="primary" onClick={next}>التالي</Button>
        )}
        {current === steps.length - 1 && (
          <Button type="primary" onClick={submit} loading={submitting}>فتح الملف</Button>
        )}
      </div>
    </div>
  );
}