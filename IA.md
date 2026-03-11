```markdown
# 📊 Integração Telegram + IA para Registro de Transações Financeiras

## 🎯 Objetivo
Permitir que o usuário registre **receitas e despesas** enviando **texto ou áudio no Telegram**.  
A mensagem será interpretada por uma **IA**, convertida em **JSON estruturado** e enviada para o **backend do sistema financeiro**.

Exemplo de mensagem:

```

gastei 45 reais no mercado hoje

````

JSON esperado:

```json
{
  "tipo": "despesa",
  "valor": 45,
  "categoria": "mercado",
  "descricao": "compras",
  "data": "2026-03-11"
}
````

---

# 🏗️ Arquitetura da Solução

```
Telegram Bot
     ↓
Webhook
     ↓
n8n (orquestração)
     ↓
Serviço de IA em Python
     ↓
Backend Financeiro
     ↓
Resposta ao usuário
```

## Tecnologias Utilizadas

| Camada              | Ferramenta                   |
| ------------------- | ---------------------------- |
| Mensageria          | Telegram Bot                 |
| Orquestração        | n8n                          |
| Processamento de IA | Python                       |
| Speech-to-Text      | Whisper                      |
| API                 | Backend financeiro existente |

---

# 📦 Componentes do Sistema

## 1️⃣ Telegram Bot

Criar o bot usando **BotFather**.

Responsabilidades:

* Receber mensagens de texto
* Receber áudios
* Encaminhar dados para o webhook
* Retornar respostas ao usuário

Fluxo:

```
Telegram → Webhook → n8n
```

---

# 2️⃣ n8n (Orquestração)

Responsável por gerenciar o fluxo da automação.

### Responsabilidades

* Receber mensagens do Telegram
* Identificar se a mensagem é **texto ou áudio**
* Se áudio → enviar para transcrição
* Enviar texto para o serviço de IA
* Receber JSON estruturado
* Enviar requisição ao backend
* Responder o usuário no Telegram

### Workflow

```
Telegram Trigger
     ↓
IF (é áudio?)
     ↓
Transcrição
     ↓
Enviar texto para IA
     ↓
Receber JSON
     ↓
HTTP Request → Backend
     ↓
Responder Telegram
```

---

# 3️⃣ Microserviço de IA (Python)

Serviço responsável por **interpretar o texto e extrair dados financeiros**.

### Framework recomendado

* FastAPI

### Endpoint

```
POST /interpretar-transacao
```

### Entrada

```json
{
 "texto": "paguei 80 reais de gasolina ontem"
}
```

### Saída

```json
{
 "tipo": "despesa",
 "valor": 80,
 "categoria": "combustivel",
 "descricao": "gasolina",
 "data": "2026-03-10"
}
```

---

# 🎤 Processamento de Áudio

Fluxo de tratamento de mensagens de voz:

```
Telegram envia áudio
     ↓
n8n baixa arquivo
     ↓
Whisper faz transcrição
     ↓
Texto gerado
     ↓
Texto enviado para IA
```

---

# 🧠 Prompt para Extração de Dados

Exemplo de prompt utilizado na IA:

```
Extraia os dados financeiros do texto e retorne apenas um JSON válido
com os seguintes campos:

tipo
valor
categoria
descricao
data
```

---

# 📡 Integração com Backend

Após gerar o JSON, enviar para o backend.

Endpoint sugerido:

```
POST /transactions
```

Exemplo de payload:

```json
{
 "userId": 1,
 "tipo": "despesa",
 "valor": 35,
 "categoria": "alimentacao",
 "descricao": "almoço"
}
```

---

# 📅 Plano de Execução

## Fase 1 — Criar Bot Telegram

Tempo estimado: **1 a 2 horas**

Etapas:

* Criar bot no BotFather
* Obter token
* Configurar webhook
* Integrar webhook ao n8n

Resultado esperado:

```
Mensagens chegando no n8n
```

---

## Fase 2 — Criar Workflow no n8n

Tempo estimado: **2 a 3 horas**

Etapas:

```
Telegram Trigger
↓
Identificar tipo da mensagem
↓
Chamar IA
↓
Enviar JSON para backend
↓
Responder usuário
```

---

## Fase 3 — Criar Serviço de IA

Tempo estimado: **2 a 4 horas**

Etapas:

```
Criar API com FastAPI
↓
Criar endpoint interpretar-transacao
↓
Implementar prompt para extração de dados
↓
Retornar JSON estruturado
```

---

## Fase 4 — Suporte a Áudio

Tempo estimado: **2 horas**

Etapas:

```
Download do áudio
↓
Transcrição com Whisper
↓
Enviar texto para IA
```

---

# 🔐 Boas Práticas

## Validação de Dados

Sempre validar:

* valor numérico
* categoria existente
* data válida

---

## Logs

Registrar:

```
Mensagem original
JSON gerado
Resposta do backend
```

---

## Fallback

Caso a IA não consiga interpretar:

```
Não consegui identificar a transação.
Pode reformular a mensagem?
```

---

# 🚀 Evoluções Futuras

## Consultas via Chat

Usuário pergunta:

```
quanto gastei com comida esse mês?
```

Fluxo:

```
IA identifica intenção
↓
Consulta backend
↓
Resposta via Telegram
```

---

## Categorização Inteligente

A IA aprende categorias frequentes do usuário.

---

## Relatório Automático

Exemplo de mensagem enviada pelo bot:

```
Você gastou R$ 820 esta semana.
Maior categoria: alimentação.
```

---

# 🧠 Arquitetura Final Resumida

```
Telegram
   ↓
Webhook
   ↓
n8n
   ↓
Serviço de IA em Python
   ↓
Backend Financeiro
   ↓
Resposta no Telegram
```

```
```
