import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
  organizationName: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function Activate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = params.get('token') || '';

  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [tokenError, setTokenError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) { setTokenError('Token de convite não encontrado'); setValidating(false); return; }
    authApi.validateToken(token)
      .then(res => { setTokenInfo(res.data); setValidating(false); })
      .catch(err => {
        setTokenError(err.response?.data?.message || 'Token inválido ou expirado');
        setValidating(false);
      });
  }, [token]);

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.activate({
        token,
        name: data.name,
        password: data.password,
        organizationName: data.organizationName,
      });
      login(res.data.access_token, res.data.user);
      const role = res.data.user.role;
      if (role === 'owner') navigate('/owner');
      else navigate('/workspace');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao ativar conta');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="loading"><div className="spinner" />&nbsp; Validando convite...</div>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <h1>Intellux <span>Drive</span></h1>
          </div>
          <div className="alert alert-danger">{tokenError}</div>
          <a href="/login" className="btn btn-outline btn-full">Ir para Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Ativar <span>Conta</span></h1>
          <p>Convite para: <strong>{tokenInfo?.email}</strong></p>
          <p style={{ marginTop: 4 }}>
            <span className={`badge ${tokenInfo?.role}`}>{tokenInfo?.role}</span>
            {tokenInfo?.organization && (
              <span style={{ marginLeft: 8 }}>— {tokenInfo.organization.name}</span>
            )}
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Seu nome</label>
            <input
              type="text"
              placeholder="Nome completo"
              className={errors.name ? 'error' : ''}
              {...register('name')}
            />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>

          {tokenInfo?.role === 'owner' && (
            <div className="form-group">
              <label>Nome da Organização</label>
              <input
                type="text"
                placeholder="Nome da sua empresa"
                className={errors.organizationName ? 'error' : ''}
                {...register('organizationName')}
              />
              {errors.organizationName && <span className="field-error">{errors.organizationName.message}</span>}
            </div>
          )}

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              className={errors.password ? 'error' : ''}
              {...register('password')}
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label>Confirmar Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              className={errors.confirmPassword ? 'error' : ''}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Ativar Conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
