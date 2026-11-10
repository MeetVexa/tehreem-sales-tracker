'use client';

import { useEffect, useMemo, useState } from 'react';

type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  owner: string;
  stage: string;
  added: string;
  paymentAmount: number;
  paymentVerified: boolean;
  paymentRef: string;
};

const STORAGE_KEY = 'tehreem-sales-tracker-v1';
const stages = ['New lead', 'Contacted', 'Qualified', 'Follow-up', 'Won', 'Lost'];
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '—';

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'grid') return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
  if (name === 'users') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (name === 'wallet') return <svg {...common}><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 15h2"/><path d="M6 5V3h12v2"/></svg>;
  if (name === 'plus') return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if (name === 'chevron') return <svg {...common}><path d="m9 18 6-6-6-6"/></svg>;
  if (name === 'dots') return <svg {...common}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>;
  return <svg {...common}><path d="M12 3v18M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}

const blankForm = { name: '', company: '', email: '', owner: '', stage: 'New lead', paymentAmount: '', paymentVerified: false, paymentRef: '' };

export default function Page() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All stages');
  const [menu, setMenu] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setLeads(parsed);
      }
    } catch { /* Corrupt local data is ignored; user can begin a fresh tracker. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads, hydrated]);

  const owners = useMemo(() => Array.from(new Set(leads.map((lead) => lead.owner.trim()).filter(Boolean))), [leads]);
  const collected = leads.filter((lead) => lead.paymentVerified && lead.paymentAmount > 0).reduce((sum, lead) => sum + lead.paymentAmount, 0);
  const filtered = leads.filter((lead) => {
    const query = search.toLowerCase();
    const matchesQuery = `${lead.name} ${lead.company} ${lead.email} ${lead.owner}`.toLowerCase().includes(query);
    return matchesQuery && (filter === 'All stages' || lead.stage === filter);
  });
  const openAdd = () => { setEditing(null); setForm(blankForm); setModal(true); };
  const openEdit = (lead: Lead) => {
    setEditing(lead.id);
    setForm({ name: lead.name, company: lead.company, email: lead.email, owner: lead.owner, stage: lead.stage, paymentAmount: lead.paymentAmount ? String(lead.paymentAmount) : '', paymentVerified: lead.paymentVerified, paymentRef: lead.paymentRef });
    setMenu(null); setModal(true);
  };
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entry: Lead = { id: editing ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`), name: form.name.trim(), company: form.company.trim(), email: form.email.trim(), owner: form.owner.trim(), stage: form.stage, added: editing ? leads.find((item) => item.id === editing)?.added ?? new Date().toISOString() : new Date().toISOString(), paymentAmount: Number(form.paymentAmount) || 0, paymentVerified: Boolean(form.paymentVerified && Number(form.paymentAmount) > 0 && form.paymentRef.trim()), paymentRef: form.paymentRef.trim() };
    setLeads((previous) => editing ? previous.map((lead) => lead.id === editing ? entry : lead) : [entry, ...previous]);
    setNotice(entry.paymentVerified ? 'Lead saved. Verified payment included in collected totals.' : 'Lead saved. Collected totals include verified payments only.');
    setModal(false);
    window.setTimeout(() => setNotice(''), 4200);
  };
  const remove = (id: string) => { setLeads((previous) => previous.filter((lead) => lead.id !== id)); setMenu(null); };

  return (
    <main className="app-shell min-h-screen text-ink">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Fieldnote home"><span className="brand-mark">f.</span><span>fieldnote<span className="brand-period">.</span><small>SALES WORKSPACE</small></span></a>
        <div className="nav-label">WORKSPACE</div>
        <a className="nav-item active" href="#overview"><Icon name="grid"/><span>Overview</span><span className="nav-active-dot"/></a>
        <a className="nav-item" href="#team"><Icon name="users"/><span>Team</span><span className="nav-count">{owners.length}</span></a>
        <a className="nav-item" href="#leads"><Icon name="wallet"/><span>Lead & payments</span></a>
        <div className="sidebar-bottom">
          <div className="workspace-card"><div className="workspace-icon">TH</div><div><strong>Tehreem Hussain</strong><span>Sales tracker</span></div><Icon name="dots" size={17}/></div>
          <div className="local-note"><span className="green-dot"/> Saved in this browser <span className="info-dot" title="Entries are stored locally in this browser. They are not synced to a CRM or shared with teammates.">i</span></div>
        </div>
      </aside>

      <div className="main-column" id="overview">
        <header className="topbar"><div className="mobile-brand"><span className="brand-mark">f.</span> fieldnote<span className="brand-period">.</span></div><div className="breadcrumbs">Workspace <span>/</span> Overview</div><div className="topbar-right"><span className="sync-pill"><span className="green-dot"/> Local workspace</span><div className="profile-avatar">TH</div></div></header>
        <div className="content-wrap">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR SALES, IN FOCUS</div><h1>Good work starts<br className="heading-break"/> with a clear view<span className="heading-period">.</span></h1><p className="intro">A simple place to keep track of your pipeline and verified payments.</p></div><button className="primary-button" onClick={openAdd}><Icon name="plus"/> Add a lead</button></div>

          <section className="kpi-grid" aria-label="Sales overview">
            <article className="kpi-card"><div className="kpi-top"><span>Total leads</span><span className="kpi-icon lavender"><Icon name="users" size={17}/></span></div><div className="kpi-value">{hydrated ? leads.length : '—'}</div><div className="kpi-caption">All leads entered in this tracker</div><div className="kpi-bottom"><span className="mini-bars"><i/><i/><i/><i/><i/><i/></span><span>Current workspace</span></div></article>
            <article className="kpi-card"><div className="kpi-top"><span>People assigned</span><span className="kpi-icon mint"><Icon name="grid" size={17}/></span></div><div className="kpi-value">{hydrated ? owners.length : '—'}</div><div className="kpi-caption">With at least one lead assigned</div><div className="kpi-bottom"><span className="kpi-link" onClick={() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' })}>See team <Icon name="chevron" size={13}/></span></div></article>
            <article className="kpi-card featured-kpi"><div className="kpi-top"><span>Collected</span><span className="kpi-icon pale-green"><Icon name="dollar" size={18}/></span></div><div className="kpi-value">{hydrated ? money.format(collected) : '—'}</div><div className="kpi-caption">Verified payment records only</div><div className="kpi-bottom"><span className="verified-small"><span>✓</span> Payment proof required</span><span className="info-dot light-info" title="Only amounts with a payment reference and verification enabled are counted.">i</span></div></article>
          </section>

          <section className="section-block" id="team"><div className="section-heading"><div><div className="eyebrow">THE PEOPLE BEHIND THE PIPELINE</div><h2>Team overview</h2></div><span className="section-aside">{owners.length} {owners.length === 1 ? 'person' : 'people'} assigned</span></div>
            {owners.length === 0 ? <div className="team-empty"><div className="empty-illustration"><div className="empty-person">TH</div><span className="empty-spark">✳</span></div><div><strong>Your team summary starts here</strong><p>Add a lead and assign an owner to see per-person lead counts and verified collections.</p></div><button className="text-action" onClick={openAdd}>Add your first lead <Icon name="chevron" size={14}/></button></div> : <div className="team-grid">{owners.map((owner, index) => { const items = leads.filter((lead) => lead.owner === owner); const payments = items.filter((lead) => lead.paymentVerified && lead.paymentAmount > 0).reduce((sum, lead) => sum + lead.paymentAmount, 0); return <article className="person-card" key={owner}><div className="person-top"><div className={`person-avatar tone-${index % 4}`}>{initials(owner)}</div><div className="person-details"><strong>{owner}</strong><span>{items.length} {items.length === 1 ? 'lead' : 'leads'} assigned</span></div><span className="person-status"><i/> Active</span></div><div className="person-metrics"><div><span>LEADS</span><strong>{items.length}</strong></div><div><span>COLLECTED · VERIFIED</span><strong>{money.format(payments)}</strong></div></div><div className="person-progress"><span style={{ width: `${collected ? Math.max(4, Math.round((payments / collected) * 100)) : 0}%` }}/></div></article>; })}</div>}
          </section>

          <section className="section-block ledger-section" id="leads"><div className="section-heading ledger-heading"><div><div className="eyebrow">EVERY OPPORTUNITY, ACCOUNTED FOR</div><h2>Lead & payment tracker</h2></div><button className="outline-button" onClick={openAdd}><Icon name="plus" size={16}/> Add lead</button></div>
            <div className="ledger-card"><div className="ledger-toolbar"><div className="table-title">All leads <span>{hydrated ? leads.length : 0}</span></div><div className="table-controls"><label className="search-box"><Icon name="search" size={16}/><input aria-label="Search leads" placeholder="Search leads..." value={search} onChange={(event) => setSearch(event.target.value)}/></label><select aria-label="Filter by stage" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All stages</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></div></div>
              {!hydrated ? <div className="table-empty"><span className="loader-dot"/> Loading your local tracker…</div> : filtered.length === 0 ? <div className="table-empty"><div className="empty-table-icon"><Icon name="users" size={21}/></div><strong>{leads.length === 0 ? 'No leads added yet' : 'No leads match this search'}</strong><p>{leads.length === 0 ? 'Add a lead to start your tracker. No CRM data or payment totals have been imported.' : 'Try another name or choose a different stage filter.'}</p>{leads.length === 0 && <button className="primary-button compact" onClick={openAdd}><Icon name="plus" size={16}/> Add your first lead</button>}</div> : <div className="table-scroll"><table><thead><tr><th>LEAD</th><th>ASSIGNED TO</th><th>STAGE</th><th>PAYMENT STATUS</th><th>COLLECTED</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((lead) => <tr key={lead.id}><td><div className="lead-cell"><div className="lead-avatar">{initials(lead.name)}</div><div><strong>{lead.name}</strong><span>{lead.company || lead.email || 'No company added'}</span></div></div></td><td><div className="assignee"><span>{initials(lead.owner)}</span>{lead.owner}</div></td><td><span className={`stage-badge stage-${lead.stage.toLowerCase().replace(/\s+/g, '-')}`}><i/>{lead.stage}</span></td><td>{lead.paymentVerified ? <span className="payment-badge verified"><i>✓</i> Verified</span> : lead.paymentAmount > 0 ? <span className="payment-badge review"><i>!</i> Needs verification</span> : <span className="payment-badge none">Not recorded</span>}</td><td className="collected-cell">{lead.paymentVerified ? money.format(lead.paymentAmount) : '—'}</td><td className="action-cell"><button aria-label={`Actions for ${lead.name}`} className="row-action" onClick={() => setMenu(menu === lead.id ? null : lead.id)}><Icon name="dots"/></button>{menu === lead.id && <div className="row-menu"><button onClick={() => openEdit(lead)}>Edit lead</button><button className="delete-action" onClick={() => remove(lead.id)}>Delete</button></div>}</td></tr>)}</tbody></table></div>}
              <div className="ledger-foot"><span>Collected totals only include payment records marked verified with a reference.</span><span>{leads.length} {leads.length === 1 ? 'record' : 'records'}</span></div>
            </div>
          </section>
          <footer className="page-footer"><span>FIELDNOTE <b>·</b> SALES WORKSPACE</span><span>Private to this browser <span className="footer-sep">·</span> Not connected to a CRM</span></footer>
        </div>
      </div>

      {notice && <div role="status" className="toast"><span>✓</span>{notice}</div>}
      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><section className="entry-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><div className="eyebrow">SALES WORKSPACE</div><h2 id="modal-title">{editing ? 'Edit lead' : 'Add a lead'}</h2><p>Keep the details you need to follow up.</p></div><button className="close-button" aria-label="Close" onClick={() => setModal(false)}>×</button></div><form onSubmit={save}><div className="form-grid"><label className="form-field span-two">Lead name <input required autoFocus placeholder="e.g. Alex Morgan" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label className="form-field">Company <span className="optional">OPTIONAL</span><input placeholder="Company name" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })}/></label><label className="form-field">Email <span className="optional">OPTIONAL</span><input type="email" placeholder="name@company.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label><label className="form-field">Assigned to <input required placeholder="Person responsible" value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })}/></label><label className="form-field">Lead stage <select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label></div><div className="payment-form-section"><div className="payment-form-heading"><span className="payment-form-icon"><Icon name="wallet" size={17}/></span><div><strong>Payment record</strong><span>Only verified payments count toward collected.</span></div></div><div className="form-grid payment-fields"><label className="form-field">Amount <span className="optional">USD</span><div className="amount-input"><span>$</span><input min="0" step="0.01" type="number" placeholder="0.00" value={form.paymentAmount} onChange={(event) => setForm({ ...form, paymentAmount: event.target.value, paymentVerified: false })}/></div></label><label className="form-field">Payment reference<input placeholder="Receipt, transaction ID…" value={form.paymentRef} onChange={(event) => setForm({ ...form, paymentRef: event.target.value })}/></label></div><label className={`verify-check ${(!form.paymentAmount || !form.paymentRef.trim()) ? 'disabled' : ''}`}><input type="checkbox" disabled={!form.paymentAmount || !form.paymentRef.trim()} checked={form.paymentVerified} onChange={(event) => setForm({ ...form, paymentVerified: event.target.checked })}/><span className="check-custom">✓</span><span><strong>Payment verified against a record</strong><small>Check this only after confirming the payment receipt or transaction.</small></span></label></div><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setModal(false)}>Cancel</button><button type="submit" className="primary-button">{editing ? 'Save changes' : 'Save lead'}</button></div></form></section></div>}
    </main>
  );
}
