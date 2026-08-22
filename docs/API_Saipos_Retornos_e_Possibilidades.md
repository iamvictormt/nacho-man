# API Saipos: retornos e possibilidades para o Nacho Man

Atualizado em: 03-08-26

## Escopo

Este documento resume o que a API de Dados da Saipos retorna e o que pode ser criado a partir desses dados no projeto Nacho Man.

O projeto hoje já consome o endpoint de vendas da Saipos em `lib/saipos-data-api.ts` e grava uma parte do retorno em `SaiposSale`, mantendo também o JSON bruto em `raw`. Isso significa que o painel atual usa apenas uma fatia do que a Saipos entrega, mas o banco já guarda margem para evoluir sem precisar refazer a primeira integração.

Fontes principais:

- Documentação oficial da API de Dados: https://saipos-data-api.readme.io/reference/introducao
- Índice oficial em Markdown: https://saipos-data-api.readme.io/llms.txt
- Consultar vendas: https://saipos-data-api.readme.io/reference/consultar-vendas
- Layout de vendas: https://saipos-data-api.readme.io/reference/layout-definicoes-vendas
- Consultar itens de venda: https://saipos-data-api.readme.io/reference/consultar-itens-venda
- Layout de itens: https://saipos-data-api.readme.io/reference/layout-definicoes-itens-venda
- Histórico de status: https://saipos-data-api.readme.io/reference/consultar-historico-status-vendas
- Lançamentos financeiros: https://saipos-data-api.readme.io/reference/consultar-lancamentos-financeiros
- Estoque: https://saipos-data-api.readme.io/reference/posicao-de-estoque

## Como a API funciona

A base da API de Dados é:

```txt
https://data.saipos.io/v1
```

A autenticação é feita pelo header:

```txt
Authorization: Bearer <token>
```

Todas as consultas exigem filtro por período. Os parâmetros comuns são:

| Parâmetro | Obrigatório | Uso |
| --- | --- | --- |
| `p_date_column_filter` | Sim | Campo usado no filtro: `shift_date`, `created_at` ou `updated_at`. |
| `p_filter_date_start` | Sim | Início do período. |
| `p_filter_date_end` | Sim | Fim do período. |
| `p_limit` | Não | Quantidade de registros por página. Padrão 300, máximo 1000. |
| `p_offset` | Não | Paginação. Começa em 0. |

Recomendação prática:

- Use `shift_date` para relatórios fechados por dia/turno, como "vendas de ontem".
- Use `created_at` para visões mais próximas de tempo real.
- Use `updated_at` para sincronização incremental, pois também traz vendas antigas alteradas depois, como cancelamentos.

Limites relevantes:

- O intervalo de uma consulta não pode passar de 15 dias.
- Há limite de 500 requisições a cada 5 minutos por IP.
- A própria Saipos recomenda rotinas automatizadas a partir das 05:00, horário de Brasília, porque em horários de pico pode haver atraso D+1 na atualização dos dados.

## Endpoints principais

### 1. Vendas

Endpoint:

```txt
GET /search_sales
```

Retorna os pedidos/vendas de uma ou mais lojas vinculadas ao token.

Campos principais:

| Campo | O que representa | Uso possível |
| --- | --- | --- |
| `id_store` | ID da loja na Saipos. | Separar desempenho por unidade. |
| `id_sale` | ID único da venda. | Chave de deduplicação e integração. |
| `id_sale_type` | Tipo da venda: entrega, retirada, salão ou ficha. | Entender canal operacional. |
| `created_at` | Criação da venda. | Linha do tempo e sincronização. |
| `updated_at` | Última alteração. | Capturar cancelamentos e ajustes. |
| `shift_date` | Data do turno. | Relatórios iguais aos relatórios da Saipos. |
| `canceled` | Indica venda cancelada. | Taxa de cancelamento e expurgo de faturamento. |
| `total_amount` ou `totals.total_amount` | Total final da venda. | Faturamento. |
| `total_discount` | Descontos. | Análise de promoção/perda de receita. |
| `total_increase` | Acréscimos. | Taxas e adicionais. |
| `total_amount_items` | Total dos itens antes de ajustes. | Base de margem e mix. |
| `customer` | Dados do cliente quando disponíveis. | CRM, recorrência e segmentação. |
| `delivery` | Taxa, endereço e tipo de entrega. | Mapa de entregas e custo logístico. |
| `delivery_man` | Entregador. | Performance de entrega. |
| `partner_sale` | Canal/parceiro do pedido. | iFood, site, outros canais e status externo. |
| `partner_delivery` | Parceiro logístico. | Acompanhamento de entrega terceirizada. |
| `table_order` | Dados de mesa/comanda. | Análise de salão. |
| `ticket` | Número de ficha/senha. | Operação de retirada/ficha. |
| `schedule` | Agendamento. | Previsão de demanda. |
| `nfce` | Dados fiscais. | Conferência fiscal. |
| `payments` | Formas de pagamento. | Mix de pagamento e conciliação. |
| `payment_transaction_smartpos` | Transações SmartPOS. | Conciliação de recebíveis. |
| `payment_transaction_tef` | Transações TEF. | Conciliação com adquirentes. |

