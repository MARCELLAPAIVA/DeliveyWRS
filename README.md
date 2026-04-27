# Delivery WRS (Next.js + Supabase)

Plataforma de delivery com separação entre loja do cliente e painel administrativo `/admin`.

## O que está implementado
- Login e cadastro (cliente) com Supabase Auth.
- Loja com categorias, produtos, carrinho, checkout e finalização de pedido + WhatsApp.
- Painel admin protegido (via middleware + perfil `is_admin`) com:
  - Produtos (criar, editar, ativar/inativar, excluir, upload de imagem em Storage)
  - Categorias (criar/editar/excluir)
  - Taxas por bairro (criar/editar)
  - Pedidos em tempo real (troca de status)
  - Relatórios por período (diário/semanal/mensal) + export CSV
  - Configurações da loja (nome, logo, WhatsApp)
- API server-side para criação de pedidos (`/api/orders`) com validação Zod.
- API para importação de produtos a partir de linhas extraídas de PDF (`/api/import/pdf`).

## Estrutura
```bash
app/
  (auth)/login
  (shop)
  admin
  api/orders
  api/import/pdf
context/
lib/
supabase/
sql/supabase.sql
middleware.ts
```

## Configurar Supabase
1. Crie o projeto.
2. Rode `sql/supabase.sql` no SQL Editor.
3. Em Authentication, habilite Email/Senha.
4. O script já cria bucket `products` + políticas de Storage.
5. Torne seu usuário admin:
   ```sql
   update public.profiles set is_admin = true where id = '<UUID_DO_USUARIO>';
   ```

## Variáveis de ambiente
Copie:
```bash
cp .env.example .env.local
```

## Rodar local
```bash
npm install
npm run dev
```

## Deploy no Vercel
1. Suba para GitHub (comandos abaixo).
2. Import Project no Vercel.
3. Configure as variáveis do `.env.example`.
4. Deploy.

## Deploy no Netlify
1. Conecte o repositório GitHub no Netlify.
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Adicione variáveis de ambiente.

## Subir os arquivos no GitHub
```bash
git remote add origin <URL_DO_SEU_REPO>
git push -u origin work
```

## Importação de PDF (produtos)
Quando você tiver o conteúdo extraído do PDF em linhas, faça POST em `/api/import/pdf`:
```json
{
  "lines": [
    "Pizzas:",
    "Calabresa 39,90",
    "Frango com Catupiry 42,90"
  ]
}
```
A rota cria categorias/produtos automaticamente.
