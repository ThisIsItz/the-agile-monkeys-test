# Technical Challenge

## Goal

Build an admin experience for a small headless CMS.

The backend should remain relatively thin. The main focus of the exercise is the frontend, architecture, data modelling, and the decisions made while implementing the solution.

## Requirements

### Schema Builder

Users must be able to create and manage content schemas.

A schema can contain fields of the following types:

- Text
- Number
- Boolean
- Date
- Reference to another schema

Reference fields should allow an entry from another schema to be selected.

Example:

```text
Car
├── brand: text
├── year: number
└── owner: reference → Person
```

### Dynamic Entry Editor

Users must be able to:

- Create entries
- View entries
- Edit entries
- Delete entries
- Browse entries for a schema
- Navigate to referenced entries

Entry forms should be generated dynamically from the schema definition.

If a schema changes, the entry editor should reflect the updated schema.

### Real-Time Updates

Changes should be synchronized between connected clients.

Handling simultaneous edit conflicts is not required for the challenge and may be treated as an optional improvement.

## Clarifications

### Real-Time Behaviour

The required scope is keeping clients synchronized when data changes.

Advanced conflict resolution for users editing the same resource simultaneously is optional.

## Out of Scope

Unless required by the implementation, the following are not necessary:

- Authentication
- Role-based permissions
- Advanced edit-conflict resolution
- Production-scale infrastructure
