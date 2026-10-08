import { useEffect, useState } from 'react';
import { getCategoriesAdmin, updateCategory, deleteCategory } from '../../services/adminService';
import CategoryForm from './CategoryForm';
import AssociatedServicesSection from './AssociatedServicesSection';
import { IconEdit, IconTrash, IconChevronDown, IconGrip, IconMoreVertical } from '../icons';

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function CategoriesTab() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [formState, setFormState] = useState(null);

  const fetchCategories = async (keepSelection = true) => {
    setLoading(true);
    setError('');
    try {
      const data = await getCategoriesAdmin();
      setTree(data);
      setSelectedId((prev) => {
        if (keepSelection && prev && data.some((c) => c.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les catégories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCategory = tree.find((c) => c.id === selectedId) || null;

  const handleToggle = async (category) => {
    try {
      await updateCategory(category.id, { isActive: !category.isActive });
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour cette catégorie.');
    }
  };

  const handleDelete = async (category) => {
    try {
      await deleteCategory(category.id);
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de supprimer cette catégorie.');
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:w-64">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Menu</h3>
            <button
              type="button"
              onClick={() => setFormState({ mode: 'create-main' })}
              className="flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              + Ajouter
            </button>
          </div>

          <div className="mt-3 space-y-1">
            {tree.length === 0 && <p className="text-sm text-gray-400">Aucune catégorie.</p>}
            {tree.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium ${
                  selectedId === cat.id ? 'bg-rose-50 text-rose-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(cat.id);
                    setExpanded(true);
                  }}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${cat.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                  {cat.name}
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Actions"
                  >
                    <IconMoreVertical className="h-4 w-4" />
                  </button>
                  {openMenuId === cat.id && (
                    <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setFormState({ mode: 'edit', category: cat });
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleToggle(cat);
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {cat.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDelete(cat);
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{selectedCategory?.name || 'Catégories'}</h2>
            <button
              type="button"
              onClick={() => setFormState({ mode: 'create-main' })}
              className="flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              + Ajouter catégorie
            </button>
          </div>

          {selectedCategory && (
            <div className="mt-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <IconGrip className="h-4 w-4 text-gray-300" />
                  <IconChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? '' : '-rotate-90'}`}
                  />
                  <span className="font-semibold text-gray-900">{selectedCategory.name}</span>
                  <span className="text-xs text-gray-400">
                    {selectedCategory.children.filter((c) => c.isActive).length}/
                    {selectedCategory.children.length} Actif
                  </span>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormState({ mode: 'edit', category: selectedCategory })}
                    title="Modifier"
                    aria-label="Modifier"
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedCategory)}
                    title="Supprimer"
                    aria-label="Supprimer"
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="space-y-3 border-t border-gray-100 p-4">
                  {selectedCategory.children.length === 0 && (
                    <p className="text-sm text-gray-400">Aucune sous-catégorie.</p>
                  )}
                  {selectedCategory.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <IconGrip className="h-4 w-4 shrink-0 text-gray-300" />
                        <div>
                          <p className="font-medium text-gray-900">{child.name}</p>
                          <p className="text-xs text-gray-400">/{child.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ToggleSwitch checked={child.isActive} onChange={() => handleToggle(child)} />
                        <button
                          type="button"
                          onClick={() => setFormState({ mode: 'edit', category: child })}
                          title="Modifier"
                          aria-label="Modifier"
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(child)}
                          title="Supprimer"
                          aria-label="Supprimer"
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setFormState({ mode: 'create-sub', parentCategory: selectedCategory })}
                    className="w-full rounded-xl border-2 border-dashed border-rose-200 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    + Ajouter sous-catégorie
                  </button>

                  <div className="border-t border-gray-100 pt-4">
                    <AssociatedServicesSection
                      categoryId={selectedCategory.id}
                      services={selectedCategory.associatedServices || []}
                      onChange={fetchCategories}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {formState && (
        <CategoryForm
          category={formState.category}
          parentCategory={formState.parentCategory}
          onClose={() => setFormState(null)}
          onSuccess={() => {
            setFormState(null);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}

export default CategoriesTab;
