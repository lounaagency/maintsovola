import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: 'terrain' | 'projet' | 'personne';
  id: number | string;
  title: string;
  subtitle: string;
  badge?: string;
}

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchData = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      const searchResults: SearchResult[] = [];

      try {
        // Recherche dans les terrains
        const { data: terrains } = await supabase
          .from('v_terrain_complet')
          .select('id_terrain, nom_terrain, surface_proposee, nom_commune, statut')
          .ilike('nom_terrain', `%${query}%`)
          .limit(5);

        if (terrains) {
          terrains.forEach(terrain => {
            searchResults.push({
              type: 'terrain',
              id: terrain.id_terrain,
              title: terrain.nom_terrain || `Terrain #${terrain.id_terrain}`,
              subtitle: `${terrain.surface_proposee}ha - ${terrain.nom_commune || 'Localisation non définie'}`,
              badge: terrain.statut ? 'Validé' : 'En attente'
            });
          });
        }

        // Recherche dans les projets
        const { data: projets } = await supabase
          .from('projet')
          .select('id_projet, titre, surface_ha, statut')
          .ilike('titre', `%${query}%`)
          .limit(5);

        if (projets) {
          projets.forEach(projet => {
            searchResults.push({
              type: 'projet',
              id: projet.id_projet,
              title: projet.titre || `Projet #${projet.id_projet}`,
              subtitle: `${projet.surface_ha}ha`,
              badge: projet.statut || 'En cours'
            });
          });
        }

        // Recherche dans les utilisateurs
        const { data: utilisateurs } = await supabase
          .from('utilisateur')
          .select('id_utilisateur, nom, prenoms, role!inner(nom_role)')
          .or(`nom.ilike.%${query}%,prenoms.ilike.%${query}%`)
          .limit(5);

        if (utilisateurs) {
          utilisateurs.forEach(user => {
            searchResults.push({
              type: 'personne',
              id: user.id_utilisateur,
              title: `${user.prenoms} ${user.nom}`,
              subtitle: user.role?.nom_role || 'Utilisateur',
              badge: user.role?.nom_role
            });
          });
        }

        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    
    switch (result.type) {
      case 'terrain':
        navigate(`/terrain?selected=${result.id}`);
        break;
      case 'projet':
        navigate(`/projects?selected=${result.id}`);
        break;
      case 'personne':
        navigate(`/profile?user=${result.id}`);
        break;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels = {
    terrain: 'Terrains',
    projet: 'Projets', 
    personne: 'Personnes'
  };

  return (
    <div className="relative flex-1 max-w-md mx-2 md:mx-4" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 bg-background border-input focus:border-ring"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Recherche...</div>
          ) : Object.keys(groupedResults).length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Aucun résultat trouvé</div>
          ) : (
            Object.entries(groupedResults).map(([type, typeResults]) => (
              <div key={type} className="border-b last:border-b-0">
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50">
                  {typeLabels[type as keyof typeof typeLabels]}
                </div>
                {typeResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.title}</div>
                      <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                    </div>
                    {result.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {result.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;