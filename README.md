# PetCenter Web

Plataforma de gestión para un centro de cuidado y adopción de mascotas. Este proyecto sirve como entorno principal para la automatización de pruebas integrales.

## Funcionalidad del Proyecto

La aplicación permite gestionar el flujo completo de:
- **Mascotas:** Gestión de altas, búsquedas y visualización mediante el consumo de API (CRUD completo).
- **Adopciones:** Gestión de pedidos de adopción.
- **Usuarios:** Panel administrativo para el control de usuarios.

> **Nota técnica:** La gran mayoría de las operaciones (CRUD) se ejecutan consumiendo una API externa, mientras que la lógica de navegación y la interfaz de usuario se manejan localmente mediante JavaScript.

## Estado del Proyecto y Roadmap

Este proyecto es una pieza viva en constante evolución. Actualmente, tengo identificados los siguientes puntos de mejora:

- [ ] **Refactorización de lógica JS:** La función `mostrarModulo` y la gestión de formularios tienen redundancia de código que será optimizada próximamente.
- [ ] **Modularización:** Mover la lógica de los formularios a componentes reutilizables para reducir la extensión del archivo HTML.
- [ ] **Automatización:** Este proyecto es la base sobre la que corre el framework de pruebas automatizadas [enlace a tu repo de tests].

## Tecnologías
- HTML5
- CSS3
- JavaScript (Vanilla)

---
*Proyecto desarrollado como parte de un plan de aprendizaje continuo en automatización de pruebas y desarrollo web.*
