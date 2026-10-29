import { Card } from 'antd';
import { HearingsCalendar } from '@/components/hearings/hearings-calendar';

/** شاشة الجلسات — تقويم وقائمة الجلسات القادمة لكل محامٍ */
export default function HearingsPage() {
  return (
    <Card>
      <HearingsCalendar />
    </Card>
  );
}