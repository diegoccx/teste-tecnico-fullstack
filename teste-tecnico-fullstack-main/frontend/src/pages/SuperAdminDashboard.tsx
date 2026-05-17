import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../components/Layout';
import { invitationsApi } from '../services/api';
import { Invitation, SuperAdminStats } from '../types';
import { format } from 'date-fns';

const schema = z.object({ email: z.string().email('E-mail inválido') });
type FormData = z.infer<typeof schema>;

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, invRes] = await Promise.all([
        invitationsApi.stats(),
        invitationsApi.list(),
      ]);
      setStats(statsRes.data);
      setInvitations(invRes.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (data: FormData) => {
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const res = await invitationsApi.inviteOwner(data.email);
      setSuccess(`Convite enviado! Token: ${res.data.token}`);
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
          <h1>Dashboard — Super Admin</h1>
          <p>Gerenciamento global da plataforma Intellux Drive</p>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats?.totalOrganizations ?? 0}</div>
              <div className="stat-label">Organizações Ativas</div>
            </div>
            <div className="stat-card secondary">
              <div className="stat-value">{stats?.totalOwnerInvitations ?? 0}</div>
              <div className="stat-label">Total de Convites</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{stats?.acceptedOwnerInvitations ?? 0}</div>
              <div className="stat-label">Convites Aceitos</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-value">{stats?.acceptanceRate ?? 0}%</div>
              <div className="stat-label">Taxa de Aceite</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Convidar Novo Owner</div>
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
                <label>E-mail do novo Owner</label>
                <input
                  type="email"
                  placeholder="owner@empresa.com"
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

          <div className="card">
            <div className="card-title">Convites de Owner Enviados</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>E-mail</th>
                    <th>Status</th>
                    <th>Expira em</th>
                    <th>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>Nenhum convite enviado</td></tr>
                  ) : invitations.map(inv => (
                    <tr key={inv.id}>
                      <td>{inv.email}</td>
                      <td><span className={`badge ${inv.status}`}>{inv.status}</span></td>
                      <td>{format(new Date(inv.expiresAt), 'dd/MM/yyyy HH:mm')}</td>
                      <td>{format(new Date(inv.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
