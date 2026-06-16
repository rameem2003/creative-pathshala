UPDATE public.site_settings
SET value = (replace(replace(value::text, 'Canvas Pathshala', 'Canvas Pathsala'), 'Pathshala', 'Pathsala'))::jsonb
WHERE value::text ILIKE '%Pathshala%';