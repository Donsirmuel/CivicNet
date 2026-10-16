import { useEffect, useState, type FormEvent } from 'react';
import { Button, Icon } from '../components/common';
import StandardLayout from '../layouts/StandardLayout';
import {
  verificationService,
  type CreateVerificationRequestData,
  type VerificationRequest,
} from '../services/verification';

const textInputClass =
  'w-full rounded-xl border border-[var(--civic-border)] bg-white px-4 py-3 text-[15px] text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none transition focus:border-[var(--civic-primary)] focus:ring-2 focus:ring-[var(--civic-primary-glow)]';

const fieldLabelClass =
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--civic-muted)]';

const statusBadgeClass: Record<VerificationRequest['status'], string> = {
  pending: 'bg-[var(--civic-gold-soft)] text-[#8a6a1c]',
  approved: 'bg-[var(--civic-primary-glow)] text-[var(--civic-primary)]',
  rejected: 'bg-[rgba(218,92,78,0.1)] text-[var(--civic-danger)]',
};

function formatLocation(request: VerificationRequest): string {
  const parts = [request.ward, request.lga, request.state].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : request.jurisdiction;
}

export default function VerifyOfficePage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<CreateVerificationRequestData>({
    office_name: '',
    jurisdiction: 'ward',
    state: '',
    lga: '',
    ward: '',
    document_url: '',
  });

  const loadRequests = async () => {
    try {
      const data = await verificationService.listMyRequests();
      setRequests(data);
    } catch {
      setError('We could not load your verification requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const updateField = (key: keyof CreateVerificationRequestData, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.office_name.trim()) {
      setError('Enter the name of the office you represent.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateVerificationRequestData = {
        office_name: form.office_name.trim(),
        jurisdiction: form.jurisdiction,
        state: form.state?.trim() || undefined,
        lga: form.lga?.trim() || undefined,
        ward: form.ward?.trim() || undefined,
        document_url: form.document_url?.trim() || undefined,
      };
      const created = await verificationService.createRequest(payload);
      setRequests((current) => [created, ...current]);
      setForm({
        office_name: '',
        jurisdiction: 'ward',
        state: '',
        lga: '',
        ward: '',
        document_url: '',
      });
      setSuccess('Your request was submitted. Staff will review it soon.');
    } catch {
      setError('We could not submit your request. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StandardLayout showLeftSidebar={false} showRightSidebar={false}>
      <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1100px]">
          <header>
            <h1 className="font-display text-4xl tracking-[-0.02em] text-[var(--civic-text)]">
              Verify your office
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--civic-muted)]">
              Tell us which office you represent. Once staff approve your request, your account
              becomes a verified office.
            </p>
          </header>

          {error && (
            <div className="mt-6 rounded-xl bg-[rgba(218,92,78,0.1)] px-4 py-3 text-sm text-[var(--civic-danger)]">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[var(--civic-primary)]" style={{ background: 'var(--civic-primary-glow)' }}>
              <Icon name="check_circle" className="text-lg" />
              {success}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-[var(--civic-border)] bg-white p-6">
              <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--civic-text)]">
                New request
              </h2>
              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div>
                  <label htmlFor="verify-office-name" className={fieldLabelClass}>
                    Office name
                  </label>
                  <input
                    id="verify-office-name"
                    type="text"
                    value={form.office_name}
                    onChange={(event) => updateField('office_name', event.target.value)}
                    placeholder="e.g. Ward 5 Councillor"
                    className={textInputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="verify-jurisdiction" className={fieldLabelClass}>
                    Jurisdiction level
                  </label>
                  <select
                    id="verify-jurisdiction"
                    value={form.jurisdiction}
                    onChange={(event) =>
                      updateField('jurisdiction', event.target.value as 'ward' | 'lga' | 'state')
                    }
                    className={`${textInputClass} cursor-pointer`}
                  >
                    <option value="ward">Ward</option>
                    <option value="lga">LGA</option>
                    <option value="state">State</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <label htmlFor="verify-state" className={fieldLabelClass}>
                      State
                    </label>
                    <input
                      id="verify-state"
                      type="text"
                      value={form.state}
                      onChange={(event) => updateField('state', event.target.value)}
                      placeholder="Lagos"
                      className={textInputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="verify-lga" className={fieldLabelClass}>
                      LGA
                    </label>
                    <input
                      id="verify-lga"
                      type="text"
                      value={form.lga}
                      onChange={(event) => updateField('lga', event.target.value)}
                      placeholder="Ikeja"
                      className={textInputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="verify-ward" className={fieldLabelClass}>
                      Ward
                    </label>
                    <input
                      id="verify-ward"
                      type="text"
                      value={form.ward}
                      onChange={(event) => updateField('ward', event.target.value)}
                      placeholder="Ward 5"
                      className={textInputClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="verify-document" className={fieldLabelClass}>
                    Document URL (optional)
                  </label>
                  <input
                    id="verify-document"
                    type="url"
                    value={form.document_url}
                    onChange={(event) => updateField('document_url', event.target.value)}
                    placeholder="Link to an appointment letter or ID"
                    className={textInputClass}
                  />
                </div>
                <Button type="submit" variant="primary" loading={submitting} icon="verified">
                  Submit request
                </Button>
              </form>
            </section>

            <section className="rounded-xl border border-[var(--civic-border)] bg-white p-6">
              <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--civic-text)]">
                My requests
              </h2>
              <div className="mt-5 space-y-4">
                {loading ? (
                  <p className="text-sm text-[var(--civic-muted)]">Loading your requests...</p>
                ) : requests.length === 0 ? (
                  <p className="text-sm leading-6 text-[var(--civic-muted)]">
                    You have not submitted any verification requests yet.
                  </p>
                ) : (
                  requests.map((request) => (
                    <article
                      key={request.id}
                      className="rounded-xl border border-[var(--civic-border)] bg-[var(--civic-surface-soft)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-semibold text-[var(--civic-text)]">
                            {request.office_name}
                          </p>
                          <p className="mt-1 text-sm text-[var(--civic-muted)]">
                            {formatLocation(request)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${statusBadgeClass[request.status]}`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
