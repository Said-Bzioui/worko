ممتاز. إذن غادي نبنيو **WORKO كـ Advanced Project & Workflow Management Platform**، بفلسفة قريبة من Jira، ولكن ماشي مجرد Task Manager.

الهدف هو منصة تقدر تنافس Jira وLinear وClickUp، وتوفر نظام مرن لإدارة المشاريع، الفرق، المهام، العمليات، والأتمتة.

غادي نصممو Database بحيث تقدر تستوعب Features متقدمة مستقبلاً، بلا ما نضطرو نعاودو Architecture من الصفر.

# **1. Product Domain Architecture**

أول قرار معماري: WORKO غادي يكون Multi-tenant.

يعني نفس المنصة يقدرو يستعملوها شركات مختلفة، وكل شركة عندها بياناتها، مستخدميها، مشاريعها وصلاحياتها.

**WORKO Platform**

Global platform

**Organization A**

Company

Workspace 1

Workspace 2

**Organization B**

Company

Workspace 1

Workspace 2

**Projects → Boards → Issues**

Core project management hierarchy

الـ hierarchy الأساسي:

1. Organization: الشركة أو المؤسسة.
2. Workspace: فضاء العمل.
3. Team: فريق العمل.
4. Project: المشروع.
5. Board: طريقة عرض وإدارة المشروع.
6. Issue: المهمة أو المشكلة أو الطلب.

ملاحظة: المستخدم الواحد يقدر يكون عضو فعدة Organizations وWorkspaces، بصلاحيات مختلفة.

# **2. تقسيم Database إلى Domains**

غادي نقسمو Database إلى 10 Domains منطقية.

| Domain            | المسؤولية                               |
| ----------------- | --------------------------------------- |
| Identity & Access | Users, Memberships, Roles, Permissions  |
| Organizations     | Organizations, Workspaces, Teams        |
| Projects          | Projects, Components, Versions          |
| Issue Management  | Issues, Subtasks, Dependencies          |
| Workflow Engine   | Workflows, Statuses, Transitions        |
| Boards & Planning | Boards, Columns, Sprints                |
| Collaboration     | Comments, Attachments, Activity         |
| Customization     | Custom Fields, Labels, Templates        |
| Automation        | Rules, Triggers, Actions                |
| Platform          | Notifications, Audit Logs, Integrations |

هاد التقسيم غادي يكون منطقي كذلك فـ NestJS Modules.

# **3. Core Database Entities**

## **A. Identity & Access**

Core

- `User` — المستخدم، مرتبط بنظام Better Auth.
- `OrganizationMember` — العضوية داخل المؤسسة.
- `WorkspaceMember` — العضوية داخل Workspace.
- `TeamMember` — العضوية داخل Team.
- `Role` — الأدوار.
- `Permission` — الصلاحيات.
- `RolePermission` — الربط بين الأدوار والصلاحيات.

نحتاجو RBAC قابل للتوسع، ماشي غير Enum فيه ADMIN وUSER.

مثلاً نفس المستخدم يقدر يكون:

- Organization Admin.
- Project Manager فمشروع.
- Developer فمشروع آخر.
- Viewer فـ Workspace مختلف.

## **B. Project Management**

- `Organization`
- `Workspace`
- `Team`
- `Project`
- `ProjectMember`
- `ProjectCategory`
- `ProjectComponent`
- `ProjectVersion`

كل Project عندو:

- Key بحال `WRK`.
- Name وDescription.
- Owner.
- Members.
- Start Date وDue Date.
- Project Status.
- Configuration.

مثلاً:

`WRK-101`, `WRK-102`, `WRK-103`

الـ Issue Key غادي يكون Unique داخل المشروع.

## **C. Issue Management**

أهم Domain

الـ `Issue` هو قلب WORKO.

أنواع Issues المقترحة:

- EPIC
- STORY
- TASK
- BUG
- SUBTASK
- IMPROVEMENT
- FEATURE
- REQUEST

كل Issue يقدر يحتوي على:

