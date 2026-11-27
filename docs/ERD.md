تم اعتماد القرارات الأربعة. دابا ننتاقلو من High-level Architecture إلى **Detailed Relational Database Design** ديال WORKO.

غادي نعتمدو هاد المبادئ:

- Multi-tenancy: Organization → Workspace.
- Flexible Issue Hierarchy: أي Issue تقدر تكون Parent أو Child حسب النوع والقواعد.
- Hybrid Authorization: RBAC + Project-level permissions.
- Typed Custom Fields: قيم typed ومهيكلة، مع JSONB للحالات المعقدة.
- PostgreSQL Referential Integrity: العلاقات والقيود تفرضها Database، ماشي غير Application Logic.
- Prisma 7: Schema منظم حسب Domains، مع migrations مركزية.

# **1. Final Database Architecture**

غادي نقسمو Database إلى 12 bounded domains منطقية، ولكن غادي نستعملو PostgreSQL Database واحدة فالبداية.

**WORKO DATABASE**

PostgreSQL · Shared Database

**Identity**

Users & Sessions

**Tenancy**

Organizations & Workspaces

**Access**

Roles & Permissions

**Projects**

Teams & Projects

**Issues**

Tasks & Hierarchy

**Workflow**

Statuses & Transitions

**Planning**

Boards & Sprints

**Collaboration**

Comments & Files

**Customization**

Fields & Labels

**Automation**

Rules & Executions

**Notifications**

Events & Preferences

**Auditing**

History & Audit Logs

12 logical domains، Prisma Client واحد، ومصدر واحد للـ migrations.

# **2. Detailed Relational ERD**

غادي نبنيو العلاقات على مراحل باش يبقى كل Domain واضح.

## **A. Identity, Organization & Workspace**

هاد الجزء هو الأساس ديال Multi-tenancy.

\#chatgpt-mermaid-\_r_1q5\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_1q5\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1q5\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1q5\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1q5\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1q5\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_1q5\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_1q5\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_1q5\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_1q5\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_1q5\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_1q5\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1q5\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1q5\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_1q5\_ p{margin:0;}#chatgpt-mermaid-\_r_1q5\_ .entityBox{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1q5\_ .relationshipLabelBox{fill:rgb(48, 48, 48);opacity:0.7;background-color:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1q5\_ .relationshipLabelBox rect{opacity:0.5;}#chatgpt-mermaid-\_r_1q5\_ .labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1q5\_ .edgeLabel{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1q5\_ .edgeLabel .label rect{fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1q5\_ .edgeLabel .label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1q5\_ .edgeLabel .label{fill:rgb(31, 78, 148);font-size:14px;}#chatgpt-mermaid-\_r_1q5\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1q5\_ .edge-pattern-dashed{stroke-dasharray:8,8;}#chatgpt-mermaid-\_r_1q5\_ .node rect,#chatgpt-mermaid-\_r_1q5\_ .node circle,#chatgpt-mermaid-\_r_1q5\_ .node ellipse,#chatgpt-mermaid-\_r_1q5\_ .node polygon{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_1q5\_ .relationshipLine{stroke:rgb(175, 175, 175);stroke-width:1px;fill:none;}#chatgpt-mermaid-\_r_1q5\_ .marker{fill:none!important;stroke:rgb(175, 175, 175)!important;stroke-width:1;}#chatgpt-mermaid-\_r_1q5\_ [data-look=neo].labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1q5\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_1q5\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_1q5\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_1q5\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_1q5\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1q5\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_1q5\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1q5\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}USERuuididPKstringnamestringemailUKstringimagedatetimecreated_atdatetimeupdated_atORGANIZATION_MEMBERuuididPKuuidorganization_idFKuuiduser_idFKstringstatusdatetimejoined_atORGANIZATIONuuididPKstringnamestringslugUKstringstatusdatetimecreated_atWORKSPACEuuididPKuuidorganization_idFKstringnamestringslugstringtimezonedatetimecreated_atWORKSPACE_MEMBERuuididPKuuidworkspace_idFKuuiduser_idFKstringstatusTEAMuuididPKuuidworkspace_idFKstringnamestringkeyTEAM_MEMBERuuididPKuuidteam_idFKuuiduser_idFKstringmembership_rolemembershiphasownsmembershiphascontainshasjoins

**Important constraints:**

| Table              | Constraint                        |
| ------------------ | --------------------------------- |
| Organization       | `slug` unique                     |
| OrganizationMember | `(organizationId, userId)` unique |
| Workspace          | `(organizationId, slug)` unique   |
| WorkspaceMember    | `(workspaceId, userId)` unique    |
| Team               | `(workspaceId, key)` unique       |
| TeamMember         | `(teamId, userId)` unique         |

