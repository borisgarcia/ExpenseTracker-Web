import React, { useState, useEffect } from 'react';
import type { Category } from '../../hooks/useDashboard';

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

interface CategoryManagerProps {
  categories: Category[];
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  isAddingCategory: boolean;
  onAddCategory: (e: React.FormEvent) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  newCategoryName,
  setNewCategoryName,
  isAddingCategory,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(categories.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);

  // Sync current page if categories delete/change pushes page out of bounds
  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  const paginatedCategories = categories.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return (
    <>
      {/* Add category form */}
      <section className="card-panel">
        <h3 className="panel-title">Add Category</h3>
        <form className="expense-form" onSubmit={onAddCategory}>
          <div className="form-group">
            <label htmlFor="category-name">Category Name</label>
            <input
              id="category-name"
              type="text"
              className="form-input"
              placeholder="e.g., Entertainment, Utilities"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
              disabled={isAddingCategory}
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isAddingCategory}>
            {isAddingCategory ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </section>

      {/* Manage categories list */}
      <section className="card-panel">
        <h3 className="panel-title">Manage Categories</h3>
        <div
          className="settings-category-list"
          style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}
        >
          {categories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              No categories created yet.
            </p>
          ) : (
            paginatedCategories.map((cat) => {
              const isSystem = !cat.userId;
              return (
                <div
                  key={cat.id}
                  className="category-item"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{cat.name}</span>
                  {isSystem ? (
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      System
                    </span>
                  ) : (
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f43f5e',
                        cursor: 'pointer',
                        padding: '4px',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Delete category"
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pagination-controls" style={{ marginTop: '16px', paddingTop: '12px' }}>
          <button
            disabled={safePage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="page-indicator" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Page {safePage} of {totalPages}
          </span>
          <button
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      </section>
    </>
  );
};
