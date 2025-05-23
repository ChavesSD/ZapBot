# ZapBot - Automação para WhatsApp

Interface web para gerenciamento de automações para WhatsApp.

## Acesso Online

A aplicação está disponível online em:
- Frontend: [https://zapbot-wpp.herokuapp.com/](https://zapbot-wpp.herokuapp.com/)

## Principais Funcionalidades

- Conexão com WhatsApp através de QR Code
- Envio de mensagens de teste
- Criação de fluxos de conversação automáticos
- Editor visual de fluxogramas para criar fluxos
- Banco de dados MongoDB para armazenamento persistente

## Configuração do Ambiente

### Requisitos

- Node.js versão 18.x
- NPM ou Yarn
- MongoDB (local ou remoto)
- Conta no Heroku (para deploy)

### Instalação Local

1. Clone o repositório:
```
git clone https://github.com/ChavesSD/ZapBot.git
cd ZapBot
```

2. Instale as dependências:
```
npm install
```

3. Configure o banco de dados:
   - Instale o MongoDB localmente ou use um serviço de nuvem como MongoDB Atlas.
   - Crie um arquivo `.env` na raiz do projeto com base no modelo `config/.env.example`.
   - Configure a URL de conexão com o MongoDB na variável `MONGODB_URI`.

4. Inicie o servidor:
```
npm start
```

5. Acesse a aplicação em `http://localhost:3000`

## Banco de Dados

O ZapBot utiliza MongoDB para armazenamento persistente de dados:

- **Usuários**: Armazena informações de login, perfis e permissões
- **Fluxos**: Armazena configurações de fluxos de conversação, incluindo nós e conexões

Na primeira inicialização, o sistema criará automaticamente um usuário administrador:
- Email: `adm@zapbot.com`
- Senha: `adm123`

## Conexão com WhatsApp

Para utilizar todas as funcionalidades da aplicação, é necessário configurar um servidor backend do WhatsApp. O ZapBot utiliza uma API compatível com WPPConnect.

### Opções para Backend:

1. **API remota (recomendado)**
   - A aplicação está configurada para usar o endpoint `https://zapbot-wpp.herokuapp.com/api`
   - Você pode modificar este endpoint no arquivo `js/dashboard.js`

2. **Servidor local**
   - Clone e configure o [WPPConnect Server](https://github.com/wppconnect-team/wppconnect-server)
   - Altere a URL da API para `http://localhost:21465/api`

## Deploy no Heroku

A aplicação está configurada para deploy no Heroku. Siga estas etapas:

1. Crie uma conta no [Heroku](https://heroku.com)
2. Instale o [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Faça login na sua conta Heroku: `heroku login`
4. Crie um novo app: `heroku create zapbot-wpp`
5. Configure o Node.js e Express para funcionar com o Heroku 
6. Adicione um add-on para MongoDB: `heroku addons:create mongodb`
7. Configure as variáveis de ambiente: `heroku config:set JWT_SECRET=seu_segredo_jwt`
8. Faça deploy da aplicação: `git push heroku master`

## Troubleshooting

- **Erro de conexão com a API**: Verifique se a URL configurada em `js/dashboard.js` está correta
- **QR Code não aparece**: Verifique se o servidor backend está rodando corretamente
- **Erro ao escanear QR Code**: Tente gerar um novo QR Code e verifique se o WhatsApp do celular está atualizado
- **Erro de conexão com MongoDB**: Verifique a URI de conexão e certifique-se de que o serviço está rodando

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Estrutura do Projeto

```
whatsapp-bot/
├── api/           # Controllers e rotas da API
├── assets/        # Imagens, ícones e outros recursos
├── config/        # Configurações do banco de dados
├── css/           # Arquivos de estilo
├── js/            # Arquivos JavaScript
├── middleware/    # Middlewares (autenticação, etc.)
├── models/        # Modelos de dados Mongoose
├── pages/         # Páginas HTML
├── .env           # Variáveis de ambiente (não versionado)
├── server.js      # Servidor Express
└── README.md      # Documentação do projeto
```

## Funcionalidades

- Sistema de login com autenticação JWT
- Armazenamento persistente em MongoDB
- Opção de "Lembrar senha"
- Interface responsiva
- Design moderno inspirado no WhatsApp
- Dashboard com estatísticas
- Sistema de conexão via QR Code
- Gerenciamento de fluxos de conversação
- Configurações personalizáveis

## Credenciais de Acesso

- Email: adm@zapbot.com
- Senha: adm123

## Como Executar

1. Clone este repositório
2. Configure o arquivo `.env` com a conexão MongoDB
3. Execute `npm install` para instalar dependências
4. Execute `npm start` para iniciar o servidor
5. Acesse `http://localhost:3000` em seu navegador

## Fluxo de Navegação

1. Usuário acessa `index.html`
2. Sistema verifica se há token JWT válido:
   - Se houver: redireciona para o dashboard
   - Se não houver: redireciona para a página de login
3. Após login bem-sucedido: redireciona para o dashboard
4. No dashboard: navegação SPA entre as diferentes seções

## Tecnologias Utilizadas

- HTML5, CSS3, JavaScript (Vanilla)
- Node.js e Express
- MongoDB e Mongoose
- JWT para autenticação
- LocalStorage para persistência temporária
- Font Awesome para ícones 