كل Workspace تابع لـ Organization واحدة. User يقدر يكون عضو فعدة Organizations.

## **B. Authorization — Hybrid RBAC**

غادي نفصلو بين تعريف الصلاحية وتطبيقها على Scope معين.

Entities:

- `Role`
- `Permission`
- `RolePermission`
- `OrganizationRoleAssignment`
- `WorkspaceRoleAssignment`
- `ProjectRoleAssignment`

مثلاً:

| Scope        | Example            |
| ------------ | ------------------ |
| Organization | Organization Admin |
| Workspace    | Workspace Manager  |
| Project      | Project Lead       |
| Project      | Developer          |
| Project      | Viewer             |

كل Role Assignment يربط User بـ Role داخل Scope محدد.

ما غاديش نعتمدو على `role: String` داخل User، حيث هاد التصميم ما كيقدرش يعبر على اختلاف الصلاحيات بين المشاريع.

**Security rule:** كل Domain Query خاصها تتحقق من Organization وWorkspace ownership، مع إمكانية إضافة PostgreSQL Row-Level Security مستقبلاً. Prisma filters بوحدهم ماشي بديل عن authorization.

## **C. Projects & Issues**

\#chatgpt-mermaid-\_r_1qc\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_1qc\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1qc\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1qc\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1qc\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1qc\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_1qc\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_1qc\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_1qc\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_1qc\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_1qc\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_1qc\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1qc\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1qc\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_1qc\_ p{margin:0;}#chatgpt-mermaid-\_r_1qc\_ .entityBox{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1qc\_ .relationshipLabelBox{fill:rgb(48, 48, 48);opacity:0.7;background-color:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1qc\_ .relationshipLabelBox rect{opacity:0.5;}#chatgpt-mermaid-\_r_1qc\_ .labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1qc\_ .edgeLabel{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1qc\_ .edgeLabel .label rect{fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1qc\_ .edgeLabel .label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1qc\_ .edgeLabel .label{fill:rgb(31, 78, 148);font-size:14px;}#chatgpt-mermaid-\_r_1qc\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1qc\_ .edge-pattern-dashed{stroke-dasharray:8,8;}#chatgpt-mermaid-\_r_1qc\_ .node rect,#chatgpt-mermaid-\_r_1qc\_ .node circle,#chatgpt-mermaid-\_r_1qc\_ .node ellipse,#chatgpt-mermaid-\_r_1qc\_ .node polygon{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_1qc\_ .relationshipLine{stroke:rgb(175, 175, 175);stroke-width:1px;fill:none;}#chatgpt-mermaid-\_r_1qc\_ .marker{fill:none!important;stroke:rgb(175, 175, 175)!important;stroke-width:1;}#chatgpt-mermaid-\_r_1qc\_ [data-look=neo].labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1qc\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_1qc\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_1qc\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_1qc\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_1qc\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qc\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_1qc\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qc\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}WORKSPACEPROJECTuuididPKuuidworkspace_idFKuuidteam_idFKstringkeystringnamestringdescriptionstringstatusTEAMPROJECT_MEMBERuuididPKuuidproject_idFKuuiduser_idFKUSERISSUEuuididPKuuidproject_idFKuuidparent_idFKuuidreporter_idFKuuidassignee_idFKstringissue_keystringtitlestringissue_typestringprioritystringresolutionintpositiondecimalstory_pointsdatetimedue_dateISSUE_LINKuuididPKuuidsource_issue_idFKuuidtarget_issue_idFKstringlink_typeISSUE_WATCHERcontainsownshasjoinscontainsreportsassignedparent_childsourcetargetwatchedwatches

### **Flexible hierarchy**

غادي نستعملو:

`Issue.parentId → Issue.id`

وهذا كيخلينا ندعمو:

- Epic → Story → Task → Subtask.
- Initiative → Epic → Story.
- Task → Subtask.
- Custom hierarchy مستقبلاً.

لكن خاصنا نمنعو Circular References، ونفرضو قواعد الـ hierarchy حسب Issue Type configuration داخل Application Layer.

### **Issue Key**

مثلاً:

- `WRK-101`
- `WRK-102`
- `WRK-103`

غادي نستعملو `Project.nextIssueNumber` كـ counter، مع Transaction باش ما يكونش تكرار فحالة إنشاء Issues بالتوازي.

Unique constraint:

`UNIQUE(projectId, issueNumber)`

والـ key كيتكون من Project Key + Issue Number.

