'use client';

import { Badge, Calendar, Typography } from 'antd';
import type { Dayjs } from 'dayjs';

interface Hearing {
  id: number;
  date: string; // YYYY-MM-DD
  time: string;
  caseRef: string;
  court: string;
  room: string;
  lawyer: string;
}

// بيانات تجريبية — تُستبدل بـ /hearings من الـ API
const MOCK: Hearing[] = [
  { id: 1, date: '2026-10-30', time: '09:30', caseRef: '2026/014', court: 'المحكمة الابتدائية بالدار البيضاء', room: 'القاعة 4', lawyer: 'أحمد العلوي' },
  { id: 2, date: '2026-10-30', time: '11:00', caseRef: '2026/011', court: 'المحكمة التجارية بفاس', room: 'القاعة 2', lawyer: 'فاطمة الزهراء' },
  { id: 3, date: '2026-10-31', time: '10:00', caseRef: '2026/009', court: 'المحكمة الابتدائية بمراكش', room: 'القاعة 1', lawyer: 'أحمد العلوي' },
];

/**
 * تقويم الجلسات — يحوّل أيام الجلسات إلى خلايا ملونة.
 * دليل المحامي ("الرول") ومولّد الجلسات الكامل يكونان في المرحلة 5.
 */
export function HearingsCalendar() {
  const byDate = new Map<string, Hearing[]>();
  for (const h of MOCK) {
    const arr = byDate.get(h.date) ?? [];
    arr.push(h);
    byDate.set(h.date, arr);
  }

  const dateCellRender = (value: Dayjs) => {
    const list = byDate.get(value.format('YYYY-MM-DD'));
    if (!list) return null;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {list.map((h) => (
          <li key={h.id}>
            <Badge
              status="processing"
              text={`${h.time} — ${h.caseRef} (${h.court})`}
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>تقويم الجلسات</Typography.Title>
      <Calendar cellRender={dateCellRender} />
    </div>
  );
}