# Dashboard de Equipo — Tivenos Group

Dashboard de control de tareas del equipo por marca, con datos en tiempo real desde ClickUp.

## Deploy en Vercel (5 minutos)

### 1. Subir a GitHub
- Creá un repositorio nuevo en GitHub (puede ser privado)
- Subí todos estos archivos manteniendo la estructura de carpetas

### 2. Conectar con Vercel
- Entrá a **vercel.com** y conectá tu cuenta de GitHub
- "Add New Project" → seleccioná el repositorio
- Vercel detecta automáticamente la configuración

### 3. Agregar el token de ClickUp
- En Vercel, antes de hacer deploy: **Environment Variables**
- Agregá:
  - **Name:** `CLICKUP_TOKEN`
  - **Value:** tu token de ClickUp (empieza con `pk_`)
- Deploy

### 4. ¡Listo!
Tu URL quedará algo como: `https://dashboard-tivenos.vercel.app`

## Cómo funciona

Cada vez que abrís la URL o hacés clic en **Actualizar**:
1. El navegador llama a `/api/tasks`
2. Vercel ejecuta la función serverless que consulta ClickUp
3. El dashboard se renderiza con datos frescos

No hay base de datos. No hay intervención manual.

## Workspaces configurados

| Marca    | Workspace ID   |
|----------|----------------|
| EBDS     | 90132956682    |
| Sibila   | 90132956656    |
| ZoWeAre  | 90132956693    |
| BHU      | 90132956644    |
| Tivenos  | 90131113078    |

## Estructura del proyecto

```
dashboard-tivenos/
├── vercel.json          # Configuración de rutas
├── package.json
├── api/
│   └── tasks.js         # Función serverless → llama a ClickUp API
└── public/
    └── index.html       # Dashboard HTML completo
```
