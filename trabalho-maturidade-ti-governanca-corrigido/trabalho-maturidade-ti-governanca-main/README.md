# Avaliação de Maturidade de TI

Este projeto é uma aplicação web para avaliação de maturidade de TI, construída com React, Express, TypeScript, Drizzle ORM e MySQL.

## Compatibilidade

Este projeto foi desenvolvido para ser compatível com sistemas operacionais **Windows** e **Linux**.

## Pré-requisitos

Certifique-se de ter os seguintes softwares instalados em seu sistema:

*   [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
*   [pnpm](https://pnpm.io/installation) (gerenciador de pacotes)
*   [MySQL Server](https://dev.mysql.com/downloads/mysql/) (versão 8.0 ou superior)

## Configuração do Ambiente

1.  **Clone o repositório:**

    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd ti_maturity_assessment
    ```

2.  **Instale as dependências:**

    ```bash
    pnpm install
    ```

3.  **Configuração do Banco de Dados MySQL:**

    *   **Crie um banco de dados:**

        ```sql
        CREATE DATABASE IF NOT EXISTS ti_maturity_assessment;
        ```

    *   **Crie um usuário e conceda permissões (opcional, mas recomendado para produção):**

        ```sql
        CREATE USER 'seu_usuario'@'localhost' IDENTIFIED BY 'sua_senha';
        GRANT ALL PRIVILEGES ON ti_maturity_assessment.* TO 'seu_usuario'@'localhost';
        FLUSH PRIVILEGES;
        ```

        Para desenvolvimento local, você pode usar o usuário `root` sem senha (como configurado durante a correção dos erros). No entanto, **NÃO RECOMENDADO PARA AMBIENTES DE PRODUÇÃO**.

4.  **Crie o arquivo de variáveis de ambiente:**

    Crie um arquivo `.env` na raiz do projeto (pasta `ti_maturity_assessment/`) e adicione a seguinte linha, substituindo `seu_usuario` e `sua_senha` pelos dados do seu banco de dados:

    ```
    DATABASE_URL="mysql://seu_usuario:sua_senha@localhost:3306/ti_maturity_assessment"
    ```

    Se estiver usando o usuário `root` sem senha (apenas para desenvolvimento local):

    ```
    DATABASE_URL="mysql://root:@localhost:3306/ti_maturity_assessment"
    ```

5.  **Execute as migrações do banco de dados:**

    ```bash
    pnpm db:push
    ```

## Executando o Projeto

### Modo de Desenvolvimento

```bash
pnpm dev
```

Isso iniciará o servidor de desenvolvimento e o cliente Vite. A aplicação estará disponível em `http://localhost:3000` (ou outra porta disponível).

### Modo de Produção

1.  **Construa o projeto:**

    ```bash
    pnpm build
    ```

2.  **Inicie o servidor:**

    ```bash
    pnpm start
    ```

## Executando Testes

```bash
pnpm test
```

## Observações sobre Compatibilidade

*   **Caminhos de Arquivo:** O projeto utiliza ferramentas e módulos Node.js que abstraem as diferenças de separadores de caminho entre Windows (`\`) e Linux (`/`).
*   **Variáveis de Ambiente:** O uso do `dotenv` garante que as variáveis de ambiente sejam carregadas de forma consistente em ambos os sistemas.
*   **Sensibilidade a Maiúsculas/Minúsculas:** Certifique-se de que os nomes de arquivos e importações respeitem a capitalização correta, pois sistemas Linux são sensíveis a maiúsculas e minúsculas.
