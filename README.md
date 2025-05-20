# WhatsApp Bot

Um bot para WhatsApp com interface web para gerenciamento.

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