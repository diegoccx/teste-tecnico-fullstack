# Full Stack Challenge: Multi-Tenant Invitation & Micro-CMS System

## 📝 Descrição do Projeto - Intellux Drive
O objetivo deste desafio é desenvolver uma aplicação funcional de gerenciamento de arquivos (Micro-Drive) com suporte a múltiplos níveis de acesso (Multi-tenant) e um sistema de convites hierárquico. A aplicação deve permitir que administradores gerenciem a entrada de novas organizações e que os membros destas façam upload de arquivos de texto e imagens, compartilhem-nos com colegas da mesma organização e mantenham o isolamento total de dados entre empresas distintas.

## ⏱️ Prazo e Condições de Entrega
* **Tempo Limite:** Máximo de 7 dias corridos a partir do recebimento deste briefing.
* **Repositório:** Código hospedado no GitHub com commits organizados.

---

## 🛠️ Stack Tecnológica
* **Frontend:** React (v18+), Sass.
* **Backend:** Node.js com NestJS.
* **Banco de Dados:** MySQL.
* **Infraestrutura (Opcional/Diferencial):** Uso de serviços da AWS (Free Tier).

---

## ⚙️ Requisitos Funcionais

### 1. Hierarquia de Usuários e Convites
* **Nível 1: Super Admin (Plataforma)**
  * Possui acesso exclusivo ao painel de controle da plataforma.
  * Funcionalidade de enviar convites por e-mail/token para novos Owners.
  * **Não** possui acesso e não visualiza o conteúdo das organizações.
* **Nível 2: Owner (Dono de Organização)**
  * Recebe o convite do Super Admin e realiza o cadastro inicial (ativação da conta e da organização).
  * Envia convites para novos Users vinculados diretamente à sua própria organização.
  * Gerencia o time e possui permissões administrativas sobre o conteúdo.
* **Nível 3: User (Membro do Time)**
  * Recebe o convite do Owner e realiza o cadastro de perfil.
  * Faz upload de arquivos de texto e imagens e pode compartilhá-los com outros membros da mesma organização.

### 2. Fluxo de Convite Criptográfico
* Geração de tokens únicos, seguros (UUIDv4 ou hashes assinados) e expiráveis (máximo de 48 horas).
* Rota pública no Frontend que consome o token via query param para renderizar a tela de ativação de perfil.

### 3. Matriz de Controle de Acesso (RBAC) & Isolamento de Dados (Multi-tenancy)
O sistema deve garantir o isolamento horizontal absoluto de dados entre organizações diferentes através do ID da organização (`organization_id`). Além disso, deve respeitar estritamente a matriz de permissões abaixo no Frontend (ocultando componentes) e no Backend (retornando `HTTP 403 Forbidden`):

> **Regra de visibilidade de arquivos:** Um **User** enxerga apenas os arquivos que ele próprio enviou, mais quaisquer arquivos que outros membros da **mesma organização** tenham compartilhado explicitamente com ele. O **Owner** enxerga todo o conteúdo da organização. O compartilhamento é estritamente intra-organizacional — nenhum arquivo pode ser compartilhado com membros de outra organização. O isolamento deve ser aplicado tanto nas queries do backend (filtro por `created_by` e tabela de permissões de compartilhamento) quanto na renderização condicional do frontend.


| Recurso | Ação | Super Admin | Owner | User |
| :--- | :--- | :--- | :--- | :--- |
| **Organizações & Convites Globais** | Criar/Enviar | ✅ Permitido | ❌ Negado | ❌ Negado |
| **Convites Internos da Org** | Criar/Enviar | ❌ Negado | ✅ Permitido | ❌ Negado |
| **Arquivos (Texto / Imagem)** | **Upload** (Enviar) | ❌ Negado | ✅ Permitido | ✅ Permitido |
| **Arquivos (Texto / Imagem)** | **Read** (Visualizar) | ❌ Negado | ✅ Permitido (Toda a Org) | ✅ Permitido (Próprios + Compartilhados consigo) |
| **Arquivos (Texto / Imagem)** | **Update** (Editar metadados) | ❌ Negado | ✅ Permitido (Sua Org) | ✅ Permitido (Apenas os seus) |
| **Arquivos (Texto / Imagem)** | **Delete** (Excluir) | ❌ Negado | ✅ Permitido (Qualquer um da Org) | ❌ Negado |
| **Compartilhamento** | **Compartilhar** | ❌ Negado | ✅ Permitido (Intra-org) | ✅ Permitido (Apenas os seus, intra-org) |
| **Filtros (Data / Usuário)** | **Aplicar** | ❌ Negado | ✅ Disponível (Toda a Org) | ✅ Disponível (Apenas nos seus e compartilhados) |

---

## 🎨 Telas do Frontend

1. **Tela de Login:** Autenticação padrão utilizando e-mail e senha com JWT.
2. **Dashboard do Super Admin:**
   * Visualização de métricas de volumetria global (total de organizações ativas, taxa global de aceite de convites).
   * Formulário para envio de novos convites de Owners.
