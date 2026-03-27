# ARTO Quality Rubric — Auto-Evaluación

Cada entregable producido por ARTO Studio AI se evalúa automáticamente con esta rúbrica antes de entregarse al cliente.

## Scoring por Pilar (1-10 cada uno)

### Strategy Score
| Puntos | Criterio |
|--------|---------|
| 9-10 | Insight no obvio, positioning diferenciado, tensión creativa clara, accionable |
| 7-8 | Positioning sólido, diferenciado del competidor, ejecutable |
| 5-6 | Correcto pero genérico, podría ser de cualquier marca |
| 1-4 | Obvio, copiado del competidor, o no accionable |

### Creativity Score
| Puntos | Criterio |
|--------|---------|
| 9-10 | Sorprendente, culturalmente relevante, memorable, ejecutable |
| 7-8 | Original, bien ejecutado, apropiado para la marca |
| 5-6 | Funcional pero predecible, no memorable |
| 1-4 | Genérico, podría ser de cualquier categoría, o inapropiado |

### Narrative Score
| Puntos | Criterio |
|--------|---------|
| 9-10 | Consumidor es héroe, tensión clara, voz específica, emocionalmente resonante |
| 7-8 | Buena estructura, voz consistente, específico |
| 5-6 | Correcto pero plano, sin tensión, genérico |
| 1-4 | Marca como héroe, vago, corporativo, sin emoción |

### Production Score
| Puntos | Criterio |
|--------|---------|
| 9-10 | Formato correcto, copy limpio, CTA claro, listo para usar |
| 7-8 | Casi listo, ajustes menores necesarios |
| 5-6 | Estructura correcta pero requiere edición significativa |
| 1-4 | Incompleto o requiere rehacer |

## Overall ARTO Score

```
Overall = (Strategy × 0.3) + (Creativity × 0.25) + (Narrative × 0.25) + (Production × 0.2)
```

## Thresholds

| Score | Acción |
|-------|--------|
| ≥ 8.0 | Entregar + analizar como patrón exitoso |
| 7.0 - 7.9 | Entregar con nota de mejora sugerida |
| 5.0 - 6.9 | Regenerar automáticamente (1 intento) |
| < 5.0 | Flagear para revisión humana de Victor |

## Anti-Patrones Automáticos (score automático 0 en criterio)

Frases que disparan penalización inmediata:
- "Como una empresa líder en..." → Narrative -3
- "Nos enorgullece presentar..." → Narrative -3
- "Soluciones innovadoras para..." → Strategy -3, Creativity -3
- "En [MARCA], creemos que..." → Narrative -2 (marca como héroe)
- Cualquier bullet list de 10+ items sin priorización → Production -2
- Copy sin CTA cuando se requiere acción → Production -3
