
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, BookOpen, Wrench, GraduationCap, Download } from 'lucide-react';
import { useTechnicalResources } from '@/hooks/useTechnicalResources';
import { TechnicalResource } from '@/types/technicien';

const TechnicalResourcesLibrary: React.FC = () => {
  const { resources, loading, filterByType, filterByCulture, searchResources } = useTechnicalResources();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TechnicalResource['type'] | 'all'>('all');
  const [selectedCulture, setSelectedCulture] = useState<string>('all');

  const getTypeIcon = (type: TechnicalResource['type']) => {
    switch (type) {
      case 'fiche_technique': return <FileText size={16} />;
      case 'guide_pratique': return <BookOpen size={16} />;
      case 'procedure': return <Wrench size={16} />;
      case 'formation': return <GraduationCap size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getTypeColor = (type: TechnicalResource['type']) => {
    switch (type) {
      case 'fiche_technique': return 'bg-blue-100 text-blue-800';
      case 'guide_pratique': return 'bg-green-100 text-green-800';
      case 'procedure': return 'bg-orange-100 text-orange-800';
      case 'formation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResources = React.useMemo(() => {
    let filtered = resources;

    if (searchQuery) {
      filtered = searchResources(searchQuery);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(r => r.type === selectedType);
    }

    if (selectedCulture !== 'all') {
      filtered = filtered.filter(r => r.culture === selectedCulture);
    }

    return filtered;
  }, [resources, searchQuery, selectedType, selectedCulture, searchResources]);

  const availableCultures = React.useMemo(() => {
    const cultures = resources
      .filter(r => r.culture)
      .map(r => r.culture!)
      .filter((culture, index, self) => self.indexOf(culture) === index);
    return cultures;
  }, [resources]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ressources techniques</h3>
        <Badge variant="outline">{filteredResources.length} ressource(s)</Badge>
      </div>

      {/* Filtres */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as TechnicalResource['type'] | 'all')}
          className="border border-input bg-background px-3 py-2 rounded-md text-sm"
        >
          <option value="all">Tous les types</option>
          <option value="fiche_technique">Fiches techniques</option>
          <option value="guide_pratique">Guides pratiques</option>
          <option value="procedure">Procédures</option>
          <option value="formation">Formations</option>
        </select>

        <select
          value={selectedCulture}
          onChange={(e) => setSelectedCulture(e.target.value)}
          className="border border-input bg-background px-3 py-2 rounded-md text-sm"
        >
          <option value="all">Toutes les cultures</option>
          {availableCultures.map(culture => (
            <option key={culture} value={culture}>{culture}</option>
          ))}
        </select>
      </div>

      {/* Liste des ressources */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((resource) => (
          <Card key={resource.id_ressource} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(resource.type)}
                  <CardTitle className="text-sm">{resource.titre}</CardTitle>
                </div>
                <Badge className={getTypeColor(resource.type)}>
                  {resource.type.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {resource.culture && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Culture:</span>
                  <Badge variant="outline">{resource.culture}</Badge>
                </div>
              )}

              <p className="text-sm text-muted-foreground line-clamp-3">
                {resource.contenu}
              </p>

              <div className="flex flex-wrap gap-1">
                {resource.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(resource.date_creation).toLocaleDateString()}
                </span>
                <Button size="sm" variant="outline">
                  <Download size={14} className="mr-1" />
                  Consulter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune ressource trouvée</p>
        </div>
      )}
    </div>
  );
};

export default TechnicalResourcesLibrary;