| Field        | Description                    |
| ------------ | ------------------------------ |
| Key          | WRK-101                        |
| Title        | Issue title                    |
| Description  | Rich text                      |
| Type         | TASK / BUG / STORY             |
| Status       | Current status                 |
| Priority     | Critical / High / Medium / Low |
| Reporter     | الشخص اللي أنشأ المهمة         |
| Assignee     | الشخص المسؤول                  |
| Parent       | Epic أو Parent Issue           |
| Story Points | تقدير حجم العمل                |
| Start Date   | بداية العمل                    |
| Due Date     | الموعد النهائي                 |
| Resolution   | سبب إغلاق المهمة               |

وزيد عليهم:

- `IssueLink`: العلاقات بين المهام.
- `IssueWatcher`: المستخدمون المتابعون.
- `IssueLabel`: Tags.
- `IssueComment`: التعليقات.
- `IssueAttachment`: الملفات.
- `IssueHistory`: تاريخ التغييرات.

مثلاً Task تقدر تكون مرتبطة بـ Task أخرى عن طريق:

- BLOCKS
- IS_BLOCKED_BY
- RELATES_TO
- DUPLICATES
- DEPENDS_ON

هاد العلاقات خاصها تكون فجدول مستقل، ماشي Foreign Key واحد داخل Issue.

# **4. Workflow Engine**

Advanced feature

ما بغيناش WORKO يكون عندو Statuses ثابتة بحال Jira البسيط.

بغينا كل Workspace أو Project يقدر يصمم Workflow خاص به.

مثلاً:

**Software Development Workflow**

BACKLOG

TODO

IN PROGRESS

DONE

مثال توضيحي للانتقالات، ماشي Workflow ثابت.

Entities:

- `Workflow`
- `WorkflowStatus`
- `WorkflowTransition`
- `WorkflowScheme`
- `WorkflowValidator`
- `WorkflowCondition`
- `WorkflowPostFunction`

مثلاً: مايمكنش Developer يدير انتقال من IN_PROGRESS إلى DONE حتى يدوز Code Review.

إذن Workflow Engine خاصو يدعم:

- Configurable statuses.
- Conditional transitions.
- Role-based transitions.
- Validators.
- Automatic actions.
- Transition history.

# **5. Boards & Sprint Management**

هاد Domain غادي يوفر طرق مختلفة لعرض نفس Issues.

**Board Types:**

- Kanban Board.
- Scrum Board.
- Backlog Board.
- Personal Board.
- Custom Board.

Entities:

- `Board`
- `BoardColumn`
- `BoardFilter`
- `BoardSwimlane`
- `Sprint`
- `SprintIssue`
- `SprintReport`

خصنا نفصلو بين Board وWorkflow: الـ Board غير طريقة العرض، والـ Workflow هو المنطق اللي كيحدد انتقالات الحالة.

# **6. Collaboration & Customization**

هاد الجزء غادي يخلي WORKO يتجاوز Task Management العادي.

| Feature       | Entities                             |
| ------------- | ------------------------------------ |
| Comments      | Comment, CommentMention              |
| Attachments   | Attachment                           |
| Activity Feed | Activity                             |
| Notifications | Notification, NotificationPreference |
| Custom Fields | CustomField, CustomFieldValue        |
| Labels        | Label, IssueLabel                    |
| Templates     | ProjectTemplate, WorkflowTemplate    |
| Audit         | AuditLog                             |

**Custom Fields** مهمة بزاف.

مثلاً شركة كتخدم فـ Software Development محتاجة:

- Environment.
- GitHub PR.
- Build Number.

وشركة أخرى كتخدم فـ Marketing محتاجة:

- Campaign.
- Budget.
- Channel.

ماخصناش نزيدو Column جديدة فـ Database لكل Client. غادي نعتمدو Custom Fields قابلة للتكوين.

# **7. Automation Engine**

Advanced architecture

بغيت WORKO يدعم Automation بحال:

- When Issue Created → Assign to Team Lead.
- When Status Changes → Notify Assignee.
- When Due Date Approaches → Send Reminder.
- When All Subtasks Done → Complete Parent Issue.

