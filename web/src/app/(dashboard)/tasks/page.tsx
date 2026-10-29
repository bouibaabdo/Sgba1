import { Card } from 'antd';
import { TasksBoard } from '@/components/tasks/tasks-board';

/** شاشة المهام — متابعة الإسناد والإنجاز داخل المكتب */
export default function TasksPage() {
  return (
    <Card>
      <TasksBoard />
    </Card>
  );
}