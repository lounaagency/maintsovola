import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useCoutReferences, useCulturesAndJalons, CoutReference } from '@/hooks/useCoutReferences';

export const CoutReferencesAdmin = () => {
  const { couts, loading, createCout, updateCout, deleteCout } = useCoutReferences();
  const { cultures, jalons } = useCulturesAndJalons();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCulture, setSelectedCulture] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCout, setEditingCout] = useState<CoutReference | null>(null);

  const [formData, setFormData] = useState({
    id_culture: '',
    id_jalon_agricole: '',
    type_depense: '',
    montant_par_hectare: '',
    unite: 'Ar/ha'
  });

  const filteredCouts = couts.filter(cout => {
    const matchesSearch = 
      cout.nom_culture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cout.nom_jalon?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cout.type_depense.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCulture = !selectedCulture || cout.id_culture.toString() === selectedCulture;
    
    return matchesSearch && matchesCulture;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id_culture || !formData.id_jalon_agricole || !formData.type_depense || !formData.montant_par_hectare) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const coutData = {
        id_culture: parseInt(formData.id_culture),
        id_jalon_agricole: parseInt(formData.id_jalon_agricole),
        type_depense: formData.type_depense,
        montant_par_hectare: parseFloat(formData.montant_par_hectare),
        unite: formData.unite
      };

      if (editingCout) {
        await updateCout(editingCout.id_cout_jalon_reference, coutData);
        toast.success('Coût de référence mis à jour');
      } else {
        await createCout(coutData);
        toast.success('Coût de référence créé');
      }

      setIsDialogOpen(false);
      setEditingCout(null);
      setFormData({
        id_culture: '',
        id_jalon_agricole: '',
        type_depense: '',
        montant_par_hectare: '',
        unite: 'Ar/ha'
      });
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (cout: CoutReference) => {
    setEditingCout(cout);
    setFormData({
      id_culture: cout.id_culture.toString(),
      id_jalon_agricole: cout.id_jalon_agricole.toString(),
      type_depense: cout.type_depense,
      montant_par_hectare: cout.montant_par_hectare.toString(),
      unite: cout.unite
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce coût de référence ?')) {
      try {
        await deleteCout(id);
        toast.success('Coût de référence supprimé');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-MG').format(amount);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Gestion des Coûts de Référence
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCout(null);
                  setFormData({
                    id_culture: '',
                    id_jalon_agricole: '',
                    type_depense: '',
                    montant_par_hectare: '',
                    unite: 'Ar/ha'
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau coût
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCout ? 'Modifier le coût' : 'Nouveau coût de référence'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Culture</Label>
                    <Select value={formData.id_culture} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, id_culture: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une culture" />
                      </SelectTrigger>
                      <SelectContent>
                        {cultures.map(culture => (
                          <SelectItem key={culture.id_culture} value={culture.id_culture.toString()}>
                            {culture.nom_culture}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Jalon agricole</Label>
                    <Select value={formData.id_jalon_agricole} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, id_jalon_agricole: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un jalon" />
                      </SelectTrigger>
                      <SelectContent>
                        {jalons.map(jalon => (
                          <SelectItem key={jalon.id_jalon_agricole} value={jalon.id_jalon_agricole.toString()}>
                            {jalon.nom_jalon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Type de dépense</Label>
                    <Input
                      value={formData.type_depense}
                      onChange={(e) => setFormData(prev => ({ ...prev, type_depense: e.target.value }))}
                      placeholder="Ex: Main d'œuvre, Semences, Engrais..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Montant par hectare</Label>
                      <Input
                        type="number"
                        value={formData.montant_par_hectare}
                        onChange={(e) => setFormData(prev => ({ ...prev, montant_par_hectare: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Unité</Label>
                      <Select value={formData.unite} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, unite: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ar/ha">Ar/ha</SelectItem>
                          <SelectItem value="USD/ha">USD/ha</SelectItem>
                          <SelectItem value="EUR/ha">EUR/ha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingCout ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par culture, jalon ou dépense..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedCulture} onValueChange={setSelectedCulture}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les cultures" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les cultures</SelectItem>
                  {cultures.map(culture => (
                    <SelectItem key={culture.id_culture} value={culture.id_culture.toString()}>
                      {culture.nom_culture}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tableau des coûts */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Culture</TableHead>
                  <TableHead>Jalon</TableHead>
                  <TableHead>Type de dépense</TableHead>
                  <TableHead>Montant/ha</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCouts.map((cout) => (
                  <TableRow key={cout.id_cout_jalon_reference}>
                    <TableCell>
                      <Badge variant="secondary">{cout.nom_culture}</Badge>
                    </TableCell>
                    <TableCell>{cout.nom_jalon}</TableCell>
                    <TableCell>{cout.type_depense}</TableCell>
                    <TableCell className="font-mono">
                      {formatAmount(cout.montant_par_hectare)}
                    </TableCell>
                    <TableCell>{cout.unite}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cout)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(cout.id_cout_jalon_reference)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCouts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucun coût de référence trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};