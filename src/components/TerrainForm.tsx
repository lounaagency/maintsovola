
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TerrainData, RegionData, DistrictData, CommuneData } from "@/types/terrain";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";

// Fix Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Add custom geodesic area calculation utility
const GeometryUtil = {
  geodesicArea: function(latLngs: L.LatLng[]) {
    let area = 0;
    if (latLngs.length > 2) {
      const R = 6371000; // Earth radius in meters
      let p1, p2;
      for (let i = 0; i < latLngs.length; i++) {
        p1 = latLngs[i];
        p2 = latLngs[(i + 1) % latLngs.length];
        area += ((p2.lng - p1.lng) * Math.PI / 180) * 
                (2 + Math.sin(p1.lat * Math.PI / 180) + 
                 Math.sin(p2.lat * Math.PI / 180));
      }
      area = Math.abs(area * R * R / 2);
    }
    return area;
  }
};

interface TerrainFormProps {
  initialData?: TerrainData;
  onSubmitSuccess: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  userId?: string;
  userRole?: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
}

const TerrainForm: React.FC<TerrainFormProps> = ({
  initialData,
  onSubmitSuccess,
  onCancel,
  isEditing = false,
  userId,
  userRole,
  agriculteurs = [],
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<DistrictData[]>([]);
  const [filteredCommunes, setFilteredCommunes] = useState<CommuneData[]>([]);
  const [selectedAgriculteur, setSelectedAgriculteur] = useState<string>("");
  const [geomPolygon, setGeomPolygon] = useState<GeoJSON.Feature | null>(null);
  const mapRef = useRef<any>(null);
  const featureGroupRef = useRef<any>(null);
  
  const [terrainData, setTerrainData] = useState<TerrainData>({
    surface_proposee: 0,
    id_region: null,
    nom_terrain: "",
    id_district: null,
    id_commune: null,
    acces_eau: false,
    acces_route: false
  });

  useEffect(() => {
    if (initialData) {
      setTerrainData({
        ...initialData,
        nom_terrain: initialData.nom_terrain || "",
      });
      
      if (userRole === 'superviseur' || userRole === 'technicien') {
        setSelectedAgriculteur(initialData.id_tantsaha || "");
      }
    }
  }, [initialData, userRole]);

  useEffect(() => {
    fetchRegions();
    fetchDistricts();
    fetchCommunes();
  }, []);

  useEffect(() => {
    if (terrainData.id_region) {
      setFilteredDistricts(
        districts.filter((district) => district.id_region === terrainData.id_region)
      );
    } else {
      setFilteredDistricts([]);
    }
  }, [terrainData.id_region, districts]);

  useEffect(() => {
    if (terrainData.id_district) {
      setFilteredCommunes(
        communes.filter((commune) => commune.id_district === terrainData.id_district)
      );
    } else {
      setFilteredCommunes([]);
    }
  }, [terrainData.id_district, communes]);

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('region')
        .select('*')
        .order('nom_region');
      
      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const { data, error } = await supabase
        .from('district')
        .select('*')
        .order('nom_district');
      
      if (error) throw error;
      setDistricts(data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchCommunes = async () => {
    try {
      const { data, error } = await supabase
        .from('commune')
        .select('*')
        .order('nom_commune');
      
      if (error) throw error;
      setCommunes(data || []);
    } catch (error) {
      console.error('Error fetching communes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un terrain",
        variant: "destructive"
      });
      return;
    }

    if (!terrainData.id_region || !terrainData.nom_terrain || !terrainData.id_district || !terrainData.id_commune || terrainData.surface_proposee <= 0) {
      toast({
        title: "Champs manquants",
        description: "Tous les champs sont obligatoires et la surface doit être supérieure à 0",
        variant: "destructive"
      });
      return;
    }

    if ((userRole === 'superviseur' || userRole === 'technicien') && !selectedAgriculteur) {
      toast({
        title: "Champ manquant",
        description: "Veuillez sélectionner un agriculteur propriétaire du terrain",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert GeoJSON to PostGIS format if available
      let geomValue = null;
      if (geomPolygon && geomPolygon.geometry) {
        // Convert GeoJSON to WKT format
        if (geomPolygon.geometry.type === 'Polygon') {
          const coordinates = (geomPolygon.geometry as GeoJSON.Polygon).coordinates[0];
          
          if (coordinates && coordinates.length > 0) {
            const wktPoints = coordinates.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(',');
            geomValue = `POLYGON((${wktPoints}))`;
          }
        }
      }
      
      const terrainId = terrainData.id_terrain;
      const terrainOwner = (userRole === 'agriculteur') ? userId : selectedAgriculteur;
      
      if (isEditing && terrainId) {
        // Update existing terrain
        const { error } = await supabase
          .from('terrain')
          .update({
            id_region: terrainData.id_region,
            id_district: terrainData.id_district,
            id_commune: terrainData.id_commune,
            surface_proposee: terrainData.surface_proposee,
            acces_eau: terrainData.acces_eau,
            acces_route: terrainData.acces_route,
            nom_terrain: terrainData.nom_terrain,
            ...(geomValue ? { geom: geomValue } : {})
          })
          .eq('id_terrain', terrainId);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Terrain mis à jour avec succès",
        });
      } else {
        // Create new terrain
        const { error } = await supabase
          .from('terrain')
          .insert({
            id_tantsaha: terrainOwner,
            id_region: terrainData.id_region,
            id_district: terrainData.id_district,
            id_commune: terrainData.id_commune,
            surface_proposee: terrainData.surface_proposee,
            surface_validee: 0,
            acces_eau: terrainData.acces_eau,
            acces_route: terrainData.acces_route,
            nom_terrain: terrainData.nom_terrain,
            statut: false, // Toujours pas validé par défaut
            ...(geomValue ? { geom: geomValue } : {})
          });

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Terrain enregistré avec succès",
        });
      }
      
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting terrain:', error);
      toast({
        title: "Erreur",
        description: isEditing ? "Impossible de mettre à jour le terrain" : "Impossible d'enregistrer le terrain",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatedPolygon = (e: any) => {
    const { layerType, layer } = e;
    
    if (layerType === 'polygon') {
      // Convert Leaflet layer to GeoJSON
      const geoJson = layer.toGeoJSON();
      setGeomPolygon(geoJson);
      
      // Calculate approximate area in hectares
      const latlngs = layer.getLatLngs()[0];
      let area = GeometryUtil.geodesicArea(latlngs);
      const areaInHectares = area / 10000; // Convert square meters to hectares
      
      // Update surface field with calculated area
      setTerrainData(prev => ({
        ...prev,
        surface_proposee: parseFloat(areaInHectares.toFixed(2))
      }));
    }
  };

  const handleEditedPolygon = (e: any) => {
    const { layers } = e;
    
    if (layers && layers.getLayers().length > 0) {
      const layer = layers.getLayers()[0];
      const geoJson = layer.toGeoJSON();
      setGeomPolygon(geoJson);
      
      // Update area calculation
      const latlngs = layer.getLatLngs()[0];
      let area = GeometryUtil.geodesicArea(latlngs);
      const areaInHectares = area / 10000;
      
      setTerrainData(prev => ({
        ...prev,
        surface_proposee: parseFloat(areaInHectares.toFixed(2))
      }));
    }
  };

  const handleDeletedPolygon = () => {
    setGeomPolygon(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Modifier le terrain" : "Nouvel enregistrement de terrain"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {(userRole === 'superviseur' || userRole === 'technicien') && (
            <div className="space-y-2">
              <Label htmlFor="agriculteur">Agriculteur propriétaire</Label>
              <Select 
                value={selectedAgriculteur} 
                onValueChange={setSelectedAgriculteur}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un agriculteur" />
                </SelectTrigger>
                <SelectContent>
                  {agriculteurs.map(agriculteur => (
                    <SelectItem key={agriculteur.id_utilisateur} value={agriculteur.id_utilisateur}>
                      {agriculteur.nom} {agriculteur.prenoms || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom_terrain">Nom du terrain</Label>
              <Input 
                id="nom_terrain"
                value={terrainData.nom_terrain}  
                onChange={(e) => setTerrainData({
                  ...terrainData,
                  nom_terrain: e.target.value
                })}
                placeholder="Nom du terrain"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surface">Surface proposée (hectares)</Label>
              <Input 
                id="surface"
                type="number" 
                step="0.01"
                min="0.01"
                value={terrainData.surface_proposee || ''} 
                onChange={(e) => setTerrainData({
                  ...terrainData,
                  surface_proposee: parseFloat(e.target.value)
                })}
                placeholder="Surface en hectares"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Région</Label>
              <Select 
                value={terrainData.id_region?.toString() || ""} 
                onValueChange={(value) => {
                  setTerrainData({
                    ...terrainData,
                    id_region: parseInt(value),
                    id_district: null,
                    id_commune: null
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region.id_region} value={region.id_region.toString()}>
                      {region.nom_region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Select 
                value={terrainData.id_district?.toString() || ""} 
                onValueChange={(value) => {
                  setTerrainData({
                    ...terrainData,
                    id_district: parseInt(value),
                    id_commune: null
                  });
                }}
                disabled={!terrainData.id_region}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un district" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDistricts.map(district => (
                    <SelectItem key={district.id_district} value={district.id_district.toString()}>
                      {district.nom_district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commune">Commune</Label>
              <Select 
                value={terrainData.id_commune?.toString() || ""} 
                onValueChange={(value) => {
                  setTerrainData({
                    ...terrainData,
                    id_commune: parseInt(value)
                  });
                }}
                disabled={!terrainData.id_district}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une commune" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCommunes.map(commune => (
                    <SelectItem key={commune.id_commune} value={commune.id_commune.toString()}>
                      {commune.nom_commune}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="acces_eau"
                checked={terrainData.acces_eau || false}
                onChange={(e) => setTerrainData({
                  ...terrainData,
                  acces_eau: e.target.checked
                })}
                className="form-checkbox h-5 w-5 text-primary"
              />
              <Label htmlFor="acces_eau">Accès à l'eau</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="acces_route"
                checked={terrainData.acces_route || false}
                onChange={(e) => setTerrainData({
                  ...terrainData,
                  acces_route: e.target.checked
                })}
                className="form-checkbox h-5 w-5 text-primary"
              />
              <Label htmlFor="acces_route">Accès routier</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Délimitation du terrain</Label>
            <div className="h-[400px] border rounded-md overflow-hidden">
              <MapContainer 
                center={[-18.8792, 47.5079]} // Center on Madagascar
                zoom={6} 
                ref={mapRef}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FeatureGroup ref={featureGroupRef}>
                  <EditControl
                    position="topright"
                    onCreated={handleCreatedPolygon}
                    onEdited={handleEditedPolygon}
                    onDeleted={handleDeletedPolygon}
                    draw={{
                      rectangle: false,
                      circle: false,
                      circlemarker: false,
                      marker: false,
                      polyline: false,
                    }}
                  />
                </FeatureGroup>
              </MapContainer>
            </div>
            <p className="text-sm text-muted-foreground">Dessinez le contour de votre terrain sur la carte pour calculer automatiquement la surface.</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Mise à jour..." : "Enregistrement..."}
              </>
            ) : (isEditing ? "Mettre à jour" : "Enregistrer le terrain")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TerrainForm;