## **D. Workflow Engine**

\#chatgpt-mermaid-\_r_1qn\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_1qn\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1qn\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1qn\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1qn\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1qn\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_1qn\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_1qn\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_1qn\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_1qn\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_1qn\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_1qn\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1qn\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1qn\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_1qn\_ p{margin:0;}#chatgpt-mermaid-\_r_1qn\_ .entityBox{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1qn\_ .relationshipLabelBox{fill:rgb(48, 48, 48);opacity:0.7;background-color:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1qn\_ .relationshipLabelBox rect{opacity:0.5;}#chatgpt-mermaid-\_r_1qn\_ .labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1qn\_ .edgeLabel{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1qn\_ .edgeLabel .label rect{fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1qn\_ .edgeLabel .label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1qn\_ .edgeLabel .label{fill:rgb(31, 78, 148);font-size:14px;}#chatgpt-mermaid-\_r_1qn\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1qn\_ .edge-pattern-dashed{stroke-dasharray:8,8;}#chatgpt-mermaid-\_r_1qn\_ .node rect,#chatgpt-mermaid-\_r_1qn\_ .node circle,#chatgpt-mermaid-\_r_1qn\_ .node ellipse,#chatgpt-mermaid-\_r_1qn\_ .node polygon{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_1qn\_ .relationshipLine{stroke:rgb(175, 175, 175);stroke-width:1px;fill:none;}#chatgpt-mermaid-\_r_1qn\_ .marker{fill:none!important;stroke:rgb(175, 175, 175)!important;stroke-width:1;}#chatgpt-mermaid-\_r_1qn\_ [data-look=neo].labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1qn\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_1qn\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_1qn\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_1qn\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_1qn\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qn\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_1qn\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qn\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}WORKSPACEWORKFLOWuuididPKuuidworkspace_idFKstringnamebooleanis_defaultWORKFLOW_STATUSuuididPKuuidworkflow_idFKstringnamestringcategoryintpositionWORKFLOW_TRANSITIONuuididPKuuidworkflow_idFKuuidfrom_status_idFKuuidto_status_idFKstringnamePROJECTWORKFLOW_SCHEMEuuididPKuuidworkspace_idFKstringnameWORKFLOW_SCHEME_MAPPINGuuididPKuuidscheme_idFKuuidworkflow_idFKstringissue_typeISSUEWORKFLOW_TRANSITION_LOGuuididPKuuidissue_idFKuuidtransition_idFKuuidactor_idFKdatetimeexecuted_atownsdefinesdefinessourcedestinationusesmapsselectedcurrent_statusexecuted

نقطة مهمة: `Issue.statusId` غادي يكون Foreign Key على `WorkflowStatus`.

لكن خاصنا نفرضو أن Status ديال Issue تابع لنفس Workflow المعتمد عليه فـ Project. هاد التحقق غادي يكون فـ Domain Service مع Database constraints إضافية عند الحاجة.

غادي ندعمو كذلك:

- Transition conditions.
- Validators.
- Required fields on transition.
- Role restrictions.
- Transition post-actions.
- Workflow versioning مستقبلاً.

## **E. Boards & Sprint Planning**

\#chatgpt-mermaid-\_r_1qu\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_1qu\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1qu\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1qu\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1qu\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1qu\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_1qu\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_1qu\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_1qu\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_1qu\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_1qu\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_1qu\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1qu\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1qu\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_1qu\_ p{margin:0;}#chatgpt-mermaid-\_r_1qu\_ .entityBox{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1qu\_ .relationshipLabelBox{fill:rgb(48, 48, 48);opacity:0.7;background-color:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1qu\_ .relationshipLabelBox rect{opacity:0.5;}#chatgpt-mermaid-\_r_1qu\_ .labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1qu\_ .edgeLabel{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1qu\_ .edgeLabel .label rect{fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1qu\_ .edgeLabel .label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1qu\_ .edgeLabel .label{fill:rgb(31, 78, 148);font-size:14px;}#chatgpt-mermaid-\_r_1qu\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1qu\_ .edge-pattern-dashed{stroke-dasharray:8,8;}#chatgpt-mermaid-\_r_1qu\_ .node rect,#chatgpt-mermaid-\_r_1qu\_ .node circle,#chatgpt-mermaid-\_r_1qu\_ .node ellipse,#chatgpt-mermaid-\_r_1qu\_ .node polygon{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_1qu\_ .relationshipLine{stroke:rgb(175, 175, 175);stroke-width:1px;fill:none;}#chatgpt-mermaid-\_r_1qu\_ .marker{fill:none!important;stroke:rgb(175, 175, 175)!important;stroke-width:1;}#chatgpt-mermaid-\_r_1qu\_ [data-look=neo].labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1qu\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_1qu\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_1qu\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_1qu\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_1qu\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qu\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_1qu\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1qu\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}PROJECTBOARDuuididPKuuidproject_idFKstringnamestringtypestringfilter_queryBOARD_COLUMNuuididPKuuidboard_idFKuuidstatus_idFKstringnameintpositionBOARD_SWIMLANEBOARD_FILTERSPRINTuuididPKuuidproject_idFKstringnamedatetimestart_datedatetimeend_datestringstatusSPRINT_ISSUEuuididPKuuidsprint_idFKuuidissue_idFKISSUEhascontainsorganizesfiltersschedulesincludesassigned

