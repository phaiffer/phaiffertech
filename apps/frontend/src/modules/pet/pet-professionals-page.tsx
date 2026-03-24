'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetProfessional } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const initialPage: PageResponse<PetProfessional> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function PetProfessionalsPage() {
  const [pageData, setPageData] = useState<PageResponse<PetProfessional>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetProfessional | null>(null);

  const load = useCallback(async (page: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listProfessionals(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0, search);
  }, [load, search]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setSpecialty('');
    setLicenseNumber('');
    setPhone('');
    setEmail('');
  }

  function beginEdit(item: PetProfessional) {
    setEditingId(item.id);
    setName(item.name);
    setSpecialty(item.specialty ?? '');
    setLicenseNumber(item.licenseNumber ?? '');
    setPhone(item.phone ?? '');
    setEmail(item.email ?? '');
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name,
        specialty: specialty || undefined,
        licenseNumber: licenseNumber || undefined,
        phone: phone || undefined,
        email: email || undefined
      };

      if (editingId) {
        await petService.updateProfessional(editingId, payload);
        setSuccess('Professional updated.');
      } else {
        await petService.createProfessional(payload);
        setSuccess('Professional added.');
      }

      resetForm();
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save professional.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteProfessional(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Professional removed.');
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete professional.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<PetProfessional>[] = [
    { key: 'name', header: 'Name', render: (item) => item.name },
    { key: 'specialty', header: 'Specialty', render: (item) => item.specialty ?? '-' },
    { key: 'email', header: 'Email', render: (item) => item.email ?? '-' },
    { key: 'phone', header: 'Phone', render: (item) => item.phone ?? '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.professional.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="ui-inline-button"
            >
              Edit
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.professional.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="ui-inline-danger-button"
            >
              Delete
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.professional.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view team members.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          eyebrow="PetFlow workspace"
          title="Team Members"
          description="Clinicians, groomers, and operational staff linked to this pet business workspace."
        />

        <div className="grid gap-3 ui-surface-panel p-4 md:grid-cols-[1fr_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Name, specialty, license or contact" />
          <button
            type="button"
            onClick={() => setSearch(searchInput)}
            className="ui-primary-button"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
            }}
            className="ui-secondary-button"
          >
            Clear
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'pet.professional.update' : 'pet.professional.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 ui-surface-panel p-4 md:grid-cols-2">
            <FormInput label="Name" value={name} onChange={setName} required />
            <FormInput label="Specialty" value={specialty} onChange={setSpecialty} />
            <FormInput label="License number" value={licenseNumber} onChange={setLicenseNumber} />
            <FormInput label="Phone" value={phone} onChange={setPhone} />
            <FormInput label="Email" value={email} onChange={setEmail} type="email" />

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="ui-primary-button"
              >
                {submitting ? 'Saving...' : editingId ? 'Update professional' : 'Add professional'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="ui-secondary-button"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="No team members found. Add the first professional to enable appointment assignments." />
        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(page) => load(page, search)} />

        <ConfirmDialog
          open={deleteCandidate !== null}
          title="Remove team member?"
          description={deleteCandidate ? `"${deleteCandidate.name}" will be removed from this workspace.` : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
