'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import TimeOffRequestForm from '../TimeOffRequestForm/time-off-request-form.component.jsx';

export default function TimeOffRequestsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time-Off Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <TimeOffRequestForm />
      </CardContent>
    </Card>
  );
}