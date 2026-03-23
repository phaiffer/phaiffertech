export type NotificationAlertItem = {
  key: string;
  type: 'ALERT' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  href: string;
};

export type NotificationSummary = {
  items: NotificationAlertItem[];
  totalCount: number;
  criticalCount: number;
};
