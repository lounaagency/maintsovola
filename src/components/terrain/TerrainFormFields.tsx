import React, { useState, useRef, useEffect } from "react";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { TerrainFormData } from "@/types/terrainForm";
import { supabase } from "@/integrations/supabase/client";
import { RegionData, DistrictData, CommuneData, TerrainData } from "@/types/terrain";
import { MapContainer, TileLayer, FeatureGroup, useMapEvents, useMap, Polygon, Tooltip } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SurfaceDisplay from "./SurfaceDisplay";

interface TerrainFormFieldsProps {
  form: UseFormReturn<TerrainFormData>;
  userRole?: string;
  userId: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  photoUrls: string[];
  setPhotoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  photos: File[];
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  polygonCoordinates: number[][];
  setPolygonCoordinates: React.Dispatch<React.SetStateAction<number[][]>>;
  overlapTerrains?: TerrainData[] | null;
}

const TerrainFormFields: React.FC<TerrainFormFieldsProps> = ({
  form,
  userRole,
  userId,
  agriculteurs = [],
  techniciens = [],
  photoUrls,
  setPhotoUrls,
  photos,
  setPhotos,
  polygonCoordinates,
  setPolygonCoordinates,
  overlapTerrains
}) => {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [communes, setCommunes] = useState<CommuneData[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<DistrictData[]>([]);
  const [filteredCommunes, setFilteredCommunes] = useState<CommuneData[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [shouldUpdateSurface, setShouldUpdateSurface] = useState(false);
  const [existingTerrains, setExistingTerrains] = useState<TerrainData[]>([]);
  const [showOverlapDialog, setShowOverlapDialog] = useState(false);
  const [calculatedSurface, setCalculatedSurface] = useState<number | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const watchRegion = form.watch("id_region");
  const watchDistrict = form.watch("id_district");

  const MapInitializer = () => {
    const map = useMap();
    
    useEffect(() => {
      mapRef.current = map;
      setMapInitialized(true);
      
      if (polygonCoordinates && polygonCoordinates.length >= 3) {
        try {
          const latLngs = polygonCoordinates.map(coord => [coord[1], coord[0]] as L.LatLngTuple);
          const bounds = new L.LatLngBounds(latLngs);
          map.fitBounds(bounds, { padding: [20, 20] });
          
          if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
            const polygon = L.polygon(latLngs, {
              color: '#ff0000',
              weight: 3,
              opacity: 0.7,
              fillColor: '#ff0000',
              fillOpacity: 0.3
            });
            featureGroupRef.current.addLayer(polygon);
          }
        } catch (error) {
          console.error("Error centering map on terrain:", error);
        }
      }
    }, [map, polygonCoordinates]);
    
    return null;
  };

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

  useEffect(() => {
    const fetchExistingTerrains = async () => {
      try {
        const { data, error } = await supabase
          .from('terrain')
          .select('*')
          .eq('archive', false);
          
        if (error) throw error;
        setExistingTerrains(data || []);
      } catch (err) {
        console.error("Erreur lors du chargement des terrains:", err);
      }
    };

    fetchExistingTerrains();
  }, []);

  useEffect(() => {
    if (overlapTerrains && overlapTerrains.length > 0) {
      setShowOverlapDialog(true);
    }
  }, [overlapTerrains]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setPhotos(prevPhotos => [...prevPhotos, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setPhotoUrls(prevUrls => [...prevUrls, previewUrl]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      return newPhotos;
    });

    setPhotoUrls(prevUrls => {
      const newUrls = [...prevUrls];
      
      if (newUrls[index].startsWith('blob:')) {
        URL.revokeObjectURL(newUrls[index]);
      }
      
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const calculateAreaInHectares = (coords: number[][]) => {
    if (!coords || coords.length < 3) return 0;

    const latLngs = coords.map(coord => new L.LatLng(coord[1], coord[0]));
    
    const polygon = new L.Polygon(latLngs);
    
    const areaInSquareMeters = L.GeometryUtil.geodesicArea(polygon.getLatLngs()[0] as L.LatLng[]);
    
    return parseFloat((areaInSquareMeters / 10000).toFixed(2));
  };

  useEffect(() => {
    if (shouldUpdateSurface && polygonCoordinates && polygonCoordinates.length >= 3) {
      const area = calculateAreaInHectares(polygonCoordinates);
      form.setValue("surface_proposee", area);
      setCalculatedSurface(area);
      setShouldUpdateSurface(false);
    } else if (polygonCoordinates.length === 0) {
      setCalculatedSurface(null);
    }
  }, [polygonCoordinates, form, shouldUpdateSurface]);

  const handleCreated = (e: any) => {
    const { layerType, layer } = e;
    
    if (layerType === 'polygon') {
      const coords: number[][] = [];
      const latLngs = layer.getLatLngs()[0] as L.LatLng[];
      
      latLngs.forEach((latLng: L.LatLng) => {
        coords.push([latLng.lng, latLng.lat]);
      });
      
      coords.push([latLngs[0].lng, latLngs[0].lat]);
      
      setPolygonCoordinates(coords);
      setShouldUpdateSurface(true);
    }
  };

  const handleEdited = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Polygon) {
        const coords: number[][] = [];
        const latLngs = layer.getLatLngs()[0] as L.LatLng[];
        
        latLngs.forEach((latLng: L.LatLng) => {
          coords.push([latLng.lng, latLng.lat]);
        });
        
        coords.push([latLngs[0].lng, latLngs[0].lat]);
        
        setPolygonCoordinates(coords);
        setShouldUpdateSurface(true);
      }
    });
  };

  const handleDeleted = () => {
    setPolygonCoordinates([]);
    setCalculatedSurface(null);
  };

  return (
    <>
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
                min="0.01" 
                step="0.01" 
                {...field}
                onChange={(e) => field.onChange(parseFloat(parseFloat(e.target.value).toFixed(2)))} 
              />
            </FormControl>
            <FormDescription>
              Vous pouvez saisir la surface manuellement ou dessiner le contour du terrain sur la carte.
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
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <FormLabel>Photos du terrain</FormLabel>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Ajouter des photos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        
        {photoUrls.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {photoUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img 
                  src={url} 
                  alt={`Terrain photo ${index + 1}`} 
                  className="w-full h-32 object-cover rounded-md border border-border"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Dialog open={showOverlapDialog} onOpenChange={setShowOverlapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chevauchement de terrains détecté</DialogTitle>
            <DialogDescription>
              Le terrain que vous dessinez chevauche les terrains suivants :
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {overlapTerrains?.map((terrain) => (
              <div key={terrain.id_terrain} className="p-4 border rounded-lg">
                <h4 className="font-semibold">{terrain.nom_terrain}</h4>
                <p className="text-sm text-muted-foreground">
                  Surface: {terrain.surface_proposee} ha
                </p>
                {terrain.id_tantsaha && (
                  <p className="text-sm text-muted-foreground">
                    Propriétaire: {terrain.tantsahaNom}
                  </p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <FormLabel>Définir la zone du terrain sur la carte</FormLabel>
        <div className="h-[400px] w-full relative rounded-md overflow-hidden border">
          <MapContainer
            center={[-18.913684, 47.536131]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            doubleClickZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {existingTerrains.map((terrain) => {
              if (terrain.geom) {
                try {
                  const geomData = typeof terrain.geom === 'string' 
                    ? JSON.parse(terrain.geom) 
                    : terrain.geom;
                    
                  if (geomData && geomData.coordinates && geomData.coordinates[0]) {
                    const coords = geomData.coordinates[0].map((coord: number[]) => 
                      [coord[1], coord[0]] as L.LatLngExpression
                    );
                    
                    return (
                      <Polygon
                        key={terrain.id_terrain}
                        positions={coords}
                        pathOptions={{ 
                          color: '#666',
                          weight: 2,
                          fillOpacity: 0.2,
                          fillColor: '#666'
                        }}
                      >
                        <Tooltip>
                          {terrain.nom_terrain}<br/>
                          Surface: {terrain.surface_proposee} ha
                        </Tooltip>
                      </Polygon>
                    );
                  }
                } catch (error) {
                  console.error("Error parsing terrain geometry:", error);
                }
              }
              return null;
            })}

            <FeatureGroup ref={featureGroupRef}>
              <EditControl
                position="topright"
                draw={{
                  polygon: {
                    allowIntersection: false,
                    drawError: {
                      color: '#e1e100',
                      message: 'Le polygone ne peut pas s\'intersecter!'
                    },
                    shapeOptions: {
                      color: '#ff0000',
                    },
                  },
                  rectangle: false,
                  circle: false,
                  marker: false,
                  polyline: false,
                  circlemarker: false,
                }}
                onCreated={handleCreated}
                onEdited={handleEdited}
                onDeleted={handleDeleted}
              />
            </FeatureGroup>
            <SurfaceDisplay 
              surface={calculatedSurface} 
              polygonCoordinates={polygonCoordinates}
            />
            <MapInitializer />
          </MapContainer>
        </div>
        <p className="text-sm text-muted-foreground">
          Dessinez le contour de votre terrain sur la carte (facultatif). Les terrains existants sont affichés en gris.
        </p>
      </div>
    </>
  );
};

export default TerrainFormFields;