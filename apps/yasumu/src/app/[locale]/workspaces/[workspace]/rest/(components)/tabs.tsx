'use client';
import React from 'react';
import { GetMethodIcon } from './http-methods';
import { RequestTabs } from './request-tabs';

const values = Array.from({ length: 10 }, (_, index) => ({
  name: `Tab ${index + 1}`,
  icon: () => <GetMethodIcon />,
}));

export default function RequestTabList() {
  return <RequestTabs tabs={values} />;
}
