CREATE POLICY "admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins read all favorites" ON public.favorites
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins read all cart items" ON public.cart_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));