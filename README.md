# Sala de Vendas KIM

Dashboard de gestão da **Consultoria (Liners)** e **Closers**, construído a partir do relatório `Document KIM.csv`, emitido em **22/08/2026**.

## O que o dashboard mostra

- Atendimentos efetivos, vendas, VGV bruto e VGV ativo
- Conversão, ticket médio, cancelamentos e NoTour
- Evolução mensal
- Ranking de Liners e Closers
- Busca por profissional
- Filtro por período
- Ordenação por VGV, vendas, conversão, VGV ativo e cancelamento
- Classificação de decisão: Escalar, Manter, Desenvolver ou Amostra Baixa

## Privacidade

O site não publica dados dos clientes do relatório original. A base do dashboard foi agregada por dia e por profissional, mantendo apenas informações de performance da equipe.

## Metodologia

- Cada token não vazio em `Status do contrato` conta como uma venda; `#` representa múltiplos contratos.
- Tokens iniciados por `CANCELADO` contam como cancelamento histórico.
- VGV ativo soma linhas que possuem ao menos um token `ATIVO`; linhas mistas não são rateadas.
- Agosto/2026 está parcial até 21/08/2026.

## Arquivos

- `index.html` — estrutura do dashboard
- `styles.css` — visual
- `app.js` — filtros, cálculos, rankings e gráficos
- `data.js` — base agregada por dia/profissional
