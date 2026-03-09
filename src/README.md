# Outlook Calendar Sync Feature

This directory contains the implementation of the Outlook Calendar Sync feature for the Weekly Task Board application.

## Project Structure

```
src/
├── types/
│   └── index.ts              # Core type definitions (Event, Task, SyncMapping, etc.)
├── components/
│   ├── interfaces.ts         # Component interface definitions
│   ├── OutlookConnector.ts   # OAuth and Outlook API communication
│   ├── EventParser.ts        # Parse Outlook API responses to Event objects
│   ├── EventSerializer.ts    # Convert Event objects to Task objects
│   ├── EventPrinter.ts       # Format Event objects for display
│   ├── SyncEngine.ts         # Manage sync state and duplicate detection
│   ├── CalendarImporter.ts   # Orchestrate import process
│   └── CalendarSyncUI.ts     # User interface components
└── utils/
    └── logger.ts             # Logging utility

tests/
├── setup.ts                  # Test utilities and helpers
├── unit/
│   ├── types.test.ts         # Type definition tests
│   ├── interfaces.test.ts    # Interface definition tests
│   ├── logger.test.ts        # Logger utility tests
│   ├── outlook-connector.test.ts
│   ├── event-parser.test.ts
│   ├── event-serializer.test.ts
│   ├── event-printer.test.ts
│   ├── sync-engine.test.ts
│   ├── calendar-importer.test.ts
│   └── calendar-sync-ui.test.ts
└── integration/
    └── sync-flow.test.ts     # End-to-end sync flow tests
```

## Core Types

### Event
Represents an Outlook calendar event with all metadata.

### Task
Represents a task in the task board with optional sync metadata.

### SyncMapping
Tracks the relationship between Outlook events and task board tasks.

### SyncStatus
Enum representing the state of a sync operation (SYNCED, PENDING, FAILED, DUPLICATE).

## Component Interfaces

### OutlookConnector
Manages OAuth authentication and Outlook API communication.

### EventParser
Parses raw Outlook API responses into structured Event objects.

### EventSerializer
Converts Event objects to Task objects for the task board.

### EventPrinter
Formats Event objects into human-readable strings.

### SyncEngine
Manages synchronization state and duplicate detection.

### CalendarImporter
Orchestrates the import process and manages UI interactions.

### CalendarSyncUI
Provides user interface components for calendar synchronization.

## Testing

### Unit Tests
Run unit tests for individual components:
```bash
npm run test:outlook
```

### Watch Mode
Run tests in watch mode:
```bash
npm run test:outlook:watch
```

### Coverage
Generate coverage report:
```bash
npm run test:outlook:coverage
```

## Building

Compile TypeScript to JavaScript:
```bash
npm run build
```

Watch mode:
```bash
npm run build:watch
```

## Implementation Phases

### Phase 1: Core Infrastructure
- Outlook Connector (OAuth, token management)
- Event Parser (JSON parsing, validation)
- Sync Engine (state management, duplicate detection)

### Phase 2: UI and Import Logic
- Calendar Sync UI Components
- Calendar Importer Orchestration
- Event Serializer (Event → Task conversion)

### Phase 3: Error Handling and Resilience
- Exponential backoff retry logic
- Comprehensive error handling
- Error logging and monitoring

### Phase 4: Testing and Optimization
- Unit test suite
- Property-based test suite
- Performance optimization
- Security audit

## Requirements Coverage

All 8 requirements are addressed:
1. Outlook authentication and connection
2. Retrieve events from Outlook
3. Event selection interface
4. Import events to task board
5. Manage sync state
6. Date range-based sync
7. Error handling and retry
8. Parser and serializer

## Correctness Properties

20 correctness properties are defined and tested:
1. OAuth flow initiation
2. Secure token storage
3. Token cleanup on disconnect
4. Event retrieval with date range
5. Event data integrity
6. Empty event list handling
7. Event list display
8. Event details display
9. Selection state persistence
10. Event to task conversion
11. Import transaction rollback
12. Sync mapping recording
13. Duplicate detection
14. Duplicate warning display
15. Date range validation
16. Default date range
17. Exponential backoff retry
18. Error logging
19. Event parse round-trip
20. Event formatting