قرار مهم: Board Column تقدر تربط Status واحد أو أكثر حسب configuration. ما غاديش نفرضو أن كل Board Column خاصها تكون Status مستقلة.

## **F. Collaboration & Activity**

| Table                  | أهم العلاقات     |
| ---------------------- | ---------------- |
| Comment                | Issue, Author    |
| CommentMention         | Comment, User    |
| Attachment             | Issue, Uploader  |
| IssueWatcher           | Issue, User      |
| Activity               | Workspace, Actor |
| IssueHistory           | Issue, Actor     |
| Notification           | User, Workspace  |
| NotificationPreference | User, Workspace  |

غادي نفرقو بين:

- `IssueHistory`: تغييرات الحقول ديال Issue.
- `Activity`: الأحداث اللي كتظهر فـ Activity Feed.
- `AuditLog`: الأحداث الأمنية والإدارية الحساسة.

ماشي كل Activity خاصها تكون Audit Log.

## **G. Custom Fields**

هاد الجزء غادي نصمموه بطريقة Typed Storage.

\#chatgpt-mermaid-\_r_1r5\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_1r5\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1r5\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1r5\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1r5\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1r5\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_1r5\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_1r5\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_1r5\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_1r5\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_1r5\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_1r5\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1r5\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1r5\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_1r5\_ p{margin:0;}#chatgpt-mermaid-\_r_1r5\_ .entityBox{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1r5\_ .relationshipLabelBox{fill:rgb(48, 48, 48);opacity:0.7;background-color:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1r5\_ .relationshipLabelBox rect{opacity:0.5;}#chatgpt-mermaid-\_r_1r5\_ .labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1r5\_ .edgeLabel{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1r5\_ .edgeLabel .label rect{fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_1r5\_ .edgeLabel .label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1r5\_ .edgeLabel .label{fill:rgb(31, 78, 148);font-size:14px;}#chatgpt-mermaid-\_r_1r5\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1r5\_ .edge-pattern-dashed{stroke-dasharray:8,8;}#chatgpt-mermaid-\_r_1r5\_ .node rect,#chatgpt-mermaid-\_r_1r5\_ .node circle,#chatgpt-mermaid-\_r_1r5\_ .node ellipse,#chatgpt-mermaid-\_r_1r5\_ .node polygon{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_1r5\_ .relationshipLine{stroke:rgb(175, 175, 175);stroke-width:1px;fill:none;}#chatgpt-mermaid-\_r_1r5\_ .marker{fill:none!important;stroke:rgb(175, 175, 175)!important;stroke-width:1;}#chatgpt-mermaid-\_r_1r5\_ [data-look=neo].labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_1r5\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_1r5\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_1r5\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_1r5\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_1r5\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1r5\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_1r5\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1r5\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}WORKSPACECUSTOM_FIELDuuididPKuuidworkspace_idFKstringnamestringfield_keystringfield_typebooleanrequiredCUSTOM_FIELD_OPTIONuuididPKuuidfield_idFKstringvaluestringlabelintpositionPROJECTPROJECT_CUSTOM_FIELDuuididPKuuidproject_idFKuuidfield_idFKbooleanis_requiredISSUEISSUE_CUSTOM_FIELD_VALUEuuididPKuuidissue_idFKuuidfield_idFKstringtext_valuedecimalnumber_valuebooleanboolean_valuedatetimedate_valuejsonjson_valuedefineshasenablesconfiguredhasstores

**Typed value strategy:**

| Field Type   | Storage                             |
| ------------ | ----------------------------------- |
| TEXT         | `textValue`                         |
| NUMBER       | `numberValue`                       |
| BOOLEAN      | `booleanValue`                      |
| DATE         | `dateValue`                         |
| SELECT       | `textValue` + Option validation     |
| MULTI_SELECT | `jsonValue` initially               |
| URL          | `textValue`                         |
| USER         | `textValue` with user ID validation |
| JSON         | `jsonValue`                         |

