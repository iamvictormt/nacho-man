# Análise com IA nos Indicadores

Acesse `/indicadores?tab=ia`. Escolha a loja, o período e o período de comparação; cada intervalo aceita até 366 dias encerrados até ontem. Cada pergunta é independente. O histórico pertence ao usuário que gerou a análise e guarda a pergunta, a resposta, o modelo, o consumo e o retrato dos indicadores consultados. O download JSON inclui a resposta e esse retrato.

## Ativação no servidor

1. Configure `ANTHROPIC_API_KEY` no ambiente privado do servidor. Não use prefixo `NEXT_PUBLIC_`. A chave não deve ser enviada pelo chat nem incluída no repositório.
2. Opcionalmente configure `ANTHROPIC_MODEL`; padrão: `claude-sonnet-4-6`.
3. Com `DATABASE_URL` apontando para o banco da aplicação, aplique somente a tabela nova:

   ```sh
   npx prisma db execute --file prisma/migrations/20260911000000_add_indicator_analysis/migration.sql --schema prisma/schema.prisma
   npx prisma generate
   npm run build
   ```

4. Reinicie o serviço com as variáveis configuradas. Em Docker, execute a atualização no ambiente com acesso ao host `db` e disponibilize as variáveis ao container da aplicação.
5. Entre com um administrador que tenha acesso aos Indicadores, gere uma análise e recarregue a página para conferir o histórico.

O SQL é aditivo e pode ser executado novamente. Não use `prisma migrate reset`. O projeto já contém alterações de esquema aplicadas por scripts, por isso não é necessário aplicar todas as migrações antigas para ativar esta tabela.

No Docker Compose deste projeto, o serviço `migrate` contém o Prisma e as migrações. O comando equivalente para aplicar apenas esta tabela é:

```sh
docker compose --env-file .env.production --profile tools run --build --rm migrate npx prisma db execute --file prisma/migrations/20260911000000_add_indicator_analysis/migration.sql --schema prisma/schema.prisma
```

Configure `NEXT_PUBLIC_SITE_URL` com a URL pública correta quando houver proxy reverso; a API valida a origem das solicitações.

## Dados e comportamento

- Reutiliza os cálculos do painel: resumo de vendas, série diária, resumo por loja, mix de produtos e CMV disponível. O histórico de vendas continua nas tabelas Saipos existentes.
- Envia apenas agregados selecionados, nomes de lojas/produtos e a pergunta. Não envia pedidos brutos, identidade de clientes ou credenciais. Perguntas são enviadas como digitadas.
- Até 100 produtos de maior receita por período; o retrato informa a quantidade omitida. Não interpreta ausência de registros como cobertura completa nem CMV indisponível como custo zero.
- A resposta cita o contexto recebido. Pedidos sobre datas diferentes exigem ajustar os filtros. Não há consulta livre ao banco pelo modelo.
- Limite de 20 solicitações por usuário em 24 horas, incluindo falhas, e uma solicitação em andamento por usuário. A reserva é serializada no banco. Reservas interrompidas deixam de bloquear novas solicitações após três minutos.
- Sem chave, a geração fica desativada e o histórico continua acessível. Sem a tabela/conexão, aparece uma mensagem de indisponibilidade.
- A API Claude é cobrada separadamente da assinatura de chat. Configure limites de gasto também no provedor.

Referência da integração: https://platform.claude.com/docs/en/api/messages/create

## Verificações locais

```sh
node --test scripts/test-indicators-ai.mjs
npx tsc --noEmit
npm run build
```

Os testes isolam banco e provedor: verificam validação, autorização, isolamento do histórico, ausência de chave, limite de uso, persistência e falha do provedor sem consumo real da API. Uma análise real exige banco acessível e chave válida.
