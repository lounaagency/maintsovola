
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Filter, X } from 'lucide-react';

interface PaymentFiltersProps {
  onFilterChange: (filters: PaymentFilterState) => void;
  onExport: (type: 'csv' | 'pdf') => void;
}

export interface PaymentFilterState {
  dateRange?: string;
  method?: string;
  status?: string;
  project?: string;
}

const PaymentFilters: React.FC<PaymentFiltersProps> = ({ onFilterChange, onExport }) => {
  const [filters, setFilters] = useState<PaymentFilterState>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof PaymentFilterState, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filtres et Actions</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter size={16} />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('csv')}
              className="gap-2"
            >
              <Download size={16} />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('pdf')}
              className="gap-2"
            >
              <Download size={16} />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select 
                value={filters.dateRange || ''} 
                onValueChange={(value) => handleFilterChange('dateRange', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les périodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 derniers jours</SelectItem>
                  <SelectItem value="30days">30 derniers jours</SelectItem>
                  <SelectItem value="3months">3 derniers mois</SelectItem>
                  <SelectItem value="6months">6 derniers mois</SelectItem>
                  <SelectItem value="1year">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Méthode</label>
              <Select 
                value={filters.method || ''} 
                onValueChange={(value) => handleFilterChange('method', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les méthodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
                  <SelectItem value="Chèque de banque">Chèque</SelectItem>
                  <SelectItem value="Liquide">Liquide</SelectItem>
                  <SelectItem value="Virement">Virement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select 
                value={filters.status || ''} 
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="effectué">Effectué</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="échoué">Échoué</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="gap-2"
                disabled={activeFiltersCount === 0}
              >
                <X size={16} />
                Effacer
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default PaymentFilters;