O projeto Nacho Man hoje já grava:

- loja (`idStore`)
- venda (`idSale`)
- tipo (`idSaleType`)
- datas (`createdAtSaipos`, `updatedAtSaipos`, `shiftDate`)
- cancelamento
- totais em centavos
- primeira forma de pagamento
- canal/parceiro
- status do parceiro
- JSON bruto completo

### 2. Itens de venda

Endpoint:

```txt
GET /sales_items
```

Retorna os itens dos pedidos, agrupados por venda.

Campos principais do retorno:

| Campo | O que representa | Uso possível |
| --- | --- | --- |
| `id_sale` | Venda relacionada. | Ligar item ao pedido. |
| `id_store` | Loja. | Mix por unidade. |
| `id_sale_type` | Tipo da venda. | Mix por canal. |
| `created_at`, `updated_at`, `shift_date` | Datas da venda. | Relatórios por período. |
| `items` | Array de itens da venda. | Base para produtos vendidos. |

Campos importantes em `items`:

| Campo | O que representa | Uso possível |
| --- | --- | --- |
| `id_sale_item` | ID único do item na venda. | Chave do item. |
| `id_store_item` | ID do item no cardápio da loja. | Mapeamento com produto. |
| `desc_sale_item` | Nome/descrição do item vendido. | Ranking de produtos. |
| `integration_code` | Código PDV do item. | Agrupar e auditar produtos dentro da própria base Saipos. |
| `quantity` | Quantidade vendida. | Curva ABC e demanda. |
| `unit_price` | Preço unitário com adicionais. | Receita por item. |
| `status` | Pendente ou pronto no KDS. | Tempo de cozinha/preparo. |
| `done_at` | Finalização do preparo. | SLA operacional. |
| `deleted` | Item removido/cancelado. | Perdas e erros operacionais. |
| `id_sale_to` / `id_sale_from` | Transferência entre vendas. | Ajuste de mesas/comandas. |
| `choices` | Complementos/adicionais. | Preferências e adicionais mais vendidos. |

Campos importantes em `choices`:

| Campo | O que representa | Uso possível |
| --- | --- | --- |
| `desc_sale_item_choice` | Nome do complemento vendido. | Ranking de adicionais. |
| `desc_store_choice_item` | Nome cadastrado na Saipos. | Normalização do cardápio. |
| `aditional_price` | Valor adicional. | Receita de complementos. |
| `deleted` | Complemento removido. | Análise de ajustes. |

### 3. Histórico de status da venda

Endpoint:

```txt
GET /sales_status_histories
```

Retorna a linha do tempo de status de cada venda.

Campos principais:

| Campo | O que representa | Uso possível |
| --- | --- | --- |
| `id_store` | Loja. | Comparar operação por unidade. |
| `id_sale` | Venda. | Ligar status ao pedido. |
| `id_sale_type` | Tipo da venda. | SLA por canal. |
| `histories` | Eventos de status. | Funil operacional. |

Campos em `histories`:

| Campo | O que representa | Uso possível |
| --- | --- | --- |
| `order` | Ordem do evento. | Sequência do pedido. |
| `created_at` | Quando o status mudou. | Tempos entre etapas. |
| `duration_time_seconds` | Quanto tempo ficou no status. | Gargalos de atendimento/cozinha/entrega. |
| `desc_store_sale_status` | Nome do status. | Funil operacional. |
| `desc_cancellation_reason` | Motivo do cancelamento. | Análise de cancelamentos. |
| `user` | Usuário que mudou o status. | Auditoria operacional. |
| `authorized_by` | Usuário que autorizou status, quando aplicável. | Controle e auditoria. |

### 4. Lançamentos financeiros

Endpoint:

```txt
GET /financial_transactions
```

Retorna contas, pagamentos e lançamentos financeiros das lojas.

Campos principais:

