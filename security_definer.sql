DROP FUNCTION IF EXISTS crowd_calculator_insert_leaflet_data(text);

CREATE OR REPLACE FUNCTION crowd_calculator_insert_leaflet_data(geojson text)
  RETURNS TABLE(cartodb_id int)

LANGUAGE plpgsql SECURITY DEFINER
RETURNS NULL ON NULL INPUT
AS $$
DECLARE
sql text;
BEGIN

sql := 'WITH n(the_geom) AS (VALUES(ST_SetSRID(ST_GeomFromGeoJSON(NULLIF('''|| geojson ||''','''')),4326))), ';

sql := sql ' do_insert AS ('
      || 'INSERT INTO crowd_data (the_geom)'
      || 'SELECT n.the_geom FROM n RETURNING cartodb_id ) ';

RAISE DEBUG '%', sql;

RETURN QUERY EXECUTE sql;

END;
$$;

GRANT EXECUTE ON FUNCTION crowd_calculator_insert_leaflet_data(text) TO publicuser;
