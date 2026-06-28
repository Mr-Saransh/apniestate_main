import { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { companiesApi, type CompanyInfo } from '@/api/companies';
import { ApiError } from '@/api/client';
import {
  Building2, Search, Plus, ArrowRight, AlertCircle,
  Users, FolderKanban, Sparkles, CheckCircle2
} from 'lucide-react';
import '@/styles/company-selection.css';

export default function CompanySelectionPage() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    companiesApi.getMyCompanies()
      .then((res) => {
        if (res.success && res.data) {
          setCompanies(res.data);
          if (res.data.length === 0) {
            setShowCreate(true);
          }
        }
      })
      .catch(() => {
        setCompanies([]);
        setShowCreate(true);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="cs-loading-page">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user already has a company, go to dashboard
  if (user?.company_id) {
    return <Navigate to="/dashboard" replace />;
  }

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    return companies.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);

  const handleSelectCompany = async () => {
    if (!selectedId) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await companiesApi.selectCompany(selectedId);
      if (res.success && res.data) {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        updateUser(res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to select company. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!companyName.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await companiesApi.createCompany(companyName.trim());
      if (res.success && res.data) {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        updateUser(res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to create company. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cs-page">
      {/* Background decoration */}
      <div className="cs-bg-gradient" />
      <div className="cs-bg-orb cs-bg-orb-1" />
      <div className="cs-bg-orb cs-bg-orb-2" />

      <div className="cs-container">
        {/* Header */}
        <div className="cs-header">
          <div className="cs-logo-icon">
            <Building2 size={32} />
          </div>
          <h1 className="cs-title">
            {showCreate && companies.length === 0
              ? 'Create Your Company'
              : 'Select Your Company'}
          </h1>
          <p className="cs-subtitle">
            {showCreate && companies.length === 0
              ? 'Set up your construction workspace to get started.'
              : `Welcome back, ${user?.name || 'User'}. Choose a workspace to continue.`}
          </p>
        </div>

        {error && (
          <div className="cs-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="cs-skeleton-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="cs-skeleton-card" />
            ))}
          </div>
        ) : !showCreate && companies.length > 0 ? (
          <>
            {/* Search */}
            <div className="cs-search-wrap">
              <Search size={18} className="cs-search-icon" />
              <input
                type="text"
                className="cs-search-input"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Company List */}
            <div className="cs-company-list">
              {filtered.length === 0 ? (
                <div className="cs-empty">
                  <p>No companies match your search.</p>
                </div>
              ) : (
                filtered.map((company) => (
                  <div
                    key={company.id}
                    className={`cs-company-card ${selectedId === company.id ? 'cs-company-card-selected' : ''}`}
                    onClick={() => setSelectedId(company.id)}
                  >
                    <div className="cs-company-avatar">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="cs-company-info">
                      <h3 className="cs-company-name">{company.name}</h3>
                      <div className="cs-company-meta">
                        {company._count && (
                          <>
                            <span className="cs-meta-item">
                              <Users size={12} />
                              {company._count.users} member{company._count.users !== 1 ? 's' : ''}
                            </span>
                            <span className="cs-meta-item">
                              <FolderKanban size={12} />
                              {company._count.projects} project{company._count.projects !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedId === company.id && (
                      <CheckCircle2 size={22} className="cs-check-icon" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="cs-actions">
              <button
                className="cs-btn-outline"
                onClick={() => setShowCreate(true)}
              >
                <Plus size={18} />
                Create New Company
              </button>
              <button
                className="cs-btn-primary"
                onClick={handleSelectCompany}
                disabled={!selectedId || submitting}
              >
                {submitting ? 'Connecting...' : 'Continue'}
                {!submitting && <ArrowRight size={18} />}
              </button>
            </div>
          </>
        ) : (
          /* Create Company Form */
          <div className="cs-create-section">
            <div className="cs-create-icon">
              <Sparkles size={28} />
            </div>

            <div className="cs-form-group">
              <label className="cs-label" htmlFor="cs-company-name">
                Company Name
              </label>
              <input
                id="cs-company-name"
                type="text"
                className="cs-input"
                placeholder="e.g. Skyline Developers"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="cs-actions">
              {companies.length > 0 && (
                <button
                  className="cs-btn-outline"
                  onClick={() => setShowCreate(false)}
                  disabled={submitting}
                >
                  Back to List
                </button>
              )}
              <button
                className="cs-btn-primary"
                onClick={handleCreateCompany}
                disabled={!companyName.trim() || submitting}
              >
                {submitting ? 'Creating...' : 'Create Company'}
                {!submitting && <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
