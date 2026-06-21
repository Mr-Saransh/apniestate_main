import { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, Plus } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { inventoryApi, type InventoryItem } from '@/api/inventory';

const categoryFilters = ['All', 'Material', 'Plumbing', 'Electrical', 'Finishing'];

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await inventoryApi.getAll();
        if (res.data) {
          setInventory(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || item.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const lowStock = inventory.filter(i => i.quantity <= i.minQuantity).length;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            {inventory.length} items · {lowStock > 0 && (
              <span style={{ color: 'var(--color-danger)', fontWeight: 'var(--font-weight-semibold)' }}>
                {lowStock} low stock
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="search-inventory"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-5)' }}>
        {categoryFilters.map((filter) => (
          <button
            key={filter}
            className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Inventory List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={36} />}
          title="No items found"
          description="Adjust your search or filter"
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.map((item) => {
            const isLow = item.quantity <= item.minQuantity;
            return (
              <div key={item.id} className="list-card" id={`inventory-${item.id}`}>
                <div
                  className="list-card-icon"
                  style={{
                    background: isLow ? 'var(--color-danger-bg)' : 'var(--color-primary-50)',
                    color: isLow ? 'var(--color-danger)' : 'var(--color-primary)',
                  }}
                >
                  {isLow ? <AlertTriangle size={20} /> : <Package size={20} />}
                </div>
                <div className="list-card-content">
                  <div className="list-card-title">{item.name}</div>
                  <div className="list-card-subtitle">{item.site?.name || 'Unknown Site'} · {item.category}</div>
                </div>
                <div className="list-card-meta">
                  <div className="list-card-value" style={{
                    color: isLow ? 'var(--color-danger)' : 'var(--color-text)',
                  }}>
                    {item.quantity}
                  </div>
                  <div className="list-card-date">{item.unit}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button className="fab animate-pop-in" aria-label="Request Material" id="fab-request-material">
        <Plus size={24} />
      </button>
    </div>
  );
}
