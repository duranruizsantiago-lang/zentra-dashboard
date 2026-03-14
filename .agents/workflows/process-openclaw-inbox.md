---
description: Procesa las órdenes (bug fixes o arquitectura) generadas proactivamente por OpenClaw
---
# Process OpenClaw Inbox

Este workflow revisa el archivo `ANTIGRAVITY_INBOX.md` en busca de tareas asignadas por el Agente Orquestador (OpenClaw) y las ejecuta una por una.

## Instrucciones de Ejecución

1. **Revisar si hay un Inbox:**
Usa la terminal para buscar si el archivo existe en la raíz de los proyectos (ej. Zentra API o Dashboard).
```bash
// turbo
cat /Users/usuario/Desktop/zentra-dashboard/ANTIGRAVITY_INBOX.md || echo "No hay tareas pendientes en Dashboard"
cat /Users/usuario/Desktop/zentra-api/ANTIGRAVITY_INBOX.md || echo "No hay tareas pendientes en API"
```

2. **Procesamiento de Tareas:**
Si encuentras órdenes en estado `🔴 PENDIENTE`, lee cuidadosamente el contexto y los archivos implicados usando tus herramientas (`view_file`, `grep_search`).

3. **Ejecución y Testing:**
Modifica el código tal como lo ordenó OpenClaw. Una vez terminado, corre los tests que OpenClaw sugirió en la sección "Criterio de Éxito (QA)".

4. **Marcar como completado:**
Cuando la tarea esté arreglada y testeada, modifica el archivo `ANTIGRAVITY_INBOX.md` para cambiar el estado de la tarea procesada a `🟢 COMPLETADA`. Agrega un pequeño log de los archivos que modificaste para que cuando OpenClaw (o el humano) revise, vea qué hiciste.

5. **Notificar al humano:**
Termina el workflow avisándole al humano que has limpiado la bandeja de entrada según las órdenes del Orquestador.
