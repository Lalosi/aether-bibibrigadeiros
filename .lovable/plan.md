Este é um escopo grande que cobre 5 áreas: RBAC final, arquitetura de produção (matéria-prima + ficha técnica), BI de precificação, automação de estoque em pedidos, e tratamento de erros. Vou dividir em entregas claras e propor a estrutura de banco antes de codar, porque várias features dependem de tabelas que ainda não existem.

## 1. Banco de Dados (precisa ser criado antes do código)

Novas tabelas / colunas necessárias no Supabase:

```text
materias_primas
  id, nome, unidade_medida (kg/g/L/un), 
  quantidade_embalagem (numeric),     -- ex: 1000g
  preco_compra (numeric),              -- ex: R$ 25 pelo pacote
  estoque_atual (numeric),
  fornecedor (text), created_at

fichas_tecnicas (1 produto -> N insumos)
  id, produto_id (fk produtos),
  materia_prima_id (fk materias_primas),
  quantidade_usada (numeric)           -- na mesma unidade da matéria

produtos (colunas adicionais)
  tempo_producao_min (int),
  margem_desejada_pct (numeric default 100),
  custo_fixo_pct (numeric default 10),
  custo_producao (numeric, calculado),
  preco_sugerido (numeric, calculado)

profiles (coluna adicional)
  valor_hora_trabalho (numeric default 25)

pedidos_itens (caso ainda não exista — verificar)
  id, pedido_id, produto_id, quantidade, preco_unitario
```

Vou pedir confirmação antes de gerar a migration.

## 2. Finalização Fase 2 — RBAC

- **ConfiguracoesPage**: adicionar botão "Convidar/Criar Usuário" abrindo dialog com email + senha + role.
  - Master: pode escolher qualquer role (funcionario/admin/master).
  - Admin: dropdown limitado a funcionario/admin; opção master desabilitada.
  - Cria via `supabase.auth.admin.createUser` — não disponível no client. Alternativa: usar `signUp` padrão + insert em `user_roles`, ou criar edge function `create-user` com service role.
  - Proposta: edge function `admin-create-user` que valida o caller e cria o usuário.
- **Sidebar**: já filtra por role; confirmar que `funcionario` só vê Clientes + Pedidos (atual config já faz isso — validar e travar via env).
- **PerfilPage**: já existe. Adicionar edição de **Nome** (`profiles.nome`) e campo **Valor Hora Trabalho** (para precificação). Senha já implementada.

## 3. Arquitetura de Produção

- **Sidebar / Dashboard**: separar visualmente:
  - "Estoque de Produtos Finais" → rota atual `/estoque`
  - "Matéria-Prima / Insumos" → nova rota `/materias-primas`
- **MateriasPrimasPage**: CRUD completo (mesmo padrão de EstoquePage), com `MateriaPrimaDialog`.
- **Dashboard**: dois cards distintos com totalização de cada inventário.

## 4. Ficha Técnica + BI Precificação

- Em `ProdutoDialog`, transformar conteúdo em **Tabs**:
  - Aba "Dados" (atual)
  - Aba "Ficha Técnica":
    - Tabela de insumos (add/remove linha): seleciona matéria-prima + quantidade.
    - Campos: tempo de produção, margem desejada %, custo fixo %.
    - **Cálculos em tempo real**:
      - `custo_insumos = Σ (quantidade_usada / quantidade_embalagem) * preco_compra`
      - `custo_mao_obra = (tempo_min / 60) * valor_hora_trabalho` (busca do profile do master/admin atual ou config global)
      - `custo_fixos = custo_insumos * (custo_fixo_pct / 100)`
      - `custo_total = insumos + mão_obra + fixos`
      - `preco_sugerido = custo_total * (1 + margem/100)`
      - `preco_minimo = custo_total`
    - Exibe quadro "Inteligência de Preço" com os 3 valores.
- Persiste fichas_tecnicas + atualiza `produtos.preco_venda` se usuário aceitar sugestão.

## 5. Automação Pedidos / Estoque

- **NovoPedidoDialog**:
  - Garantir total recalculado em tempo real (já deveria — validar).
  - Persistir itens em `pedidos_itens`.
- **PedidosPage handleStatusChange**:
  - Ao mudar para "Entregue" (ou "Finalizado"):
    - Para cada item: verificar estoque do produto. Se faltar → toast de erro, abortar.
    - Subtrair `produtos.estoque` para cada item.
  - Ao mudar de "Entregue" → "Cancelado": estornar (somar de volta).
  - Implementar via RPC Postgres `finalizar_pedido(pedido_id)` e `cancelar_pedido(pedido_id)` para garantir atomicidade.
- **Botão "Produzir"** em ProdutoDialog/EstoquePage:
  - Abre mini-dialog: "Quantidade a produzir".
  - RPC `produzir_produto(produto_id, qtd)`:
    - Valida estoque de cada matéria-prima da ficha (qtd_usada * qtd_produzir).
    - Decrementa `materias_primas.estoque_atual`.
    - Incrementa `produtos.estoque`.
    - Tudo em transação.

## 6. Tratamento de Erros Amigável

- Helper `src/lib/errors.ts` com `friendlyError(error)` mapeando códigos comuns:
  - `23505` (unique_violation) → "Este registro já existe (e-mail/CPF duplicado)."
  - `23503` (fk) → "Registro vinculado a outros dados."
  - `auth/email-already-registered` → "E-mail já cadastrado."
  - default → mensagem do banco.
- Substituir `toast.error(..., { description: error.message })` pelo helper em todas as páginas.

## Ordem de Execução

1. Apresentar SQL/migration (1 só) e aguardar OK.
2. RBAC: dialog "Criar Usuário" + perfil (nome, valor_hora).
3. CRUD MateriasPrimas + separação visual no Dashboard/Sidebar.
4. ProdutoDialog com Tabs + Ficha Técnica + BI.
5. Pedidos: itens persistidos + RPC finalizar/cancelar com baixa/estorno.
6. Botão Produzir + RPC.
7. Helper de erros amigáveis aplicado nas chamadas.

## Perguntas antes de começar

- **Criação de usuário pelo admin/master**: ok criar uma edge function `admin-create-user` (precisa Lovable Cloud + secret service role)? Ou prefere fluxo "convite por e-mail" (envio de link)?
- **Onde fica `valor_hora_trabalho`**: por usuário (no profile de quem cria o produto) ou global (uma config única na tabela `configuracoes`)?
- **"Finalizado" vs "Entregue"**: hoje os status são `Aguardando Pagamento, Confirmado, Em Preparo, Em Entrega, Entregue, Cancelado`. Qual status dispara a baixa de estoque? (Sugiro **Entregue**.)
- **Tabela `pedidos_itens`**: já existe? Se não, crio na mesma migration.

Posso seguir com essas decisões padrão se preferir: edge function para criar usuário, `valor_hora_trabalho` por usuário no profile, baixa em "Entregue", e crio `pedidos_itens` se ainda não existir.