Entities:

- `AutomationRule`
- `AutomationTrigger`
- `AutomationCondition`
- `AutomationAction`
- `AutomationExecution`

والتنفيذ غادي يكون عبر Worker + Redis/BullMQ، ماشي داخل HTTP Request مباشرة.

# **8. العلاقات الأساسية ERD**

هاد الرسم كيعطينا Core Domain Model الأولي:

\#chatgpt-mermaid-\_r_1nb\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_1nb\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1nb\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1nb\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1nb\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1nb\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_1nb\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_1nb\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_1nb\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_1nb\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_1nb\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_1nb\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1nb\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1nb\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_1nb\_ p{margin:0;}#chatgpt-mermaid-\_r_1nb\_ .entityBox{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1nb\_ .relationshipLabelBox{fill:rgb(48, 48, 48);opacity:0.7;background-color:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1nb\_ .relationshipLabelBox rect{opacity:0.5;}#chatgpt-mermaid-\_r_1nb\_ .labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1nb\_ .edgeLabel{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1nb\_ .edgeLabel .label rect{fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1nb\_ .edgeLabel .label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1nb\_ .edgeLabel .label{fill:rgb(31, 78, 148);font-size:14px;}#chatgpt-mermaid-\_r_1nb\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1nb\_ .edge-pattern-dashed{stroke-dasharray:8,8;}#chatgpt-mermaid-\_r_1nb\_ .node rect,#chatgpt-mermaid-\_r_1nb\_ .node circle,#chatgpt-mermaid-\_r_1nb\_ .node ellipse,#chatgpt-mermaid-\_r_1nb\_ .node polygon{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_1nb\_ .relationshipLine{stroke:rgb(175, 175, 175);stroke-width:1px;fill:none;}#chatgpt-mermaid-\_r_1nb\_ .marker{fill:none!important;stroke:rgb(175, 175, 175)!important;stroke-width:1;}#chatgpt-mermaid-\_r_1nb\_ [data-look=neo].labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1nb\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_1nb\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_1nb\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_1nb\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_1nb\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1nb\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_1nb\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1nb\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}USERORGANIZATION_MEMBERORGANIZATIONWORKSPACEWORKSPACE_MEMBERTEAMTEAM_MEMBERPROJECTPROJECT_MEMBERISSUEISSUE_LINKWORKFLOWWORKFLOW_STATUSWORKFLOW_TRANSITIONBOARDBOARD_COLUMNSPRINTSPRINT_ISSUECOMMENTATTACHMENTAUTOMATION_RULEjoinshasownshasjoinscontainshasjoinscontainshascontainsreportsassignedparentsourcedefinescontainssourcehascontainshascontainsassignedhashasdefines

هاد الرسم High-level، وغادي نزيدو عليه العلاقات التفصيلية قبل Prisma Schema.

# **9. قرارات تقنية خاصنا نعتمدوها**

| Decision        | الاختيار                              |
| --------------- | ------------------------------------- |
| Database        | PostgreSQL                            |
| ORM             | Prisma 7                              |
| IDs             | UUID                                  |
| Multi-tenancy   | Organization + Workspace              |
| Permissions     | RBAC                                  |
| Custom Fields   | Typed values                          |
| Issue hierarchy | Self-referencing relation             |
| Audit           | Append-only logs                      |
| Background jobs | Redis + BullMQ                        |
| Soft deletion   | Selective                             |
| Dates           | UTC                                   |
| Search          | PostgreSQL Full-Text Search initially |

بالنسبة لـ Better Auth، غادي نستعملو User Model ديالو كمرجع للـ User داخل Domains الأخرى، وما نخلقوش نظام Users ثاني مستقل.

وبالنسبة للتنظيم الحالي ديال المشروع، `packages/database` غادي يبقى هو المالك الوحيد للـ Prisma Schema والـ Migrations والـ Generated Client، والـ NestJS Backend غادي يحتوي Business Logic والـ Repositories.&#x20;