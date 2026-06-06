import { useState, useEffect, useCallback } from 'react';
import { Search, UserX, UserCheck, Trash2, Users } from 'lucide-react';
import { usersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Select, Badge, Modal, Spinner, Empty, Pagination } from '../components/ui';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const roleBadge = { admin: 'red', user: 'blue' };

export default function UsersPage() {
  const { user: me } = useAuth();
  const [data, setData]       = useState({ users: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 10, role: '', search: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusLoading, setStatusLoading] = useState({});

  const setFilter = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value, page: 1 }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''));
      const res = await usersAPI.list(params);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (userId, current) => {
    setStatusLoading(s => ({ ...s, [userId]: true }));
    try {
      await usersAPI.setStatus(userId, !current);
      load();
    } finally {
      setStatusLoading(s => ({ ...s, [userId]: false }));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await usersAPI.delete(deleteId);
      setDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  const { users, pagination } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="fade-up">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Users</h1>
        <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
          {pagination.total !== undefined ? `${pagination.total} users` : ''}
        </p>
      </div>

      {/* Filters */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              placeholder="Search by name or email…"
              value={filters.search}
              onChange={setFilter('search')}
              style={{
                width: '100%', padding: '8px 12px 8px 32px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                fontSize: 14, background: 'var(--bg)', color: 'var(--text)', outline: 'none',
              }}
            />
          </div>
          <Select value={filters.role} onChange={setFilter('role')} style={{ flex: '0 0 140px' }}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </Select>
          {(filters.role || filters.search) && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({ page: 1, limit: 10, role: '', search: '' })}>Clear</Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={24} /></div>
        ) : users.length === 0 ? (
          <Empty icon={Users} title="No users found" message="Try adjusting your search or filters." />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['User','Role','Status','Joined','Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const isSelf = u._id === me?._id;
                    return (
                      <tr key={u._id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* User */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'var(--bg)', border: '1px solid var(--border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 600, color: 'var(--text-2)',
                              flexShrink: 0,
                            }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>
                                {u.name} {isSelf && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>(you)</span>}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '12px 16px' }}>
                          <Badge color={roleBadge[u.role]}>{u.role}</Badge>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 16px' }}>
                          <Badge color={u.isActive ? 'green' : 'default'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                        </td>

                        {/* Joined */}
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-3)' }}>{fmtDate(u.createdAt)}</td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px' }}>
                          {!isSelf && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                onClick={() => toggleStatus(u._id, u.isActive)}
                                disabled={statusLoading[u._id]}
                                title={u.isActive ? 'Deactivate' : 'Activate'}
                                style={{ padding: '5px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', transition: 'all var(--transition)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = u.isActive ? 'var(--amber-bg)' : 'var(--green-bg)'; e.currentTarget.style.color = u.isActive ? 'var(--amber)' : 'var(--green)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}
                              >
                                {statusLoading[u._id]
                                  ? <span style={{ fontSize: 12 }}>…</span>
                                  : u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>
                              <button
                                onClick={() => setDeleteId(u._id)}
                                title="Delete user"
                                style={{ padding: '5px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', transition: 'all var(--transition)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                <Pagination page={pagination.page} pages={pagination.pages} onPage={(p) => setFilters(f => ({ ...f, page: p }))} />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete user">
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20 }}>
          Are you sure you want to permanently delete this user? This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete user</Button>
        </div>
      </Modal>
    </div>
  );
}