| Campo | O que representa | Uso possível |
| --- | --- | --- |
| `id_store_fin_transaction` | ID único do lançamento. | Chave financeira. |
| `id_store` | Loja. | DRE por unidade. |
| `date` | Vencimento. | Contas a pagar/receber. |
| `amount` | Valor. | Fluxo de caixa. |
| `paid` | Pago ou não pago. | Inadimplência e pendências. |
| `payment_date` | Data do pagamento. | Fluxo realizado. |
| `issuance_date` | Emissão. | Competência financeira. |
| `recurring` | Recorrente ou não. | Despesas fixas. |
| `conciliated` | Conciliado ou não. | Pendências de conciliação. |
| `provider_trade_name` | Fornecedor. | Gastos por fornecedor. |
| `desc_store_bank_account` | Conta bancária. | Saldo/caixa por conta. |
| `desc_store_payment_method` | Método de pagamento. | Perfil financeiro. |
| `desc_store_fin_transaction` | Descrição. | Classificação gerencial. |
| `desc_store_category_financial` | Categoria. | DRE e centros de custo. |
| `children` | Lançamentos filhos. | Parcelas/detalhamento. |

### 5. Estoque

Endpoints listados na documentação:

```txt
GET /stock_movements
GET /stock_position
```

A documentação lista movimentação de estoque como "em manutenção" e posição de estoque como consulta disponível. Em ambos os casos, o retorno é útil para CMV, ruptura e reposição.

Campos principais de movimentação/estoque:

| Campo | O que representa | Uso possível |
| --- | --- | --- |
| `id_store_ingred_movement` | ID da movimentação. | Chave de auditoria. |
| `id_movement_type` | Tipo: venda, entrada, perda, ajuste, transferência etc. | Entender entrada/saída de estoque. |
| `date_movement` | Data da movimentação. | Histórico de estoque. |
| `quantity` | Quantidade movimentada. | Consumo por ingrediente. |
| `unit_cost` | Custo unitário. | CMV e custo por produto. |
| `quantity_entry` | Quantidade de entrada antes de conversão. | Conferência de notas. |
| `sale` | Venda relacionada, quando houver. | Baixa por venda. |
| `ingredient` | Dados do ingrediente. | Estoque atual, custo médio e mínimo. |
| `group` | Grupo do ingrediente. | Análise por categoria. |
| `identification_nf` | Nota fiscal relacionada. | Conferência de compras. |

Campos relevantes em `ingredient`:

| Campo | O que representa | Uso possível |
| --- | --- | --- |
| `id_store_ingredient` | ID único do ingrediente. | Cadastro de insumos. |
| `desc_store_ingredient` | Nome do ingrediente. | Lista de estoque. |
| `current_inventory` | Estoque atual. | Ruptura e reposição. |
| `minimium_stock` | Estoque mínimo. | Alertas automáticos. |
| `average_cost` | Custo médio. | CMV. |
| `average_cost_method` | Método de cálculo do custo. | Confiabilidade do custo. |
| `control_inventory` | Se controla estoque. | Filtrar insumos válidos. |
| `include_in_cmv_calc` | Se entra no CMV. | DRE gerencial. |
| `short_desc_unit_measure` | Unidade de medida. | Conversões e compras. |

## O que dá para criar com esses dados

### Já existe no projeto

O painel Saipos atual já permite:

- Faturamento por período.
- Pedidos válidos e cancelados.
- Ticket médio.
- Maior venda por loja.
- Quantidade de lojas ativas.
- Ranking de lojas por faturamento.
- Distribuição por tipo de venda: entrega, retirada, salão e ficha.
- Ranking de formas de pagamento.
- Gráfico diário de faturamento.

### Melhorias diretas no painel Saipos

Com os dados que a API já retorna, dá para evoluir o painel para:

- Faturamento por canal, separando iFood, site, loja, retirada e outros parceiros.
- Análise de cancelamentos com motivo, status e usuário responsável.
- Ranking de descontos por cupom, loja e canal.
- Comparativo entre `created_at` e `shift_date`, evitando divergência em operações noturnas.
- Mapa de entregas por bairro, cidade e CEP.
- Acompanhamento de taxa de entrega importada versus cobrada.
- Relatório fiscal básico por NFC-e emitida.
- Ranking de formas de pagamento com SmartPOS/TEF, bandeira, autorizadora, NSU e cancelamentos.

### Módulo de produtos e mix de vendas

Consumindo `/sales_items`, dá para criar:

- Ranking de produtos mais vendidos.
- Curva ABC de produtos por receita e quantidade.
- Produtos com maior ticket médio.
- Produtos mais vendidos por loja.
- Produtos mais vendidos por canal.
- Complementos/adicionais mais vendidos.
- Itens cancelados/removidos por produto e loja.
- Tempo médio de preparo por item, usando `created_at` e `done_at`.
- Agrupamento por produto da própria Saipos usando `id_store_item`, `desc_sale_item` e `integration_code`.

