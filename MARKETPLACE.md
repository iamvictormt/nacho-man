# Nacho Factory Marketplace

Portal privado B2B para a Nacho Factory administrar produtos e receber pedidos dos franqueados Nacho Man.

## Configuração

1. Copie as variáveis de `.env.example` para `.env`.
2. Configure um banco PostgreSQL em `DATABASE_URL`.
3. Gere uma chave longa e aleatória para `SESSION_SECRET`.
4. Execute:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Acessos iniciais

Somente após executar o seed:

- Admin: `admin@nachofactory.com.br`
- Franqueado: `franqueado@nachoman.com.br`
- Senha inicial de ambos: `Trocar@123`

Troque essas senhas antes de usar o sistema em produção.

## Fluxo de pedidos

1. O franqueado monta o carrinho.
2. Seleciona PIX ou cartão.
3. O servidor recalcula produtos, promoções e cupom.
4. Para PIX, aplica 4% de desconto.
5. O pedido é salvo no banco.
6. O sistema abre o WhatsApp com o resumo e número do pedido.
7. A Factory envia o código PIX ou link de cartão manualmente.
8. O admin atualiza o status no painel.

## Áreas

- `/login`: acesso ao sistema.
- `/marketplace`: catálogo, combos e carrinho do franqueado.
- `/marketplace/pedidos`: histórico da unidade.
- `/admin`: visão geral.
- `/admin/produtos`: produtos.
- `/admin/combos`: combos.
- `/admin/campanhas`: promoções e cupons.
- `/admin/franqueados`: unidades e acessos.
- `/admin/pedidos`: operação e status dos pedidos.