خصنا كذلك Database CHECK Constraint باش غير Value column وحدة تكون معمرة حسب Field Type، ونمنعو duplicate values لنفس `(issueId, fieldId)`.

ملاحظة: Prisma ما كيمثلش جميع PostgreSQL CHECK constraints بشكل مباشر، وبالتالي بعض القيود غادي نديروها فـ SQL migrations.

## **H. Automation & Platform**

| Entity                 | Purpose                     |
| ---------------------- | --------------------------- |
| AutomationRule         | تعريف Rule                  |
| AutomationTrigger      | الحدث اللي كيبدأ Automation |
| AutomationCondition    | شروط التنفيذ                |
| AutomationAction       | الإجراءات                   |
| AutomationExecution    | سجل التنفيذ                 |
| Notification           | الإشعارات                   |
| NotificationPreference | إعدادات الإشعارات           |
| AuditLog               | سجل أمني غير قابل للتعديل   |
| Integration            | ربط الخدمات الخارجية        |
| Webhook                | Webhook endpoints           |
| WebhookDelivery        | Delivery attempts           |

Automation Execution خاصها تدعم:

- Status: PENDING, RUNNING, SUCCESS, FAILED.
- Retry count.
- Error details.
- Execution timestamps.
- Idempotency key.

# **3. Prisma 7 — Package Architecture**

دابا نحولو هاد التصميم إلى ملفات قابلة للتطوير.

الاقتراح ديالي:

```
packages/
└── database/
    ├── prisma/
    │   ├── schema/
    │   │   ├── schema.prisma
    │   │   ├── enums.prisma
    │   │   ├── identity.prisma
    │   │   ├── tenancy.prisma
    │   │   ├── access.prisma
    │   │   ├── projects.prisma
    │   │   ├── issues.prisma
    │   │   ├── workflows.prisma
    │   │   ├── boards.prisma
    │   │   ├── collaboration.prisma
    │   │   ├── customization.prisma
    │   │   ├── automation.prisma
    │   │   └── platform.prisma
    │   ├── migrations/
    │   └── seed.ts
    ├── src/
    │   ├── client.ts
    │   └── index.ts
    ├── generated/
    ├── prisma.config.ts
    ├── package.json
    └── tsconfig.json
```

هاد Multi-file Schema مدعوم رسمياً فـ Prisma 7.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.prisma.io\&sz=32)

Prisma Documentation+1



### **3.1 schema.prisma**

```

generator client {
  provider = "prisma-client"
  output   = "../../generated/client"
}

datasource db {
  provider = "postgresql"
}

```

### **3.2 prisma.config.ts**

```

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

```

Prisma 7 كيخلي Database URL فـ `prisma.config.ts`، وماشي داخل `datasource` فـ schema.prisma.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.prisma.io\&sz=32)

Prisma Documentation+1



### **3.3 Enums**

`enums.prisma`:

```

enum OrganizationStatus {
  ACTIVE
  SUSPENDED
  ARCHIVED
}

enum MembershipStatus {
  INVITED
  ACTIVE
  SUSPENDED
  LEFT
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
  ARCHIVED
}

enum IssueType {
  INITIATIVE
  EPIC
  STORY
  TASK
  BUG
  SUBTASK
  IMPROVEMENT
  FEATURE
  REQUEST
}

enum IssuePriority {
  LOWEST
  LOW
  MEDIUM
  HIGH
  HIGHEST
  CRITICAL
}

enum StatusCategory {
  TO_DO
  IN_PROGRESS
  DONE
}

enum BoardType {
  KANBAN
  SCRUM
  CUSTOM
}

enum SprintStatus {
  FUTURE
  ACTIVE
  COMPLETED
}

enum IssueLinkType {
  BLOCKS
  IS_BLOCKED_BY
  RELATES_TO
  DUPLICATES
  IS_DUPLICATED_BY
  DEPENDS_ON
}

enum CustomFieldType {
  TEXT
  NUMBER
  BOOLEAN
  DATE
  SELECT
  MULTI_SELECT
  URL
  USER
  JSON
}

```

هاد الـ Enums هي نقطة البداية؛ بعض القيم بحال IssueType خاصها تبقى قابلة للتكوين على مستوى Workspace مستقبلاً، وبالتالي نقدروا نستبدلوها بجدول IssueType عندما نوصلو لمرحلة Custom Issue Types.

# **4. Core Prisma Models**

