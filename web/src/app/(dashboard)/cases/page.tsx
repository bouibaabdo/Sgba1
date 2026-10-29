import { Card } from 'antd';
import { CasesTable } from '@/components/cases/cases-table';

/**
 * شاشة الملفات — قلب النظام.
 * جدول كثيف: فرز، فلترة، اختيار صفوف، عمليات دفعة، بحث بالمرجع/الاسم.
 */
export default function CasesPage() {
  return (
    <Card>
      <CasesTable />
    </Card>
  );
}