### Operação e SLA

Consumindo `/sales_status_histories`, dá para criar:

- Tempo médio por etapa do pedido.
- Gargalos por loja, turno e canal.
- Tempo médio até cancelamento.
- Pedidos parados por muito tempo em um status.
- Ranking de status que mais acumulam tempo.
- Auditoria de quem alterou ou autorizou status críticos.
- Comparação entre performance de salão, retirada e delivery.

### Financeiro e conciliação

Consumindo lançamentos financeiros e transações de pagamento, dá para criar:

- DRE simplificada por loja.
- Fluxo de caixa previsto e realizado.
- Contas pagas, em aberto e vencidas.
- Despesas recorrentes por unidade.
- Gastos por fornecedor.
- Gastos por categoria financeira.
- Relatório de conciliação por conta bancária.
- Divergências entre vendas, pagamentos, SmartPOS, TEF e lançamentos financeiros.
- Alertas de lançamentos não conciliados.

### Estoque, compras e CMV

Consumindo estoque e itens vendidos, dá para criar:

- Posição atual de estoque por ingrediente.
- Alertas de estoque abaixo do mínimo.
- Consumo por ingrediente.
- CMV por loja, produto ou grupo de ingrediente.
- Projeção de ruptura com base na venda média.
- Sugestão de compra por loja.
- Auditoria de perdas, ajustes e transferências.
- Conferência de entrada por nota fiscal.
- Comparativo de custo médio por loja.

### BI para franqueadora

Para uma visão de rede, dá para criar:

- Dashboard executivo por loja.
- Ranking de faturamento, ticket médio, pedidos e cancelamentos.
- Comparativo de mix entre unidades.
- Ranking de canais de venda por unidade.
- Lojas com maior crescimento ou queda.
- Produtos fora do padrão da rede.
- Alertas de lojas com estoque crítico, alta perda ou baixa conversão.
- Relatório mensal automático para franqueados.

### Automações possíveis

Com sincronização diária e incremental, dá para automatizar:

- Atualização do banco todo dia após 05:00.
- Reprocessamento por `updated_at` para capturar cancelamentos e edições.
- Aviso quando uma loja não retornar dados.
- Aviso quando uma consulta vier parcial ou truncada.
- Alerta de faturamento abaixo da média.
- Alerta de muitos cancelamentos em um dia.
- Alerta de estoque mínimo.
- Envio de resumo diário para administradores.

## Modelo recomendado para evoluir o banco

Hoje existe `SaiposSale`, com `raw` guardando o JSON completo. Para evoluir sem perder flexibilidade, a sugestão é criar tabelas normalizadas conforme a necessidade:

| Tabela sugerida | Origem | Finalidade |
| --- | --- | --- |
| `SaiposSale` | `/search_sales` | Cabeçalho da venda. Já existe. |
| `SaiposSalePayment` | `payments` | Uma ou mais formas de pagamento por venda. |
| `SaiposSalePaymentTransaction` | `payment_transaction_smartpos` e `payment_transaction_tef` | Conciliação detalhada. |
| `SaiposSaleItem` | `/sales_items.items` | Itens vendidos. |
| `SaiposSaleItemChoice` | `/sales_items.items.choices` | Complementos/adicionais. |
| `SaiposSaleStatusHistory` | `/sales_status_histories.histories` | Linha do tempo operacional. |
| `SaiposFinancialTransaction` | `/financial_transactions` | Financeiro e DRE. |
| `SaiposStockMovement` | `/stock_movements` | Movimentações de estoque. |
| `SaiposStockPosition` | `/stock_position` | Estoque atual. |
| `SaiposProductReference` | `integration_code` / `id_store_item` | Referência normalizada dos produtos vindos da Saipos, sem vínculo com outros módulos do sistema. |

## Próxima implementação recomendada

Ordem sugerida para gerar mais valor rápido:

1. Incluir `/sales_items` na sincronização.
2. Criar ranking de produtos vendidos por loja e período.
3. Criar referência normalizada dos produtos da própria Saipos por `integration_code`, `id_store_item` e descrição.
4. Incluir `/sales_status_histories` para medir SLA e cancelamentos.
5. Incluir pagamentos detalhados para conciliação.
6. Depois entrar em financeiro e estoque, que exigem mais cuidado de modelagem.

Essa ordem aproveita a base atual e entrega rapidamente uma visão comercial melhor: não apenas "quanto vendeu", mas "o que vendeu", "onde vendeu", "por qual canal" e "onde está travando".
