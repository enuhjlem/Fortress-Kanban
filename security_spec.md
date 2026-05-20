# Security Specification: Fortress Kanban Board

This document defines the data invariants, threat model, and "Dirty Dozen" payloads to ensure zero-trust security and absolute tenant isolation.

## 1. Data Invariants
* **Tenant Isolation**: A user can only access boards and tasks that exactly belong to them (`user_id == request.auth.uid`). No viewer or editor permission is sharing-enabled.
* **Orphan Prevention**: A task cannot be created without referencing a valid Board ID (`board_id`). The board must exist and belong to the authenticated user.
* **Type and Boundary Integrity**:
  * Board names and task titles must be strings between 1 and 100 characters.
  * Task descriptions must be strings of at most 2000 characters.
  * Task status must strictly equal `'To Do'`, `'In Progress'`, or `'Done'`.
  * Optional priority tags must match `'Low'`, `'Medium'`, `'High'`, or `'Critical'`.
* **Immutability Invariant**: The owner (`user_id`), the container ID (`board_id`), and construction timestamps (`created_at`) cannot be modified after initial creation.
* **Temporal Integrity**: `created_at` must match the server-generated `request.time` during creation.

## 2. The "Dirty Dozen" Payloads (Threat Vectors & Rejections)

| # | Attack Target | Payload / Action Attempted | Expected Outcome | Security Block Method |
|---|---|---|---|---|
| 1 | Identity Spoofing | Create a board with `user_id` set to standard user ID `victim_99` | `PERMISSION_DENIED` | Validation helper checks: `user_id == request.auth.uid` |
| 2 | Privilege Escalation | Force-inject `role: 'admin'` into board entity | `PERMISSION_DENIED` | Strictly constrained key-set checks: `keys.size() == 4` |
| 3 | Value Poisoning | Update status to `'Archived'` or `'Completed'` (not standard status) | `PERMISSION_DENIED` | Enforced status string enum checklist |
| 4 | Denial of Wallet | Create a board with ID that is a 500KB long string | `PERMISSION_DENIED` | `isValidId(boardId)` character count checker |
| 5 | Cross-Tenant Leak | Read tasks list where owner is not standard user | `PERMISSION_DENIED` | List rule evaluates: `resource.data.user_id == request.auth.uid` |
| 6 | Ghost Fields | Set `isVerified: true` or `points: 100` on a task card | `PERMISSION_DENIED` | Validation helper counts exact allowed keys |
| 7 | Client-side Clock Spoof | Create a task with `created_at` set to high dates (e.g. 2100) | `PERMISSION_DENIED` | Strict verification against `request.time` |
| 8 | Orphan Creation | Create task with non-existent board | `PERMISSION_DENIED` | `exists(/databases/$(database)/documents/boards/$(board_id))` verification |
| 9 | Hijacked Task Movement | Update task's parent board ID (`board_id`) to move to victim board | `PERMISSION_DENIED` | Rule checks `incoming().board_id == existing().board_id` during updates |
| 10| Temporal Corruption | Try to modify `created_at` on update operation | `PERMISSION_DENIED` | Rule checks `incoming().created_at == existing().created_at` |
| 11| Resource Exhaustion | Create task title with 1MB text content | `PERMISSION_DENIED` | `.size() <= 100` string validation gate |
| 12| Unauthenticated Scraping| Query any board or task when token is empty | `PERMISSION_DENIED` | `request.auth != null` checked first |