غادي نعطيك الآن أهم Models بالـ Prisma Schema، مع العلاقات والـ indexes.

## **4.1 Tenancy Models**

`tenancy.prisma`

```

model Organization {
  id        String             @id @default(uuid()) @db.Uuid
  name      String             @db.VarChar(120)
  slug      String             @unique @db.VarChar(80)
  status    OrganizationStatus @default(ACTIVE)

  members   OrganizationMember[]
  workspaces Workspace[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("organizations")
}

model OrganizationMember {
  id             String           @id @default(uuid()) @db.Uuid
  organizationId String           @db.Uuid
  userId         String           @db.Uuid
  status         MembershipStatus @default(INVITED)
  joinedAt       DateTime?

  organization Organization @relation(
    fields: [organizationId],
    references: [id],
    onDelete: Cascade
  )

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([organizationId, userId])
  @@index([userId])
  @@map("organization_members")
}

model Workspace {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @db.Uuid
  name           String @db.VarChar(120)
  slug           String @db.VarChar(80)
  timezone       String @default("UTC")

  organization Organization @relation(
    fields: [organizationId],
    references: [id],
    onDelete: Cascade
  )

  members  WorkspaceMember[]
  teams    Team[]
  projects Project[]
  workflows Workflow[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([organizationId, slug])
  @@index([organizationId])
  @@map("workspaces")
}

model WorkspaceMember {
  id          String           @id @default(uuid()) @db.Uuid
  workspaceId String           @db.Uuid
  userId      String           @db.Uuid
  status      MembershipStatus @default(INVITED)

  workspace Workspace @relation(
    fields: [workspaceId],
    references: [id],
    onDelete: Cascade
  )

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([workspaceId, userId])
  @@index([userId])
  @@map("workspace_members")
}

```

`User` هنا هو Model مركزي مرتبط بنظام Authentication. غادي نكملو العلاقات ديالو فـ Identity Domain.

## **4.2 Project Model**

`projects.prisma`

```

model Project {
  id          String        @id @default(uuid()) @db.Uuid
  workspaceId String        @db.Uuid
  name        String        @db.VarChar(150)
  key         String        @db.VarChar(12)
  description String?       @db.Text
  status      ProjectStatus @default(PLANNING)

  nextIssueNumber Int @default(1)

  startDate DateTime?
  dueDate   DateTime?

  workspace Workspace @relation(
    fields: [workspaceId],
    references: [id],
    onDelete: Restrict
  )

  issues    Issue[]
  boards    Board[]
  sprints   Sprint[]
  members   ProjectMember[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([workspaceId, key])
  @@unique([id, workspaceId])
  @@index([workspaceId, status])
  @@map("projects")
}

model ProjectMember {
  id        String @id @default(uuid()) @db.Uuid
  projectId String @db.Uuid
  userId    String @db.Uuid

  project Project @relation(
    fields: [projectId],
    references: [id],
    onDelete: Cascade
  )

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([projectId, userId])
  @@index([userId])
  @@map("project_members")
}

```

ملاحظة: ضفت `@@unique([id, workspaceId])` باش نستعملو Composite Foreign Keys مستقبلاً، ونقدرو نضمنو أن العلاقات ما كتخلطش بيانات Workspaces مختلفة.

## **4.3 Issue Model**

`issues.prisma`

```

model Issue {
  id          String @id @default(uuid()) @db.Uuid
  projectId   String @db.Uuid
  parentId    String? @db.Uuid

  issueNumber Int
  title       String @db.VarChar(255)
  description Json?

  type        IssueType
  priority    IssuePriority @default(MEDIUM)

  statusId    String @db.Uuid

  reporterId  String @db.Uuid
  assigneeId  String? @db.Uuid

  storyPoints Decimal? @db.Decimal(8, 2)

  startDate DateTime?
  dueDate   DateTime?

  position  Decimal @default(0) @db.Decimal(20, 6)

  project Project @relation(
    fields: [projectId],
    references: [id],
    onDelete: Restrict
  )

  parent Issue? @relation(
    "IssueHierarchy",
    fields: [parentId],
    references: [id],
    onDelete: Restrict
  )

  children Issue[] @relation("IssueHierarchy")

  status WorkflowStatus @relation(
    fields: [statusId],
    references: [id],
    onDelete: Restrict
  )

  reporter User @relation(
    "IssueReporter",
    fields: [reporterId],
    references: [id]
  )

  assignee User? @relation(
    "IssueAssignee",
    fields: [assigneeId],
    references: [id]
  )

  sourceLinks IssueLink[] @relation("IssueLinkSource")
  targetLinks IssueLink[] @relation("IssueLinkTarget")

  comments Comment[]
  watchers IssueWatcher[]
  history IssueHistory[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@unique([projectId, issueNumber])
  @@index([projectId, statusId, position])
  @@index([assigneeId, statusId])
  @@index([parentId])
  @@index([reporterId])
  @@index([dueDate])
  @@map("issues")
}

```

