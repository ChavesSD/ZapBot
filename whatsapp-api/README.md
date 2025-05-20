# Backend API WhatsApp com WPPConnect

Esta é uma API simples que permite conectar sua aplicação ao WhatsApp usando a biblioteca WPPConnect.

## Pré-requisitos

- Node.js (recomendado v14 ou superior)
- NPM ou Yarn

## Instalação

1. Clone este repositório (ou baixe os arquivos)
2. Navegue até a pasta do projeto
3. Instale as dependências:

```bash
npm install
```

## Executando o servidor

Para iniciar o servidor, execute:

```bash
npm start
```

O servidor estará rodando em `http://localhost:8000`.

## Rotas da API

### Iniciar Sessão
```
POST /start
```
Inicia uma sessão do WhatsApp e gera um novo QR Code.

### Obter QR Code
```
GET /qrcode
```
Retorna o QR Code em formato base64 para ser escaneado pelo WhatsApp.

### Enviar Mensagem
```
POST /send
```
Envia uma mensagem para um número.

Corpo da requisição:
```json
{
  "number": "5511999999999",
  "message": "Olá, isso é um teste!"
}
```

## Como usar com o Frontend

1. Inicie o servidor backend (esta aplicação)
2. Acesse o frontend em seu navegador
3. Na tela "Conectar", clique em "Gerar Novo QR Code"
4. Escaneie o QR Code com seu WhatsApp
5. Após conectado, você poderá enviar mensagens pela API

## Observações

- O WhatsApp Web não permite múltiplas sessões ativas ao mesmo tempo
- Mantenha o servidor rodando para manter a conexão com o WhatsApp
- Ao se desconectar, pode ser necessário reiniciar o servidor 