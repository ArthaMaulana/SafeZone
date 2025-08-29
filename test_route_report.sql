-- Insert a test route-based report
INSERT INTO public.reports (category, description, lat, lng, end_lat, end_lng, status)
VALUES (
    'road',
    'Test route report - jalan rusak dari titik A ke titik B',
    -6.2088,
    106.8456,
    -6.2100,
    106.8470,
    'open'
);
