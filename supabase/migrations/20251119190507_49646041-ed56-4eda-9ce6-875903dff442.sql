-- Add customer_cep field to orders table
ALTER TABLE public.orders ADD COLUMN customer_cep VARCHAR(10);