# SENATI - CRM Académico y Sistema de Gestión Docente

Plataforma web desarrollada bajo una arquitectura de **CRM Académico (Customer Relationship Management)** para la gestión, análisis y seguimiento del rendimiento de los estudiantes. El sistema evolucionó de un prototipo de visualización estática con datos locales (mock-data) a una solución CRM reactiva, operativa y persistente integrada con Google Cloud Firestore.

---

## Enfoque CRM de la Plataforma

A diferencia de un dashboard analítico tradicional, este sistema opera como un CRM completo para la gestión docente:

- **Centralización de Estudiantes:** Cada alumno cuenta con un registro centralizado que consolida notas, porcentaje de asistencia y estado académico en tiempo real.
- **Segmentación Operativa:** Clasificación automática de la nómina según criterios de riesgo académico y aptitud para facilitar la intervención docente.
- **Estructura Escalable:** Diseñado para gestionar la relación y el ciclo de vida del estudiante dentro de la institución sin depender de procesos manuales o archivos locales aislados.

---

## Origen de los Datos (Dataset)

Para la validación de la plataforma, pruebas de estrés y simulación del volumen real de estudiantes dentro del CRM, se procesó e integró un dataset público extraído de Kaggle:

* **Fuente de datos:** [Kaggle - Datasets de Práctica](https://www.kaggle.com/datasets/dataregina/datasets-de-prctica/data)
* **Volumen de gestión:** 3,998 perfiles de estudiantes integrados en la base de datos.

  <img width="1600" height="899" alt="image" src="https://github.com/user-attachments/assets/ae98ce4b-da73-458c-aa0a-3eee40f6cd67" />


---

## Principales Mejoras y Migración Técnica

### 1. Migración de Mock Data a Firestore
- **Persistencia Real:** Eliminación total de objetos estáticos locales (`mock-data.ts`) y de importaciones síncronas.
- **Lectura Reactiva:** Implementación de hooks personalizados (`useAlumnos`) para consultar y escuchar el estado de la base de datos en tiempo real.
- **Sincronización Multimódulo:** Los módulos de Dashboard, Alumnos, Cursos y Reportes reflejan los datos de producción de forma consistente y en tiempo real.

### 2. Lógica de Negocio y Reglas del CRM
Al sincronizar los perfiles en la base de datos, el CRM aplica automáticamente las siguientes transformaciones:
- **Notas:** Conversión a escala vigesimal (0 - 20) mediante `Nota_Final * 2`.
- **Asistencia:** Cálculo porcentual (0% - 100%) mediante `(Asistencia / 40) * 100`.
- **Estado del Estudiante:** Regla de segmentación para la toma de decisiones:
  - **Apto:** Asistencia >= 70% y Promedio >= 10.5.
  - **No Apto / En Riesgo:** Asistencia < 70% o Promedio < 10.5.

---

## Evidencia de Funcionamiento del CRM

### 1. Panel Principal del CRM (Dashboard)
Visualización de los indicadores clave del total de alumnos bajo gestión, métricas globales de rendimiento y desglose de estudiantes aptos vs. en riesgo.

<img width="1847" height="988" alt="image" src="https://github.com/user-attachments/assets/6d4f6674-e0b8-4d8b-bd85-1fc16806cacc" />


*Figura 1: Vista principal del CRM mostrando la métrica consolidada de los 3,998 estudiantes.*

---

### 2. Gestión y Consulta de Estudiantes
Módulo para el filtrado, búsqueda y revisión detallada del historial y estado académico de cada perfil registrado.

<img width="1867" height="991" alt="image" src="https://github.com/user-attachments/assets/ee6aef43-ff7f-4c83-8c22-c2a2baf73ef6" />


*Figura 2: Interfaz de gestión de estudiantes dentro de la plataforma.*

---

### 3. Persistencia en Google Cloud Firestore
Estructura de la colección `alumnos` en la consola de Firebase, garantizando la centralización de los datos.

<img width="1864" height="986" alt="image" src="https://github.com/user-attachments/assets/4c4e950e-701c-4b1b-921d-45a7330927db" />


*Figura 3: Colección de datos estructurada y persistida en Firestore.*

---

## Tecnologías Utilizadas

- **Frontend:** React, TypeScript, TanStack Router.
- **Estilos:** Tailwind CSS, Lucide React.
- **Base de Datos / Backend:** Google Cloud Firestore / Firebase.

---

## Estructura del Proyecto

```text
src/
├── components/          # Componentes reutilizables de UI y navegación
├── hooks/               # Hooks de integración con Firestore (useAlumnos)
├── routes/              # Vistas del CRM (Dashboard, Alumnos, Cursos, Reportes)
├── services/            # Inicialización y servicios de Firebase
└── types/               # Modelos e interfaces de TypeScript
