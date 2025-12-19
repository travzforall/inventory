# NFC-Driven Automated Workflow System

## Inventory Management – System Specification

---

## 1. High-Level System Overview

**Goal**  
Create an automated workflow system using NFC tags and mobile phones.  
When an NFC tag is scanned:

- The scan is captured
- Stored in a database
- Loaded into an Angular application
- The app presents context-aware workflows (starting with inventory)

**Core Concept**

- **NFC Tag** → Physical identifier
- **Database** → Source of truth
- **Angular App** → Workflow orchestration & visualization layer

---

## 2. NFC Tag Strategy

### NFC Tag Types

- **Storage Location Tags**
  - Examples: Shelf A1, Bin B4, Room 203
- **Item Tags** (Phase 2)
  - Individual assets or grouped inventory
- **Action Tags** (Phase 3)
  - Trigger predefined workflows (audit, restock, transfer)

### NFC Payload Options

- **URL-based**
  - Opens a specific Angular route
  - Example: `/scan/{tagId}`
- **Raw UID**
  - Read by phone and sent to backend via API
- **Hybrid**
  - URL containing a tag ID as a route or query parameter

### Minimum Tag Data

- `tagId` (unique, immutable)
- Optional: `typeHint` (location, item, action)

---

## 3. Phone Interaction Flow

### NFC Scan Behavior

1. User scans NFC tag with phone
2. Phone opens web app (browser or PWA)
3. Tag context is passed to the application

### Authentication Flow

- If user is not authenticated:
  - Redirect to login
  - Resume scan context after login
- If authenticated:
  - Resolve tag immediately

---

## 4. Backend & Database Concepts

### Core Entities

#### NFC Tag

- `id`
- `tagUid`
- `tagType` (location | item | action)
- `linkedEntityId`
- `status` (active | disabled | lost)
- `createdAt`

#### Storage Location

- `id`
- `name`
- `description`
- `parentLocationId` (supports nested locations)
- `imageGallery`
- `nfcTagId`
- `capacityRules` (optional)

#### Inventory Item

- `id`
- `name`
- `sku`
- `quantity`
- `images`
- `currentLocationId`
- `tags` (categories, attributes, flags)

#### Scan Event (Audit Log)

- `id`
- `tagId`
- `userId`
- `timestamp`
- `deviceType`
- `actionTaken`

---

## 5. Angular Application Feature Set

### NFC Scan Entry Route

- Centralized route to handle all scans
- Example: `/scan/{tagId}`

#### Responsibilities

- Validate tag
- Resolve tag type
- Load associated workflow
- Redirect to correct view

#### Routing Logic

- Location Tag → Location View
- Item Tag → Item View
- Action Tag → Workflow View

---

### Storage Location View (Inventory v1)

**Purpose**  
Display what exists at a physical storage location.

#### Features

- Location name & hierarchy
- Location image(s)
- List of stored items
- Item thumbnails
- Quantity per item
- Last updated timestamps

#### Optional Actions

- Add item to location
- Remove item
- Adjust quantity
- Start inventory count
- Flag discrepancy

---

### Inventory Visualization

- Grid or list view
- Search within location
- Category filtering
- Low-stock indicators

---

## 6. Automation & Workflow Layer

### Workflow Triggers

- NFC scan
- UI interaction
- Scheduled task
- Condition-based logic

### Example Workflows

- Inventory audit
- Restock alert
- Item transfer
- Maintenance reminder
- Access logging

---

## 7. Permissions & Roles

### User Roles

- Viewer
- Inventory Staff
- Manager
- Admin

### Permission Controls

- Quantity adjustments
- Location creation
- NFC tag assignment
- Scan log visibility

---

## 8. Offline & Resilience

### Offline Support

- Cache last-known data
- Queue scan events locally
- Sync when connection is restored

### Error Handling

- Unknown tag
- Disabled tag
- Multiple entity conflicts
- Network failures

---

## 9. Analytics & Logging

### Scan Metrics

- Scan frequency by location
- Most-accessed locations
- Unused or idle storage areas

### Inventory Metrics

- Stock movement
- Adjustment history
- Shrinkage detection

---

## 10. Security Considerations

- NFC tag cloning mitigation (logical checks)
- Tag revocation
- Signed scan requests
- Rate limiting
- Full audit logging

---

## 11. Expansion Paths

### Future NFC Capabilities

- Check-in / check-out
- Tool tracking
- Asset lifecycle management
- Smart labels
- Conditional workflows

### Non-NFC Triggers

- QR codes (fallback)
- Manual selection
- Barcode scanning

---

## 12. Suggested Next Deliverables

- Database schema
- API contract
- Angular route map
- PWA NFC handling strategy
- Workflow engine definition

---

## 13. Development Rules & Guidelines

### Sample Data Maintenance

**IMPORTANT:** When adding new database tables or modifying existing table schemas:

1. **Always create/update sample JSON files** in `docs/sample-data/` directory
2. **File naming convention:** Use snake_case matching the table name (e.g., `nfc_tags.json`, `scan_events.json`)
3. **Include realistic test data** with at least 5-10 records per table
4. **Maintain referential integrity** - ensure foreign keys reference valid IDs in related sample files
5. **Document edge cases** - include examples of:
   - Null/empty optional fields
   - Different status values
   - Hierarchical relationships (parent/child)
   - Items with low stock (below min_quantity)

### Current Sample Data Files

Located in `docs/sample-data/`:

| File | Table | Records | Description |
|------|-------|---------|-------------|
| `users.json` | Users | 4 | Admin, manager, staff, viewer roles |
| `locations.json` | Storage Locations | 7 | Warehouse hierarchy with bins |
| `nfc_tags.json` | NFC Tags | 10 | Location and item tags, includes disabled |
| `items.json` | Inventory Items | 10 | Various items with low stock examples |
| `scan_events.json` | Scan Events | 8 | Sample scan activity log |

### Baserow Import Instructions

1. Create a new database in Baserow
2. Create tables matching the schema in Section 4
3. Use Baserow's "Import" feature to upload each JSON file
4. Update `src/environments/environment.ts` with your table IDs

### Adding New Tables Checklist

When adding a new table to the application:

- [ ] Define TypeScript model in `src/app/core/models/`
- [ ] Create service in `src/app/core/services/`
- [ ] Export from index files
- [ ] **Create sample JSON file in `docs/sample-data/`**
- [ ] **Update this documentation with the new table**
- [ ] Update environment.ts with new table ID placeholder

---
