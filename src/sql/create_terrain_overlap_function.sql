
-- Function to check if a terrain overlaps with existing terrains
CREATE OR REPLACE FUNCTION public.check_terrain_overlap(
  geom_input JSONB,
  terrain_to_omit INTEGER DEFAULT NULL
)
RETURNS SETOF terrain
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM terrain t
  WHERE 
    t.archive = false
    AND (terrain_to_omit IS NULL OR t.id_terrain != terrain_to_omit)
    AND ST_Intersects(
      ST_SetSRID(ST_GeomFromGeoJSON(geom_input::text), 4326),
      t.geom::geometry
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_terrain_overlap TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_terrain_overlap TO service_role;
