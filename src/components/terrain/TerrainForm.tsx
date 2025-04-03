
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { TerrainFormData, convertFormDataToTerrainData } from "@/types/terrainForm";
import { TerrainData, RegionData, DistrictData, CommuneData } from "@/types/terrain";
import { Loader2, Trash2, Map } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, FeatureGroup, Polygon } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Import LeafletGeometryUtil for area calculations
import "@elfalem/leaflet-curve";
import "leaflet-geometryutil";

// Import the type for agriculteurs
interface Agriculteur {
  id_utilisateur: string;
  nom: string;
  prenoms?: string;
}

interface TerrainFormProps {
  initialData?: TerrainData;
  onSubmitSuccess: () => void;
  onCancel: () => void;
  userId: string;
  userRole?: string;
  agriculteurs?: Agriculteur[];
}

// Define the validation schema
const schema = yup.object({
  nom_terrain: yup.string().required("Le nom du terrain est obligatoire"),
  surface_proposee: yup.number().required("La surface est obligatoire").positive("La surface doit être positive"),
  id_region: yup.string().required("La région est obligatoire"),
  id_district: yup.string().required("Le district est obligatoire"),
  id_commune: yup.string().required("La commune est obligatoire"),
  acces_eau: yup.boolean().default(false),
  acces_route: yup.boolean().default(false),
  id_tantsaha: yup.string().optional(),
}).required();

