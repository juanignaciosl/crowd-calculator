DROP FUNCTION IF EXISTS crowd_calculator_insert_leaflet_data(text, text);

CREATE OR REPLACE FUNCTION crowd_calculator_insert_leaflet_data(crowd_name text, geojson text)
  RETURNS TABLE(cartodb_id int)

LANGUAGE plpgsql SECURITY DEFINER
RETURNS NULL ON NULL INPUT
AS $$
DECLARE
text sql;
BEGIN

sql := 'WITH n(name, the_geom) AS (VALUES('
      || crowd_name || ', '
      || 'ST_SetSRID(ST_GeomFromGeoJSON(NULLIF('''|| geojson ||''','''')),4326)'
      || ')), ';

sql := sql ' do_insert AS ('
      || 'INSERT INTO crowd_data (the_geom, crowd_name)'
      || 'SELECT n.the_geom, n.name FROM n RETURNING cartodb_id ) ';

RAISE DEBUG '%', sql;

RETURN QUERY EXECUTE sql;

END;
$$;

GRANT EXECUTE ON FUNCTION crowd_calculator_insert_leaflet_data(text, text) TO publicuser;
