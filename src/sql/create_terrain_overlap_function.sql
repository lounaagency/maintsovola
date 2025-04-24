
-- Function to check if a terrain overlaps with existing terrains
CREATE OR REPLACE FUNCTION public.check_terrain_overlap(
  geom_input jsonb,
  terrain_to_omit integer DEFAULT NULL
)
RETURNS SETOF terrain
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  geom_polygon geometry;
BEGIN
  -- 1) convertir le JSONB en texte puis en geometry
  BEGIN
    geom_polygon := ST_SetSRID(
                      ST_GeomFromGeoJSON( geom_input::text ),
                      4326
                    );
  EXCEPTION
    WHEN others THEN
      RAISE EXCEPTION 'GeoJSON invalide ou non reconnu : %', SQLERRM;
  END;

  -- 2) renvoyer les terrains qui s’intersectent
  RETURN QUERY
  SELECT t.*
  FROM terrain t
  WHERE NOT archive
    AND (terrain_to_omit IS NULL OR t.id_terrain <> terrain_to_omit)
    AND ST_Intersects(t.geom, geom_polygon);
END;
$$;


-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_terrain_overlap TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_terrain_overlap TO service_role;