**3 قرارات مهمة هنا:**

1. `description Json?`: نقدروا نخزنو Rich Text من Tiptap/ProseMirror بطريقة منظمة، مع إمكانية تطوير editor لاحقاً.
2. `position Decimal`: لترتيب Issues داخل Board بلا ما نحتاجو نعاودو نرقمو جميع المهام مع كل Drag & Drop.
3. `deletedAt`: Soft Delete للـ Issues، مع الاحتفاظ بالـ History.

## **4.4 Workflow Models**

`workflows.prisma`

```

model Workflow {
  id          String  @id @default(uuid()) @db.Uuid
  workspaceId String  @db.Uuid
  name        String  @db.VarChar(120)
  description String? @db.Text
  isDefault   Boolean @default(false)

  workspace Workspace @relation(
    fields: [workspaceId],
    references: [id],
    onDelete: Cascade
  )

  statuses    WorkflowStatus[]
  transitions WorkflowTransition[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([workspaceId])
  @@map("workflows")
}

model WorkflowStatus {
  id         String         @id @default(uuid()) @db.Uuid
  workflowId String         @db.Uuid
  name       String         @db.VarChar(80)
  category   StatusCategory
  color      String?        @db.VarChar(20)
  position   Int            @default(0)

  workflow Workflow @relation(
    fields: [workflowId],
    references: [id],
    onDelete: Cascade
  )

  issues      Issue[]
  fromTransitions WorkflowTransition[] @relation("TransitionFrom")
  toTransitions   WorkflowTransition[] @relation("TransitionTo")

  @@unique([workflowId, name])
  @@unique([id, workflowId])
  @@map("workflow_statuses")
}

model WorkflowTransition {
  id           String @id @default(uuid()) @db.Uuid
  workflowId   String @db.Uuid
  fromStatusId String @db.Uuid
  toStatusId   String @db.Uuid
  name         String @db.VarChar(100)

  workflow Workflow @relation(
    fields: [workflowId],
    references: [id],
    onDelete: Cascade
  )

  fromStatus WorkflowStatus @relation(
    "TransitionFrom",
    fields: [fromStatusId],
    references: [id],
    onDelete: Cascade
  )

  toStatus WorkflowStatus @relation(
    "TransitionTo",
    fields: [toStatusId],
    references: [id],
    onDelete: Cascade
  )

  @@index([workflowId, fromStatusId])
  @@map("workflow_transitions")
}

```

هاد Models هما Core فقط. `WorkflowScheme`, `WorkflowSchemeMapping`, `WorkflowCondition`, `WorkflowValidator` و`WorkflowTransitionLog` غادي نضيفوهم فالتفصيل النهائي.

## **4.5 Custom Fields Models**

`customization.prisma`

```

model CustomField {
  id          String          @id @default(uuid()) @db.Uuid
  workspaceId String          @db.Uuid
  name        String          @db.VarChar(100)
  fieldKey    String          @db.VarChar(100)
  type        CustomFieldType
  description String?         @db.Text

  options    CustomFieldOption[]
  values     IssueCustomFieldValue[]
  projects   ProjectCustomField[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([workspaceId, fieldKey])
  @@map("custom_fields")
}

model CustomFieldOption {
  id        String @id @default(uuid()) @db.Uuid
  fieldId   String @db.Uuid
  value     String @db.VarChar(150)
  label     String @db.VarChar(150)
  position  Int    @default(0)

  field CustomField @relation(
    fields: [fieldId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([fieldId, value])
  @@map("custom_field_options")
}

model IssueCustomFieldValue {
  id        String @id @default(uuid()) @db.Uuid
  issueId   String @db.Uuid
  fieldId   String @db.Uuid

  textValue    String?   @db.Text
  numberValue  Decimal?  @db.Decimal(20, 6)
  booleanValue Boolean?
  dateValue    DateTime?
  jsonValue    Json?

  field CustomField @relation(
    fields: [fieldId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([issueId, fieldId])
  @@index([fieldId])
  @@map("issue_custom_field_values")
}

```

خاصنا نضيفو `Issue` relation و`ProjectCustomField` فـ النسخة النهائية، ونضيفو SQL checks ديال Type/Value consistency.