const TerrainForm: React.FC<TerrainFormProps> = ({
  initialData,
  onSubmitSuccess,
  onCancel,
  userId,
  userRole,
  agriculteurs
}) => {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<DistrictData[]>([]);
  const [filteredCommunes, setFilteredCommunes] = useState<CommuneData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState<number[][]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  const form = useForm<TerrainFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: initialData ? {
      id_terrain: initialData.id_terrain,
      nom_terrain: initialData.nom_terrain || "",
      surface_proposee: initialData.surface_proposee,
      id_region: initialData.id_region?.toString() || "",
      id_district: initialData.id_district?.toString() || "",
      id_commune: initialData.id_commune?.toString() || "",
      acces_eau: initialData.acces_eau || false,
      acces_route: initialData.acces_route || false,
      id_tantsaha: initialData.id_tantsaha,
    } : {
      nom_terrain: "",
      surface_proposee: 1,
      id_region: "",
      id_district: "",
      id_commune: "",
      acces_eau: false,
      acces_route: false,
      id_tantsaha: userRole === 'simple' ? userId : undefined,
    }
  });
  
  const watchRegion = form.watch("id_region");
  const watchDistrict = form.watch("id_district");

  // Extraire les coordonnées de polygone existantes lors de l'initialisation
  useEffect(() => {
    if (initialData?.geom && initialData.geom.type === 'Polygon' && initialData.geom.coordinates && initialData.geom.coordinates[0]) {
      setPolygonCoordinates(initialData.geom.coordinates[0]);
      
      // Centrer et zoomer sur le terrain quand les coordonnées sont disponibles
      // et que la carte est initialisée
      if (mapInitialized && mapRef.current && polygonCoordinates.length > 0) {
        const bounds = new L.LatLngBounds(polygonCoordinates.map(coord => [coord[1], coord[0]]));
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        
        // Recréer le polygone sur la carte
        if (featureGroupRef.current) {
          featureGroupRef.current.clearLayers();
          const polygon = L.polygon(polygonCoordinates.map(coord => [coord[1], coord[0]]));
          featureGroupRef.current.addLayer(polygon);
        }
      }
    }
  }, [initialData, mapInitialized]);

  // Effectuer le centrage quand la carte est initialisée
  useEffect(() => {
    if (mapInitialized && mapRef.current && polygonCoordinates.length > 0) {
      const bounds = new L.LatLngBounds(polygonCoordinates.map(coord => [coord[1], coord[0]]));
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [mapInitialized, polygonCoordinates]);

  // Fetch regions, districts and communes
  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase.from("region").select("*").order("nom_region");
      if (error) {
        console.error("Error fetching regions:", error);
        return;
      }
      setRegions(data || []);
    };

    const fetchDistricts = async () => {
      const { data, error } = await supabase.from("district").select("*").order("nom_district");
      if (error) {
        console.error("Error fetching districts:", error);
        return;
      }
      setDistricts(data || []);
    };

    const fetchCommunes = async () => {
      const { data, error } = await supabase.from("commune").select("*").order("nom_commune");
      if (error) {
        console.error("Error fetching communes:", error);
        return;
      }
      setCommunes(data || []);
    };

    fetchRegions();
    fetchDistricts();
    fetchCommunes();
  }, []);

  // Filter districts by region
  useEffect(() => {
    if (watchRegion) {
      const regionId = parseInt(watchRegion);
      const filtered = districts.filter(d => d.id_region === regionId);
      setFilteredDistricts(filtered);
      
      if (filtered.length > 0 && !filtered.find(d => d.id_district === parseInt(watchDistrict))) {
        form.setValue("id_district", filtered[0].id_district.toString());
      }
    } else {
      setFilteredDistricts([]);
      form.setValue("id_district", "");
    }
  }, [watchRegion, districts, form, watchDistrict]);

  // Filter communes by district
  useEffect(() => {
    if (watchDistrict) {
      const districtId = parseInt(watchDistrict);
      const filtered = communes.filter(c => c.id_district === districtId);
      setFilteredCommunes(filtered);
      
      if (filtered.length > 0 && !filtered.find(c => c.id_commune === parseInt(form.getValues("id_commune")))) {
        form.setValue("id_commune", filtered[0].id_commune.toString());
      }
    } else {
      setFilteredCommunes([]);
      form.setValue("id_commune", "");
    }
  }, [watchDistrict, communes, form]);

  // Calcul de la surface en hectares
  const calculateAreaInHectares = (coords: number[][]) => {
    if (!coords || coords.length < 3) return 0;

    // Convertir les coordonnées en objets LatLng de Leaflet
    const latLngs = coords.map(coord => new L.LatLng(coord[1], coord[0]));
    
    // Créer un polygone Leaflet pour calculer l'aire
    const polygon = new L.Polygon(latLngs);
    
    // Obtenir l'aire en mètres carrés avec GeometryUtil
    const areaInSquareMeters = L.GeometryUtil.geodesicArea(polygon.getLatLngs()[0] as L.LatLng[]);
    
    // Convertir en hectares (1 hectare = 10000 m²)
    return areaInSquareMeters / 10000;
  };

  // Mettre à jour la surface proposée lorsque le polygone change
  useEffect(() => {
    if (polygonCoordinates && polygonCoordinates.length >= 3) {
      const area = calculateAreaInHectares(polygonCoordinates);
      form.setValue("surface_proposee", parseFloat(area.toFixed(2)));
    }
  }, [polygonCoordinates, form]);

  const onSubmit = async (data: TerrainFormData) => {
    setIsSubmitting(true);
    try {
      // Ajouter les coordonnées du polygone au formulaire
      data.geom_coordinates = polygonCoordinates;
      
      // Determine the owner of the terrain
      const terrainOwnerId = userRole === 'simple' ? userId :
                             userRole === 'technicien' || userRole === 'superviseur' ?
                             (data.id_tantsaha || userId) : userId;
      
      const terrainData = convertFormDataToTerrainData(data);
      terrainData.id_tantsaha = terrainOwnerId;
      terrainData.statut = false; // New terrains are always unvalidated
      
      if (initialData?.id_terrain) {
        // Update existing terrain
        const { error } = await supabase
          .from('terrain')
          .update(terrainData)
          .eq('id_terrain', initialData.id_terrain);
          
        if (error) throw error;
        
        toast.success("Terrain modifié avec succès");
      } else {
        // Create new terrain
        const { error } = await supabase
          .from('terrain')
          .insert([terrainData]);
          
        if (error) throw error;
        
        // Fetch supervisors for the region
        const { data: supervisors } = await supabase
          .from('utilisateur')
          .select('id_utilisateur')
          .eq('id_role', 4) // 4 = superviseur
          .eq('role', 'superviseur');
          
        if (supervisors && supervisors.length > 0) {
          // Notify supervisors
          const notifications = supervisors.map(supervisor => ({
            id_expediteur: userId,
            id_destinataire: supervisor.id_utilisateur,
            titre: "Nouveau terrain",
            message: `Un nouveau terrain '${data.nom_terrain}' a été ajouté en attente de validation`,
            type: "info",
            entity_type: "terrain"
          }));
          
          await supabase.from('notification').insert(notifications);
        }
        
        toast.success("Terrain ajouté avec succès");
      }
      
      onSubmitSuccess();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
      console.error("Error submitting terrain form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestionnaires d'événements pour la carte
  const handleCreated = (e: any) => {
    const { layerType, layer } = e;
    
    if (layerType === 'polygon') {
      // Récupérer les coordonnées du polygone
      const coords: number[][] = [];
      const latLngs = layer.getLatLngs()[0] as L.LatLng[];
      
      latLngs.forEach((latLng: L.LatLng) => {
        coords.push([latLng.lng, latLng.lat]);
      });
      
      // Ajouter le premier point à la fin pour fermer le polygone
      coords.push([latLngs[0].lng, latLngs[0].lat]);
      
      setPolygonCoordinates(coords);
    }
  };

  const handleEdited = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Polygon) {
        // Récupérer les coordonnées mises à jour
        const coords: number[][] = [];
        const latLngs = layer.getLatLngs()[0] as L.LatLng[];
        
        latLngs.forEach((latLng: L.LatLng) => {
          coords.push([latLng.lng, latLng.lat]);
        });
        
        // Ajouter le premier point à la fin pour fermer le polygone
        coords.push([latLngs[0].lng, latLngs[0].lat]);
        
        setPolygonCoordinates(coords);
      }
    });
  };

  const handleDeleted = () => {
    setPolygonCoordinates([]);
  };

  const clearPolygons = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      setPolygonCoordinates([]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {userRole === 'technicien' || userRole === 'superviseur' ? (
          <FormField
            control={form.control}
            name="id_tantsaha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Propriétaire du terrain</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un agriculteur" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {agriculteurs?.map((agriculteur) => (
                      <SelectItem 
                        key={agriculteur.id_utilisateur} 
                        value={agriculteur.id_utilisateur}
                      >
                        {agriculteur.nom} {agriculteur.prenoms || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
      
        <FormField
          control={form.control}
          name="nom_terrain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du terrain</FormLabel>
              <FormControl>
                <Input placeholder="Nom du terrain" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="surface_proposee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Surface estimée (hectares)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Surface en hectares" 
                  min="0.1" 
                  step="0.1" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                />
              </FormControl>
              <FormDescription>
                Surface en hectares calculée automatiquement à partir du dessin du terrain (1 ha = 10 000 m²)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="id_region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Région</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem 
                        key={region.id_region} 
                        value={region.id_region.toString()}
                      >
                        {region.nom_region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="id_district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!watchRegion}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un district" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredDistricts.map((district) => (
                      <SelectItem 
                        key={district.id_district} 
                        value={district.id_district.toString()}
                      >
                        {district.nom_district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="id_commune"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commune</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!watchDistrict}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une commune" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCommunes.map((commune) => (
                      <SelectItem 
                        key={commune.id_commune} 
                        value={commune.id_commune.toString()}
                      >
                        {commune.nom_commune}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="acces_eau"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Accès à l'eau</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="acces_route"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Accès aux routes</FormLabel>
              </FormItem>
            )}
          />
        </div>
        
        {/* Carte placée à la fin du formulaire */}
        <div className="space-y-4">
          <FormLabel>Définir la zone du terrain sur la carte</FormLabel>
          <div className="h-[400px] w-full relative rounded-md overflow-hidden border">
            <MapContainer
              center={[-18.913684, 47.536131]} // Centre de Madagascar
              zoom={6}
              style={{ height: "100%", width: "100%" }}
              ref={(map) => {
                if (map) {
                  mapRef.current = map;
                  setMapInitialized(true);
                }
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FeatureGroup ref={featureGroupRef}>
                <EditControl
                  position="topright"
                  onCreated={handleCreated}
                  onEdited={handleEdited}
                  onDeleted={handleDeleted}
                  draw={{
                    rectangle: false,
                    polygon: true,
                    polyline: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                  }}
                />
                {polygonCoordinates.length > 0 && (
                  <Polygon positions={polygonCoordinates.map(coord => [coord[1], coord[0]])} />
                )}
              </FeatureGroup>
            </MapContainer>
            <div className="absolute top-2 right-2 z-[1000]">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={clearPolygons}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Effacer
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Dessinez le contour de votre terrain sur la carte. Utilisez les outils de dessin pour créer un polygone représentant votre terrain.
          </p>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id_terrain ? "Mettre à jour" : "Ajouter le terrain"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TerrainForm;
