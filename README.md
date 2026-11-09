# Aether – Bibi Brigadeiros

Sistema de gestão (ERP) para confeitaria: clientes, pedidos, estoque de produtos, matérias-primas, ficha técnica, precificação e relatórios.

- **Produção:** <https://aether-bibibrigadeiros-bj5o.vercel.app>
- **Repositório:** <https://github.com/JuliaAlmd/aether-bibibrigadeiros>

## Sumário

- [Tecnologias](#tecnologias)
- [Como rodar localmente](#como-rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Conexão com o banco de dados](#conexão-com-o-banco-de-dados)
- [Endpoints](#endpoints)
- [Banco de dados](#banco-de-dados)
- [Autenticação e níveis de acesso](#autenticação-e-níveis-de-acesso)
- [Deploy](#deploy)
- [Solução de problemas](#solução-de-problemas)
- [Limitações conhecidas](#limitações-conhecidas)

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Interface | React 18, TypeScript, Vite |
| Estilo | Tailwind CSS, shadcn/ui |
| Rotas | React Router |
| Back-end | Supabase (PostgreSQL, Auth, REST e Edge Functions) |
| Hospedagem | Vercel |

Não há servidor próprio: o navegador fala direto com o Supabase, e as regras de acesso ficam no banco.

## Como rodar localmente

**Pré-requisitos:** Node.js 22 e npm, além de acesso a um projeto do Supabase.

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/JuliaAlmd/aether-bibibrigadeiros.git
   cd aether-bibibrigadeiros
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

   Use `npm install` em vez de `npm ci`: o `package-lock.json` está desatualizado e o `npm ci` falha. O comando também altera esse arquivo.

3. Crie um arquivo `.env.local` na raiz do projeto:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
   ```

   Os valores ficam no painel do Supabase, em **Project Settings > API**. Use o nome `.env.local`, que o Git ignora; um arquivo `.env` não é ignorado.

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse <http://localhost:8080>.

> **Atenção:** o ambiente local usa o banco indicado no `.env.local`. Se for o de produção, o que você criar ou apagar afeta os dados reais.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o ambiente de desenvolvimento na porta 8080 |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run build:dev` | Gera o build em modo de desenvolvimento |
| `npm run preview` | Serve localmente o conteúdo de `dist/` |
| `npm run lint` | Executa o ESLint (hoje há erros pendentes no projeto) |

O projeto ainda não tem testes automatizados.

## Variáveis de ambiente

O Vite só expõe ao navegador variáveis com o prefixo `VITE_`, e os valores entram no código durante o build. **Depois de alterar uma variável no Vercel, é preciso fazer um novo deploy.** Elas ficam públicas no site, então nunca coloque chaves secretas nelas.

| Variável | Obrigatória | Padrão | Uso |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Sim | – | Endereço do projeto no Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | – | Chave pública (anon) do Supabase |
| `VITE_APP_NAME` | Não | `Aether` | Nome exibido no sistema |
| `VITE_DEFAULT_CUSTO_FIXO_PCT` | Não | `10` | Custo fixo padrão (%) |
| `VITE_DEFAULT_MARGEM_PCT` | Não | `100` | Margem padrão (%) |
| `VITE_SHOW_DASHBOARD` | Não | `true` | Mostra Dashboard no menu |
| `VITE_SHOW_ESTOQUE` | Não | `true` | Mostra Estoque no menu |
| `VITE_SHOW_MATERIAS_PRIMAS` | Não | `true` | Mostra Matérias-Primas no menu |
| `VITE_SHOW_RELATORIOS` | Não | `true` | Mostra Relatórios no menu |
| `VITE_SHOW_CLIENTES` | Não | `true` | Mostra Clientes no menu |
| `VITE_SHOW_PEDIDOS` | Não | `true` | Mostra Pedidos no menu |
| `VITE_SHOW_LOJA` | Não | `true` | Mostra Loja no menu |
| `VITE_PRESENTATION_MODE` | Não | `false` | Modo de apresentação acadêmica |
| `VITE_PRESENTATION_PASSWORD` | Não | Definido em `src/lib/config.ts` | Senha do modo de apresentação |

> **Nunca ative `VITE_PRESENTATION_MODE` em produção.** Nesse modo, a senha de apresentação dá acesso de `master` com qualquer e-mail, sem passar pelo Supabase.

## Estrutura do projeto

```text
├── public/                         Arquivos estáticos
├── src/
│   ├── App.tsx                     Rotas e permissões por tela
│   ├── components/                 Componentes de interface
│   │   ├── dialogs/                Formulários (cliente, produto, pedido, matéria-prima)
│   │   └── ui/                     Componentes base (shadcn/ui)
│   ├── hooks/useAuth.tsx           Sessão, nível de acesso e proteção de rotas
│   ├── integrations/supabase/
│   │   └── client.ts               Conexão com o Supabase
│   ├── lib/config.ts               Leitura das variáveis de ambiente
│   └── pages/                      Telas do sistema
├── supabase/functions/create-user/ Edge Function de criação de usuários
└── vercel.json                     Redireciona as rotas para o index.html
```

## Conexão com o banco de dados

A conexão é criada em [`src/integrations/supabase/client.ts`](src/integrations/supabase/client.ts), usando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Se uma delas faltar, o sistema para ao abrir com uma mensagem de erro.

Para usar o banco em qualquer tela, importe o cliente:

```ts
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.from('clientes').select('*');
```

**Para trocar de banco:** atualize as duas variáveis no Vercel e faça um novo deploy. No novo projeto do Supabase, também é preciso recriar a estrutura do banco, publicar a função `create-user` e configurar as URLs em **Authentication > URL Configuration**.

As variáveis `SUPABASE_*`, `POSTGRES_*` e `NEXT_PUBLIC_*`, criadas pela integração do Vercel com o Supabase, **não são usadas por este projeto**.

## Endpoints

O projeto não tem uma API própria. O front-end usa as APIs geradas pelo Supabase, com a base `https://SEU-PROJETO.supabase.co`.

| Tipo | Rota | Uso no código |
|---|---|---|
| Autenticação | `/auth/v1/*` | `supabase.auth.*`, em `src/hooks/useAuth.tsx` |
| Tabelas (REST) | `/rest/v1/{tabela}` | `supabase.from('{tabela}')`, nas telas e nos formulários |
| Edge Function | `/functions/v1/create-user` | `supabase.functions.invoke('create-user')`, em `ConfiguracoesPage.tsx` |

### Onde consultar

- **Documentação das tabelas:** no painel do Supabase, em **API Docs**, com exemplos por tabela.
- **Edge Functions e logs:** no painel do Supabase, em **Edge Functions** e **Logs**.
- **Chamadas no código:** procure por `supabase.from(`, `supabase.auth` e `supabase.functions`.
- **Chamadas em execução:** nas ferramentas do navegador (`F12`), aba **Rede**.

### `POST /functions/v1/create-user`

Cria um usuário com o e-mail já confirmado, sem enviar e-mail. Exige login como `admin` ou `master`, e só `master` pode criar outro `master`.

```json
{
  "email": "pessoa@exemplo.com",
  "password": "minimo6caracteres",
  "nome": "Nome da Pessoa",
  "role": "funcionario"
}
```

| Status | Significado |
|---|---|
| `200` | Usuário criado: `{ "ok": true, "user_id": "..." }` |
| `400` | Campos ausentes, nível inválido, senha curta ou e-mail recusado |
| `401` | Sem login válido |
| `403` | Sem permissão |
| `500` | Erro interno |

Para publicar uma alteração na função:

```bash
supabase functions deploy create-user --project-ref SEU-PROJETO
```

## Banco de dados

| Tabela | Conteúdo |
|---|---|
| `profiles` | Dados do usuário (nome, foto, valor da hora de trabalho) |
| `user_roles` | Nível de acesso de cada usuário |
| `clientes` | Cadastro de clientes |
| `pedidos` | Pedidos e status |
| `pedidos_itens` | Produtos de cada pedido |
| `produtos` | Produtos finais, preços e estoque |
| `categorias` | Categorias do cardápio (Brigadeiros, Brownies, Biscoitos, Presentes) e do cadastro de produtos |
| `cardapio_itens` | Itens à venda na loja (`/comprar`): categoria, nome, preço, disponibilidade, destaque e `produto_id` (liga ao estoque em `produtos`) |
| `sabores` | Sabores de brigadeiro exibidos na loja |
| `materias_primas` | Insumos e estoque |
| `fichas_tecnicas` | Insumos usados em cada produto |
| `movimentacoes_estoque` | Histórico de movimentações |
| `fornecedores` | Fornecedores |
| `despesas` | Despesas |

Ao finalizar um pedido na loja, a função `criar_pedido_loja` (no banco) acha/cria o cliente pelo e-mail, grava o pedido em `pedidos`/`pedidos_itens` e baixa o estoque dos itens que têm `produto_id`. Para ligar um item do cardápio a um produto: `update public.cardapio_itens set produto_id = <id> where nome = '<item>';`.

**Status de pedido:** `Aguardando Pagamento`, `Confirmado`, `Em Preparo`, `Em Entrega`, `Entregue` e `Cancelado`.

**Gatilho `on_auth_user_created`:** ao criar um usuário, cria o perfil dele e define o nível `funcionario`.

> O repositório não tem migrations: a estrutura existe apenas no projeto do Supabase. Para recriá-la em outro projeto, é preciso exportá-la antes, por exemplo com `supabase db dump`. Faça também backups periódicos.

## Autenticação e níveis de acesso

O login usa e-mail e senha pelo Supabase Auth. As contas podem ser criadas de duas formas:

| Origem | Rota | Confirmação de e-mail | Nível inicial |
|---|---|---|---|
| Tela de cadastro | `/signup` | Conforme a configuração do Supabase | `funcionario` |
| Configurações | `/configuracoes` | Não precisa | Escolhido por quem cria |

| Tela | Rota | `cliente` | `funcionario` | `admin` | `master` |
|---|---|---|---|---|---|
| Clientes | `/clientes` | – | Sim | Sim | Sim |
| Pedidos | `/pedidos` | – | Sim | Sim | Sim |
| Perfil | `/perfil` | – | Sim | Sim | Sim |
| Estoque | `/estoque` | – | – | Sim | Sim |
| Matérias-Primas | `/materias-primas` | – | – | Sim | Sim |
| Dashboard | `/dashboard` | – | – | – | Sim |
| Relatórios | `/relatorios` | – | – | – | Sim |
| Configurações | `/configuracoes` | – | – | – | Sim |
| Loja | `/comprar` | Sim | – | – | Sim |

Contas sem nível definido são levadas para `/acesso-pendente`. As rotas ficam em [`src/App.tsx`](src/App.tsx), e o menu, em [`src/components/Sidebar.tsx`](src/components/Sidebar.tsx). Esses controles só organizam a interface: a proteção dos dados depende das políticas de RLS no Supabase.

Para definir o primeiro `master` em um banco novo, cadastre a conta e execute no **SQL Editor** do Supabase:

```sql
update public.user_roles r
set role = 'master'
from auth.users u
where r.user_id = u.id
  and u.email = 'seu-email@exemplo.com';
```

### URLs de redirecionamento

No Supabase, em **Authentication > URL Configuration**:

- **Site URL:** `https://aether-bibibrigadeiros-bj5o.vercel.app`
- **Redirect URLs:** `https://aether-bibibrigadeiros-bj5o.vercel.app/**`

Para testar links de e-mail localmente, inclua também `http://localhost:8080/**`.

## Deploy

O deploy é automático no Vercel:

- Envio para o `main` publica em produção.
- Envio para outras branches gera um link de pré-visualização.

**Configuração do projeto no Vercel:** framework Vite, comando `npm run build`, pasta de saída `dist` e as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

> Este repositório é um fork. Ao abrir um pull request, confira se o destino é `JuliaAlmd/aether-bibibrigadeiros`, branch `main`. O GitHub pode sugerir o repositório original, e o merge lá não atualiza o site.

## Solução de problemas

| Problema | Causa provável | Solução |
|---|---|---|
| Tela em branco com "Defina VITE_SUPABASE_URL..." | Variáveis ausentes | Crie o `.env.local` ou configure no Vercel e faça um novo deploy |
| `Failed to fetch` no login ou cadastro | Endereço do Supabase errado ou projeto pausado | Confira a variável e o status do projeto |
| Alterei a variável e nada mudou | O valor entra no build | Faça um novo deploy; localmente, reinicie o `npm run dev` |
| `email rate limit exceeded` | Limite do e-mail padrão do Supabase | Crie o usuário em Configurações, configure um SMTP próprio ou aguarde |
| `Database error saving new user` | Falha no gatilho de novos usuários | Veja **Logs > Postgres** no Supabase |
| "Acesso Pendente" para quem tem nível | Registro ausente em `user_roles` | Confira a tabela e entre novamente |
| "Erro ao criar usuário" em Configurações | Função não publicada ou sem permissão | Veja **Edge Functions > create-user > Logs** |
| Link de confirmação abre o endereço errado | URLs não configuradas | Veja [URLs de redirecionamento](#urls-de-redirecionamento) |
| `npm ci` falha | `package-lock.json` desatualizado | Use `npm install` |

## Limitações conhecidas

- As políticas de acesso por nível às tabelas ainda estão em revisão. Use dados fictícios até a conclusão.
- O repositório não tem migrations nem testes automatizados.
- O botão "Cadastrar com Google" na tela de cadastro ainda não tem função.
- A tela de cadastro informa mínimo de 8 caracteres, mas o código aceita 6.
- O `package-lock.json` está desatualizado, e o `npm run lint` aponta erros pendentes.