# **5. Additional Database Design Rules**

قبل ما نعتامدو Schema نهائياً، كاينين قواعد خاصنا نفرضوها.

| Concern                | Database rule                                                    |
| ---------------------- | ---------------------------------------------------------------- |
| Tenant isolation       | Every tenant-owned record belongs to a Workspace or Organization |
| Cross-tenant relations | Forbidden                                                        |
| Duplicate memberships  | Unique constraints                                               |
| Issue hierarchy        | Prevent cycles                                                   |
| Issue numbering        | Transactional counter                                            |
| Workflow statuses      | Must belong to applicable workflow                               |
| Custom fields          | One typed value per field                                        |
| Automation             | Idempotent execution                                             |
| Audit logs             | Append-only                                                      |
| Deletion               | Explicit retention policies                                      |

### **Composite Foreign Keys**

مثلاً ما خاصش Issue من Workspace A يتربط بـ Status من Workspace B.

الحل الأفضل هو Composite Foreign Keys.

نضيفو `workspaceId` فـ بعض الـ tables التابعة، ونستعملو علاقات مركبة بحال:

```
@@unique([id, workspaceId])
```

ثم:

```
@relation(
  fields: [statusId, workspaceId],
  references: [id, workspaceId]
)
```

هادشي كيحتاج كذلك أن Status يحمل `workspaceId`، ونفس المنطق بالنسبة لـ Project وIssue. غادي نطبقوه على جميع العلاقات الحساسة فـ Final Schema.

# **6. Prisma Client Integration**

بما أننا كنستعملو Prisma 7 مع PostgreSQL، غادي نستعملو `@prisma/adapter-pg`.

`packages/database/src/client.ts`:

```

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma = new PrismaClient({
  adapter,
});

```

Prisma 7 كيحتاج Driver Adapter فهاد طريقة الاتصال، والـ Client كيتولد فـ Custom Output Path.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.prisma.io\&sz=32)

Prisma Documentation+2



# **7. Build Execution Plan**

دابا عندنا التصميم العام، ولكن مازال خاصنا نكملو جميع Models والقيود قبل أول Migration.

غادي نقسمو التنفيذ:

## **WORKO Database Roadmap**

1. **DB-01 — Foundation**

   Architecture defined

   UUID, timestamps, tenancy strategy, conventions, enums.
2. **DB-02 — Identity & Access**

   User, OrganizationMember, WorkspaceMember, Role, Permission, assignments.
3. **DB-03 — Project & Issue Core**

   Team, Project, Issue, IssueLink, hierarchy, labels, watchers.
4. **DB-04 — Workflow Engine**

   Workflows, schemes, transitions, conditions, validators, logs.
5. **DB-05 — Planning**

   Boards, columns, filters, swimlanes, sprints.
6. **DB-06 — Collaboration**

   Comments, mentions, attachments, activity, history.
7. **DB-07 — Customization**

   Custom Fields, values, options, templates.
8. **DB-08 — Automation & Platform**

   Rules, triggers, actions, executions, notifications, audit, integrations.
9. **DB-09 — Constraints & Indexing**

   Composite FKs, CHECK constraints, indexes, tenant isolation.
10. **DB-10 — Migration & Seed**

    Generate, migrate, seed, integration tests.

# **8. شنو خاصنا نديرو دابا؟**

ما ننصحكش تدير `prisma migrate dev` دابا، حيث الـ Models اللي عرضنا هنا هي Core Design Examples، ماشي Schema كاملة ومتحقق منها.

أول تنفيذ خاصو يكون **DB-01 + DB-02**.

الـ Definition of Done ديال DB-02:

- Better Auth-compatible User model.
- Organization and Workspace membership.
- Team and Team membership.
- RBAC tables.
- Project-level role assignments.
- Composite constraints.
- Prisma validation.
- Initial migration.

**القرار المعماري النهائي:** Prisma Schema تبقى مركزية داخل `packages/database`، ولكن تنظيمها Multi-file حسب Domains، وNestJS ما يكونش هو المالك ديال Database Schema.

المراجع الرسمية:

- [Prisma 7 Schema](https://www.prisma.io/docs/orm/v7/prisma-schema/overview?utm_source=chatgpt.com)
- [Prisma Config](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference?utm_source=chatgpt.com)
- [PostgreSQL Driver Adapter](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers?utm_source=chatgpt.com)
- [Prisma Client Generator](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators?utm_source=chatgpt.com)

الخطوة التالية هي بناء **DB-01 + DB-02 فعلياً**، والتحقق من Prisma Schema قبل الانتقال إلى Issue Management.