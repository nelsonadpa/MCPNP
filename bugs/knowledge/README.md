# Bug Investigation Knowledge Base

Conocimiento reutilizable extraído de investigaciones de bugs en eRegistrations/BPA.
No es documentación de bugs individuales — es el **know-how de debugging**.

## Archivos

| Archivo | Contenido |
|---------|-----------|
| [debugging-patterns.md](debugging-patterns.md) | Patrones genéricos de debugging en BPA: qué revisar, en qué orden, trampas comunes |
| [behaviour-analysis.md](behaviour-analysis.md) | Cómo analizar behaviours, determinantes y cadenas de condiciones |
| [bot-investigation.md](bot-investigation.md) | Cómo rastrear la ejecución de bots, mappings y el WIZARD save |
| [platform-known-issues.md](platform-known-issues.md) | Bugs conocidos del engine de eRegistrations (no de configuración) |

## Cómo usar

1. **Antes de investigar un bug**: leer `debugging-patterns.md` para el checklist de approach
2. **Si involucra behaviours**: leer `behaviour-analysis.md`
3. **Si involucra bots**: leer `bot-investigation.md`
4. **Después de investigar**: agregar aprendizajes nuevos al archivo correspondiente

## Regla de oro

> Si una investigación tomó más de 30 minutos, DEBE dejar conocimiento aquí.
> El objetivo es que la próxima investigación similar tome 5 minutos.
