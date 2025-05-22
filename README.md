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

## Configuração do Ambiente

### Requisitos

- Node.js versão 18.x
- NPM ou Yarn
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

3. Inicie o servidor:
```
npm start
```

4. Acesse a aplicação em `http://localhost:3000`

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
6. Faça deploy da aplicação: `git push heroku master`

## Troubleshooting

- **Erro de conexão com a API**: Verifique se a URL configurada em `js/dashboard.js` está correta
- **QR Code não aparece**: Verifique se o servidor backend está rodando corretamente
- **Erro ao escanear QR Code**: Tente gerar um novo QR Code e verifique se o WhatsApp do celular está atualizado

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Estrutura do Projeto

```
whatsapp-bot/
├── assets/         # Imagens, ícones e outros recursos
├── css/           # Arquivos de estilo
│   ├── styles.css
│   └── dashboard.css
├── js/            # Arquivos JavaScript
│   ├── script.js
│   └── dashboard.js
├── pages/         # Páginas HTML
│   ├── index.html    # Página de login
│   └── dashboard.html # Dashboard principal
├── index.html     # Página de redirecionamento
└── README.md      # Documentação do projeto
```

## Funcionalidades

- Sistema de login com autenticação
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
2. Abra o arquivo `index.html` na raiz do projeto em seu navegador
3. O sistema irá:
   - Redirecionar para o dashboard se você já estiver logado
   - Redirecionar para a página de login se não estiver logado
4. Faça login com as credenciais fornecidas

## Fluxo de Navegação

1. Usuário acessa `index.html`
2. Sistema verifica se há credenciais salvas:
   - Se houver: redireciona para o dashboard
   - Se não houver: redireciona para a página de login
3. Após login bem-sucedido: redireciona para o dashboard
4. No dashboard: navegação SPA entre as diferentes seções

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- LocalStorage para persistência de dados
- Font Awesome para ícones 