3. **Dashboard do Owner (Gestão de Time):**
   * Visualização do total de usuários ativos na organização e status dos convites enviados (pendentes vs. aceitos).
   * Formulário para envio de novos convites para a sua organização.
4. **Home da Plataforma (Área de Trabalho de Arquivos):**
   * Tela compartilhada entre **Owner** e **User** com renderização condicional baseada na role.
   * **Listagem de Arquivos de Texto:** Exibe os arquivos `.txt` / `.md` enviados via upload (não há editor interno — o arquivo é enviado do dispositivo do usuário). Deve exibir nome do arquivo, autor e data de envio. Inclui barra de pesquisa por nome.
   * **Grid de Imagens:** Visualização das imagens enviadas via upload em formato responsivo (mosaico ou grid).
   * **Upload de Arquivos:** Botão/Modal acessível por Owners e Users para selecionar e enviar arquivos do dispositivo (texto ou imagem) diretamente para o servidor.
   * **Compartilhamento Intra-organizacional:** Cada arquivo enviado pode ser compartilhado com um ou mais membros da **mesma organização**. O compartilhamento é feito via modal de seleção de membros (somente membros da org aparecem na lista). Arquivos compartilhados aparecem na listagem do destinatário com indicação visual de que foram compartilhados por outro membro.
   * **Filtros:** Painel de filtros disponível na listagem de arquivos de texto e na galeria de imagens:
     * **Por Data:** Seleção de intervalo (data inicial e data final) para filtrar pelo campo `uploaded_at`.
     * **Por Usuário:** Disponível **somente para o Owner**; permite selecionar um membro da organização e visualizar apenas os arquivos enviados por ele.
   * **Isolamento de visibilidade:** Um **User** visualiza somente os arquivos que ele mesmo enviou mais os que foram compartilhados com ele por membros da mesma org. Um **Owner** visualiza todos os arquivos da organização e pode usar os filtros acima para segmentar a visualização.

---

## 🔒 Requisitos Não Funcionais & Arquitetura

### Backend (NestJS + MySQL)
* **ORM:** Uso obrigatório de TypeORM. Migrations devem ser configuradas para estruturar o banco.
* **Segurança:** Implementação de Guards do NestJS para validação do JWT e checagem de Roles/Tenancy.
* **Validação:** Uso de `class-validator` e `class-transformer` para sanear payloads de entrada.
* **Upload de Arquivos:** O salvamento de arquivos (textos e imagens) deve ser feito via upload real do dispositivo do usuário. O armazenamento pode ser local no disco (estáticos servidos pelo próprio servidor) ou em serviço de object storage (AWS S3 ou equivalente, considerado diferencial). Não deve haver editor de texto interno — o conteúdo é sempre enviado como arquivo.
* **Compartilhamento:** Implementar uma tabela de permissões de compartilhamento (`file_shares`) relacionando arquivo × membro destinatário, garantindo que o destinatário sempre pertença à mesma organização do proprietário do arquivo (validado no backend).

### Frontend (React)
* **Gerenciamento de Estado:** Uso de Context API ou Zustand para o estado global de autenticação.
* **Formulários:** Validação robusta com React Hook Form integrado a Zod ou Yup.
* **Estilização:** Por conta do candidato.

---

## 📊 Critérios de Avaliação
* **Arquitetura de Software:** Separação de responsabilidades no NestJS, modularidade e componentização limpa no React.
* **Conceito de Multi-tenancy:** Garantia lógica de que nenhuma brecha de API permita que um usuário veja ou altere dados de outra organização.
* **Tratamento de Erros:** Respostas HTTP adequadas no backend e tratamento visual de falhas/erros de validação no frontend.
* **Qualidade do Código:** Uso correto do TypeScript, tipagem estrita, legibilidade e aplicação de princípios Clean Code.

---

## 📦 Formato de Entrega
1. **README.md detalhado contendo:**
   * Instruções passo a passo de como rodar o Backend, Frontend e o banco de dados MySQL localmente.
   * Script, comando ou instrução de Seed para a criação do primeiro **Super Admin** no banco de dados.
   * Documentação simplificada dos endpoints principais (ou export do arquivo JSON do Postman/Insomnia).
2. **Link do Repositório.**
3. **Deploy na Vercel (obrigatório):**
   * O Frontend deve estar publicado na [Vercel](https://vercel.com) e acessível via URL pública para que a equipe possa avaliar o funcionamento da aplicação sem precisar rodar o projeto localmente.
   * Inclua no README o link do deploy (ex.: `https://seu-projeto.vercel.app`).
   * Variáveis de ambiente sensíveis (URL da API, chaves JWT etc.) devem ser configuradas nas **Environment Variables** do projeto na Vercel — nunca commitadas no repositório.
   * O Backend pode ser hospedado em qualquer serviço de sua preferência (Railway, Render, Fly.io, AWS EC2 Free Tier etc.); inclua também o link base da API no README.

---

Boa sorte! Avaliaremos o seu teste com o mesmo rigor técnico aplicado no dia a dia da nossa engenharia.
