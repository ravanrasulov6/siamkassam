# Siam Kassam: Flutter Offline-First Architecture & Setup

## Overview
This document outlines the production-grade, enterprise-level architecture for the Flutter migration of Siam Kassam, prioritizing an **Offline-First** capability, structural scalability, and zero-compromise point-of-sale functionality regardless of network conditions.

---

## 1. Full Clean Architecture (Strict)

The architecture is strictly divided into three layers to eliminate coupling between UI and data sources.

### Domain Layer (The Core)
Fully independent of Flutter and external packages.
- **Entities**: Pure Dart structures representing business models (e.g., `CustomerEntity`, `DebtEntity`).
- **UseCases**: Single-responsibility callable classes orchestrating business logic (e.g., `AddCustomerUseCase`, `SyncOfflineDataUseCase`, `CalculateCartTotalUseCase`). **The UI only interacts with UseCases.**
- **Repository Interfaces**: Abstract classes defining the data contracts (e.g., `abstract class CustomerRepository`).

### Data Layer (Implementation)
- **DataSources**: The specific mechanisms to get/save data. 
  - `RemoteDataSource`: Interacts exclusively with Supabase REST/RPC APIs.
  - `LocalDataSource`: Interacts with the local database.
- **Repository Implementations**: Implements the Domain repository interfaces. This layer contains the logic determining whether to fetch from local or remote, and how to merge data.
- **Models / DTOs**: Data Transfer Objects containing `fromJson`/`toJson` logic, mapping backend JSON to Domain Entities via `.toEntity()`.

**Data Flow Sequence:**
UI Widget → Riverpod Notifier → UseCase → Repository → DataSource (Local/Remote) → Model → Entity → UseCase → Riverpod Notifier → UI

---

## 2. Offline-First Architecture (Critical Feature)

The application MUST function seamlessly without internet access if the user has an active session.

**Offline Capabilities Provided:**
- **Add Customer**: Saves locally, queues for sync.
- **Add Debt (Payables/Receivables)**: Saves locally, recalculates local balances instantly.
- **Create Sales (POS)**: Entire checkout process functions offline.
- **Data Viewing**: All lists (Customers, Products, Debts) load from the local cache instantly, acting as a single source of truth.

---

## 3. Local Database Design (Isar)

**Choice Justification: Isar Database**
We use **Isar** instead of Hive. Given Siam Kassam's relational complexity (Sales containing SaleItems, Customers linked to Debts), Hive (a flat key-value store) requires manual, slow, in-memory joining. Isar supports complex querying, relational links, multi-entry indexing, and full-text search out of the box, offering superior performance for an offline-first Desktop/Mobile SaaS.

**Local Schemas (Isar Collections):**
- **Customer**: `id`, `name`, `phone`, `createdAt`, `updatedAt`, `syncStatus` (Enum: SYNCED, PENDING_INSERT, PENDING_UPDATE).
- **Debt**: `id`, `customerId`, `amount`, `type` (Payable/Receivable), `dueDate`, `syncStatus`.
- **Product**: `id`, `name`, `barcode`, `price`, `stockQuantity`. Use Isar Full-Text Search on `name` and `barcode` for offline POS scanning.
- **Sale**: `id`, `date`, `totalAmount`, `customerId` (optional), `syncStatus`.
- **SaleItem** (Linked to Sale): `id`, `saleId`, `productId`, `quantity`, `price`.

---

## 4. Sync Engine Design

The Sync Engine regulates the eventual consistency between local (Isar) and remote (Supabase).

**Queue Structure:**
We utilize Isar to track pending states. Every local record has a `syncStatus` enum (`SYNCED`, `PENDING_INSERT`, `PENDING_UPDATE`, `CONFLICT`). 

**When Offline:**
1. User creates a Sale.
2. Saved to Isar with a locally generated `UUID v4` and `syncStatus = PENDING_INSERT`.
3. Notifies internal queue listener.

**When Internet Returns:**
1. Background worker (`connectivity_plus` combined with a Riverpod background listener) detects network restoration.
2. Triggers `SyncOfflineDataUseCase`.
3. Fetches all records where `syncStatus != SYNCED`.
4. Executes structured sync batches (e.g., Sync Customers first to prevent ForeignKey errors for Sales).

**Conflict Resolution Strategy:**
- *Timestamp Wins / Latest Override*: Compares `updated_at`. If an admin changed a debt online, but a local user updated it offline simultaneously, the newer `updated_at` takes precedence. 
- *Failure Handling*: If a sync fails (e.g., Supabase rejects due to RLS or missing foreign keys), `syncStatus` becomes `CONFLICT`, and a visual indicator informs the user in the AppBar.
- *Retry Mechanism*: Exponential backoff (retry after 5s, 15s, 60s, then 5 mins).

