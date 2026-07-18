import React, { useMemo, useState } from 'react';
import { getItemUrl } from '../../helpers';
import { CraftCategory, CraftRecipe } from './types';
import { getItemLabel } from './craftingHelpers';
import { FALLBACK_CATEGORY_ID, SortMode } from './config';
import Dropdown, { DropdownOption } from './Dropdown';

interface Props {
  recipes: CraftRecipe[];
  categories: CraftCategory[];
  selectedId: string | null;
  onSelect: (recipe: CraftRecipe) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  isCraftable: (recipe: CraftRecipe) => boolean;
}

const CraftingCodex: React.FC<Props> = ({
  recipes,
  categories,
  selectedId,
  onSelect,
  favorites,
  onToggleFavorite,
  isCraftable,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortMode>('category');
  const [favOnly, setFavOnly] = useState(false);

  const categoryMap = useMemo(() => {
    const map: Record<string, CraftCategory> = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const catOf = (recipe: CraftRecipe) =>
    categoryMap[recipe.category] ? recipe.category : FALLBACK_CATEGORY_ID;

  const categoryOptions: DropdownOption[] = useMemo(
    () => [{ value: 'all', label: 'All' }, ...categories.map((c) => ({ value: c.id, label: c.label }))],
    [categories]
  );

  const labelOf = (recipe: CraftRecipe) => recipe.label ?? getItemLabel(recipe.result);

  // --- filter ---
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return recipes.filter((r) => {
      if (favOnly && !favorites.has(r.id)) return false;
      if (categoryFilter !== 'all' && catOf(r) !== categoryFilter) return false;
      if (term && !labelOf(r).toLowerCase().includes(term) && !r.result.toLowerCase().includes(term))
        return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, search, categoryFilter, favOnly, favorites]);

  // --- group by category, respecting the chosen sort ---
  const groups = useMemo(() => {
    const sortByName = (a: CraftRecipe, b: CraftRecipe) =>
      labelOf(a).localeCompare(labelOf(b));

    const byCategory: Record<string, CraftRecipe[]> = {};
    for (const r of filtered) {
      const id = catOf(r);
      (byCategory[id] ??= []).push(r);
    }

    const orderedCats = categories
      .filter((c) => byCategory[c.id]?.length)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return orderedCats.map((cat) => {
      let items = byCategory[cat.id];
      if (sort === 'name') items = [...items].sort(sortByName);
      else if (sort === 'craftable')
        items = [...items].sort(
          (a, b) => Number(isCraftable(b)) - Number(isCraftable(a)) || sortByName(a, b)
        );
      return { cat, items };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, categories, sort]);

  return (
    <div className="craft-codex">
      <div className="craft-codex-header">
        <h2>Crafting Codex</h2>
        <button
          className={`craft-fav-toggle ${favOnly ? 'active' : ''}`}
          title="Show favorites only"
          onClick={() => setFavOnly((v) => !v)}
        >
          ★
        </button>
      </div>

      <div className="craft-codex-controls">
        <Dropdown
          className="craft-codex-filter"
          title="Filter by category"
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
        />

        <input
          className="craft-codex-search"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="craft-codex-body">
        {groups.length === 0 && <div className="craft-codex-empty">No recipes found</div>}

        {groups.map(({ cat, items }) => (
          <div key={cat.id} className="craft-codex-category">
            <div className="craft-codex-category-title">{cat.label}</div>

            <div className="craft-codex-grid">
              {items.map((recipe) => {
                const craftable = isCraftable(recipe);
                return (
                  <button
                    key={recipe.id}
                    className={`craft-codex-card ${selectedId === recipe.id ? 'selected' : ''} ${
                      craftable ? '' : 'locked'
                    }`}
                    onClick={() => onSelect(recipe)}
                    title={recipe.description ?? labelOf(recipe)}
                  >
                    <span
                      className={`craft-codex-card-fav ${favorites.has(recipe.id) ? 'on' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(recipe.id);
                      }}
                    >
                      ★
                    </span>
                    <div
                      className="craft-codex-card-img"
                      style={{ backgroundImage: `url(${getItemUrl(recipe.result)})` }}
                    />
                    <div className="craft-codex-card-label">{labelOf(recipe)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CraftingCodex;
