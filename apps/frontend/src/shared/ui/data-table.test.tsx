import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable } from '@/shared/ui/data-table';

type Row = {
  id: string;
  name: string;
};

const columns = [
  {
    key: 'name',
    header: 'Name',
    render: (row: Row) => row.name
  }
];

describe('DataTable', () => {
  it('renders the enhanced loading state', () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        loading
        loadingTitle="Loading users"
        loadingDescription="Preparing the latest workspace access data."
      />
    );

    expect(screen.getByText('Loading users')).toBeInTheDocument();
    expect(screen.getByText('Preparing the latest workspace access data.')).toBeInTheDocument();
  });

  it('renders the guided empty state when no rows are available', () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        emptyState={{
          title: 'No rows yet',
          description: 'Create the first record to populate this table.',
          action: <button type="button">Create record</button>
        }}
      />
    );

    expect(screen.getByText('No rows yet')).toBeInTheDocument();
    expect(screen.getByText('Create the first record to populate this table.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create record' })).toBeInTheDocument();
  });
});
