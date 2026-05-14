import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

function FormsBar({ count }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--muted)', marginBottom: 3 }}>
        <span>Forms submitted</span>
        <span>{count} / 6</span>
      </div>
      <div className="forms-bar">
        <div className="forms-bar-fill" style={{ width: `${(count / 6) * 100}%` }} />
      </div>
    </div>
  );
}

function timeAgo(ts) {
  if (!ts) return 'No activity yet';
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

export default function PatientList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  async function load() {
    try {
      const data = await api.get('/coach/patients');
      setPatients(data);
    } catch { /* already redirected by client on 401 */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function assign(e) {
    e.preventDefault();
    setAssignError('');
    setAssignLoading(true);
    try {
      await api.post('/coach/patients/assign', { email: assignEmail });
      setAssignEmail('');
      await load();
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssignLoading(false);
    }
  }

  return (
    <div className="coach-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>Your patients</h1>
          <p className="muted" style={{ fontSize: '.88rem' }}>Signed in as {user?.name}</p>
        </div>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 16px' }} onClick={logout}>
          Sign out
        </button>
      </div>

      <form className="assign-form" onSubmit={assign}>
        <input
          type="email"
          placeholder="Patient email address"
          value={assignEmail}
          onChange={(e) => setAssignEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={assignLoading}>
          {assignLoading ? 'Adding…' : '+ Add patient'}
        </button>
      </form>
      {assignError && <div className="error-msg" style={{ marginBottom: 16 }}>{assignError}</div>}

      {loading ? (
        <div className="spinner">Loading…</div>
      ) : patients.length === 0 ? (
        <div className="empty-state">No patients assigned yet. Add one above.</div>
      ) : (
        <div className="patient-grid">
          {patients.map((p) => (
            <Link key={p.id} to={`/coach/patients/${p.id}`} className="patient-card">
              <h2>{p.name}</h2>
              <p className="muted" style={{ fontSize: '.82rem' }}>{p.email}</p>
              <p className="muted" style={{ fontSize: '.8rem' }}>{timeAgo(p.last_activity)}</p>
              <FormsBar count={p.forms_submitted} />
              {p.recent_notes_count > 0 && (
                <span className="badge badge-submitted" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  {p.recent_notes_count} new note{p.recent_notes_count > 1 ? 's' : ''}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
