import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../components/Layout';
import { invitationsApi, usersApi } from '../services/api';
import { Invitation, OrgMember, OwnerStats } from '../types';
import { format } from 'date-fns';

const schema = z.object({ email: z.string().email('E-mail inválido') });
type FormData = z.infer<typeof schema>;

export default function OwnerDashboard() {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [userStats, setUserStats] = useState<{ totalActiveUsers: number } | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showToken, setShowToken] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, invRes, membersRes, userStatsRes] = await Promise.all([
        invitationsApi.stats(),
        invitationsApi.list(),
        usersApi.getOrgMembers(),
        usersApi.getOrgStats(),
      ]);
      setStats(statsRes.data);
      setInvitations(invRes.data);
      setMembers(membersRes.data);
      setUserStats(userStatsRes.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (data: FormData) => {
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const res = await invitationsApi.inviteUser(data.email);
      setSuccess('Convite enviado com sucesso!');
      setShowToken(res.data.token);
      reset();
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar convite');
    } finally {
      setSending(false);
    }
  };

  const activationUrl = showToken
    ? `${window.location.origin}/activate?token=${showToken}`
    : null;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Dashboard — Owner</h1>
          <p>Gestão de equipe e convites da organização</p>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{userStats?.totalActiveUsers ?? 0}</div>
              <div className="stat-label">Usuários Ativos</div>
            </div>
            <div className="stat-card secondary">
              <div className="stat-value">{stats?.totalInvitations ?? 0}</div>
              <div className="stat-label">Convites Enviados</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{stats?.acceptedInvitations ?? 0}</div>
              <div className="stat-label">Convites Aceitos</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-value">{stats?.pendingInvitations ?? 0}</div>
              <div className="stat-label">Pendentes</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Convidar Novo Usuário</div>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && (
              <div className="alert alert-success">
                <p>{success}</p>
                {activationUrl && (
                  <>
                    <p style={{ marginTop: 8, fontWeight: 600 }}>Link de ativação:</p>
                    <div className="token-box">{activationUrl}</div>
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ marginTop: 8 }}
                      onClick={() => navigator.clipboard.writeText(activationUrl)}
                    >
                      Copiar Link
                    </button>
                  </>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>E-mail do novo Usuário</label>
                <input
                  type="email"
                  placeholder="usuario@empresa.com"
                  className={errors.email ? 'error' : ''}
                  {...register('email')}
                />
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? <span className="spinner" /> : 'Enviar Convite'}
              </button>
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-title">Membros da Organização</div>
              {members.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Nenhum membro ainda</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td style={{ fontSize: '0.8rem' }}>{m.email}</td>
                        <td><span className={`badge ${m.role}`}>{m.role}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <div className="card-title">Status dos Convites</div>
              {invitations.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Nenhum convite enviado</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>E-mail</th>
                      <th>Status</th>
                      <th>Criado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontSize: '0.8rem' }}>{inv.email}</td>
                        <td><span className={`badge ${inv.status}`}>{inv.status}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{format(new Date(inv.createdAt), 'dd/MM/yy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
