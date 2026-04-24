# Security Specification: SkillForge AI

## 1. Data Invariants
- A Project must have a valid `manager_id`.
- Only the assigned `employee_id` can submit tasks for a Project.
- Status transitions must follow the strict lifecycle.
- `task_score` and `interview_score` can ONLY be set by the system (validation agent).
- Modules are immutable once created (except for submission field).

## 2. The Dirty Dozen Payloads (Rejection Targets)
1. **Manager Impersonation**: Employee trying to create a project for another manager.
2. **Status Skipping**: Manual update of status from `new_project` directly to `evaluation_done`.
3. **Score Injection**: Employee submitting a task and self-assigning a `task_score` of 100.
4. **Project Overwrite**: User trying to change the `manager_id` of an existing project.
5. **Unauthorized Submission**: User A trying to submit a task for User B's project.
6. **Plan Tampering**: Employee trying to modify the `approved_plan` after manager approval.
7. **Module Injection**: Unauthorized creation of modules in a project not owned/assigned.
8. **PII Leak**: Non-admin user reading the entire `users` collection.
9. **Identity Spoofing**: User setting their own `role` to 'manager' during registration if already exists as 'employee'.
10. **Orphaned Module**: Creating a module without a valid `project_id` matching an existing project.
11. **Negative Score**: Setting a `final_score` of -5 or 150 (outside 0-100 range).
12. **Giant Payload**: Sending a 2MB `goal_text`.

## 3. Test Runner (Mock Tests)
- `test('unauthorized score update fails')`
- `test('employee cannot approve plan')`
- `test('module creation without project fails')`