---

## 5. Data Sources Layer & Merging

Repositories coordinate the DataSources.
- **RemoteDataSource (Supabase):** Contains `getCustomers()`, `upsertCustomer()`.
- **LocalDataSource (Isar):** Contains `getCachedCustomers()`, `saveCustomerLocally()`, `getPendingSync()`.

**Merge Logic (Repository implementation):**
```dart
Future<List<CustomerEntity>> getCustomers() async {
  // Always fetch and return Local Cache FIRST for 0ms loading times
  final localData = await localDataSource.getCachedCustomers();
  
  if (networkInfo.isConnected) {
    try {
      // Fetch fresh data in the background
      final remoteData = await remoteDataSource.getCustomers();
      // Update local cache quietly
      await localDataSource.cacheCustomers(remoteData);
      // Return fresh data
      return remoteData.map((e) => e.toEntity()).toList();
    } catch (e) {
      // If remote fails, fallback entirely to local data
      return localData.map((e) => e.toEntity()).toList();
    }
  }
  
  return localData.map((e) => e.toEntity()).toList();
}
```

---

## 6. State Management (Advanced Riverpod)

- **`AsyncNotifierProvider`**: Handles asynchronous remote/local data fetching. Yields explicit `AsyncLoading` (for initial loads), `AsyncData` (successful data), and `AsyncError`.
- **`NotifierProvider` / `StateNotifierProvider`**: Used for immediate, synchronous local interactions (e.g., the POS Cart logic).
- **Network State**: A global `connectivityProvider` drives an offline banner UI globally without polluting feature-specific providers.

---

## 7. POS (Sales) Offline Strategy

The checkout flow must never block the user.
1. The Cart operates in a synchronous Riverpod `Notifier`.
2. On hitting "Complete Sale", the `CheckoutUseCase` converts the Cart state into a `Sale` Entity and multiple `SaleItem` Entities.
3. These are written to Isar in a single synchronous `writeTxn`.
4. The `Sale` is marked `PENDING_INSERT`.
5. The Cart clears immediately, enabling the next customer checkout within milliseconds.
6. The Sync Worker detects the `PENDING_INSERT` and bulk-upserts the Sale and Items to Supabase in the background. Because UUIDs are generated *locally*, duplicate transmissions due to spotty internet result in safe idempotent Upserts on Supabase.

---

## 8. Desktop + Mobile Shared Strategy

- **100% Shared Business Logic:** Using Clean Architecture ensures UI logic doesn't leak into services. Domain and Data layers are universally identical on Desktop and Mobile.
- **Adaptive UI Layer:** We utilize `responsive_builder` or Flutter's native `LayoutBuilder`.
- **Platform-Specific UX:**
  - **Desktop**: Grid layouts, `DataTable` for complex lists, persistent Sidebars, window_manager customization, and heavy `Shortcuts`/`Actions` for fast keyboard POS checkouts.
  - **Mobile**: Swipeable generic `ListView` cards, `BottomNavigationBar` / Slide-out `Drawer`, Pull-to-Refresh, native bottom-sheet drill-downs.

---

## 9. Performance & Data Consistency

- **Caching Strategy:** By querying Isar first, we bypass the typical Flutter "loading spinner" phase entirely for returning users.
- **Data Integrity:** Ensuring Local IDs match Remote IDs via UUID v4 generation on the client-side prevents auto-increment ID conflicts during offline merging.
- **Duplicate Prevention:** Using Riverpod's native caching mechanisms and `.keepAlive()` ensures we don't spam Supabase with redundant API calls if navigating between screens rapidly.

---

## 10. Testing Strategy (Upgrade)

A production-grade system requires rigorous testing across layers:
- **UseCase Unit Tests**: Using `mocktail` or `mockito`, we assert that business logic calculations (like applying a discount code in the POS Cart UseCase) work independent of Flutter Widgets.
- **Repository Tests**: Mocking `RemoteDataSource` and `LocalDataSource`. We assert edge cases: "When Remote throws a SocketException, does the Repository correctly return Local Cache Data?"
- **Sync Engine Integration Tests**: Seed a mock Isar DB with 5 `PENDING_INSERT` records, toggle mock connectivity to `TRUE`, and assert that the Supabase Mock receives exactly 5 `upsert` calls.
- **Offline/Online UI Switching**: Widget Tests simulating `hasConnection = false` to guarantee the Offline Banner and cached states render without crashing.
