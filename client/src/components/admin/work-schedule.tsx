import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import WorkSchedule from './work-schedule/WorkSchedule';

export default function WorkScheduleWrapper() : void {
  const { userRole } = usePermissions();

  return (
    <div className="p-6">
      <WorkSchedule 
        userRole={userRole || 'employe'}
        viewMode="calendar"
      />
    </div>
  );
}
