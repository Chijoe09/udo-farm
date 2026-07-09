
CREATE POLICY "products read all" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'products');
CREATE POLICY "products upload own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "products update own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "products delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);
