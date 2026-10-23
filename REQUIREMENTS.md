# REQUIREMENTS.md - Zelo (Medication Tracking App)

## 1. User & Forms Module

* **RF001 - User Registration**[cite: 1]
  * **Priority:** Essential[cite: 1]
  * **Description:** The system must allow new users to register via a form filled out with their personal information.[cite: 1]

* **RF002 - User Login**[cite: 1]
  * **Priority:** Essential[cite: 1]
  * **Description:** The system must allow caregivers to log in using registered credentials as a method of authentication and access authorization.[cite: 1]

* **RF003 - Profile and User View**[cite: 1]
  * **Priority:** Essential[cite: 1]
  * **Description:** The system must allow the creation and viewing of a page containing the user's full profile based on data provided in the registration form.[cite: 1]

* **RF004 - Edit User Information**[cite: 1]
  * **Priority:** Essential[cite: 1]
  * **Description:** The system must allow editing and updating of registered user information.[cite: 1]

* **RF005 - Delete User**[cite: 1]
  * **Priority:** Essential[cite: 1]
  * **Description:** The system must allow the deletion of a user's account from the system.[cite: 1]

* **RF006 - Elderly-Caregiver/Family Link**[cite: 1]
  * **Priority:** Essential[cite: 1]
  * **Description:** The system must allow account pairing (via QR code or sent invitation) so that the caregiver/family member can remotely view and manage the elderly person's routine.[cite: 1]

---

## 2. Routine & Monitoring Module

* **RF007 - Medication/Treatment Schedule Grid**[cite: 1]
  * **Priority:** Essential[cite: 1]
  * **Description:** The system must allow the caregiver to add necessary medications and treatments for the user through a form with medication details and schedules.[cite: 1]

* **RF008 - Daily Observation and Symptom Logging by Caregiver**[cite: 1]
  * **Priority:** Desirable[cite: 1]
  * **Description:** The system must allow the caregiver to make quick or detailed notes regarding adverse reactions, blood pressure, blood glucose, or symptoms reported by the monitored user during the day.[cite: 1]

---

## 3. Alarms & Emergency Module

* **RF009 - Smart Custom Alarms**[cite: 1]
  * **Priority:** Important[cite: 1]
  * **Description:** The system must allow the creation of custom alarms that issue prominent visual alerts (with large fonts and legible colors).[cite: 1]

* **RF010 - Medication Intake Confirmation**[cite: 1]
  * **Priority:** Important[cite: 1]
  * **Description:** The system must allow the user to confirm medication intake using alarms accompanied by large visual alerts and text-to-speech voice reading.[cite: 1]

* **RF011 - Treatment Attendance Confirmation**[cite: 1]
  * **Priority:** Important[cite: 1]
  * **Description:** The system must allow confirmation that the user attended a scheduled treatment/appointment using expansive visual alerts and a voice feature.[cite: 1]

* **RF012 - Caregiver Alert**[cite: 1]
  * **Priority:** Essential[cite: 1]
  * **Description:** The system must send a notification to the caregiver after 10 minutes if the user does not confirm medication intake or attendance for programmed alarms within the set time limit.[cite: 1]

---

## 4. Logistics & Support Module

* **RF013 - Medication Inventory Control**[cite: 1]
  * **Priority:** Important[cite: 1]
  * **Description:** The system must allow automatic medication inventory control. With each intake confirmation, the total quantity provided must be reduced. The system must issue a warning to the caregiver when inventory reaches a minimum safety threshold.[cite: 1]

* **RF014 - Intention to be confirmed**

---

## 5. Draft Requirements for Review (Not Approved)

The requirements below are proposals for stakeholder review, not approved product rules. Confirm their scope, priorities, and acceptance criteria before implementation. No backend or clinical rules are selected by this draft.

### Functional Requirements

* **RF014 - Caregiver Link and Access Management (Candidate; confirm scope)**
  * **Priority:** Essential (suggested)
  * **Description:** The system should allow authorized users to review, accept, decline, and revoke caregiver links, and should restrict access to routines according to the approved relationship and permissions.
  * **Proposed acceptance criteria:**
    * A pending invitation does not grant access to the monitored person's routine.
    * An unlinked or unauthorized account cannot view or manage that person's routine.
    * After a link is revoked, subsequent access requests are denied; handling of data already cached on a device follows an approved policy.
  * **Decisions to validate:** Who may create and accept an invitation; whether consent may be given by a representative; invitation expiry and reuse; which roles may view or manage data; and what happens to cached data after revocation.
  * **Alternative scopes if this is not the intended RF014:** Define user roles and authorization, or specify account-removal and shared-data behavior. Do not select one without stakeholder confirmation.

* **RF015 - Edit and Deactivate Schedules (Proposed)**
  * **Priority:** Important (suggested)
  * **Description:** The system should allow an authorized caregiver to edit, pause, resume, or end a medication or treatment schedule created under RF007.
  * **Proposed acceptance criteria:**
    * Only an authorized user can change a schedule.
    * A saved change is reflected in future schedule views and reminder attempts.
    * A change does not silently rewrite previously recorded confirmations.
  * **Decisions to validate:** Which schedule fields may be changed; how recurring schedules, time-zone changes, and already scheduled reminders behave; and whether ending a schedule requires a reason.

* **RF016 - Confirmation and Inventory History (Proposed)**
  * **Priority:** Important (suggested)
  * **Description:** The system should provide an authorized user with a history of medication confirmations and related inventory changes, including corrections.
  * **Proposed acceptance criteria:**
    * Repeating the same confirmation request does not reduce inventory more than once for that dose event.
    * A correction is recorded as a separate event and does not silently erase the original event.
    * Each history event identifies its type, time, responsible account, and inventory effect where applicable.
  * **Decisions to validate:** Who may correct or adjust an event; whether a correction requires a reason; which roles can view history; retention period; and how the inventory is reconciled after a correction. No medication quantity or clinical rule is specified here.

### Non-Functional Requirements

* **RNF001 - Privacy and Access Protection (Proposed)**
  * **Priority:** Essential (suggested)
  * **Description:** Personal and health-related data should be accessible only to the account owner and currently authorized linked users, and should be protected in transit and at rest.
  * **Proposed acceptance criteria:**
    * Access-control tests deny requests from accounts without the required relationship and permission.
    * Application logs and diagnostic output do not expose personal or health-related data.
    * Account deletion and data retention follow a documented, approved policy.
  * **Decisions to validate:** Applicable privacy obligations, retention and backup periods, deletion behavior for shared records, and the authorized roles for each data category.

* **RNF002 - Android Accessibility (Proposed)**
  * **Priority:** Essential (suggested)
  * **Description:** Essential tasks should be usable with Android accessibility services, readable text, strong contrast, and sufficiently large touch targets.
  * **Proposed acceptance criteria:**
    * Login, schedule review, alarm response, and confirmation can be completed using TalkBack.
    * Essential actions have meaningful accessible labels, and information is not conveyed by color alone.
    * At the approved text-scaling setting, essential text and actions remain visible and operable without clipping or overlap.
    * Contrast and touch-target sizes are checked against accessibility criteria selected for the product; WCAG AA contrast and 48 dp touch targets are suggested starting points for review.
  * **Decisions to validate:** Required text-scaling range, accessibility conformance target, and whether voice output can be disabled while keeping equivalent visual information available.

* **RNF003 - Offline Operation and Synchronization (Proposed)**
  * **Priority:** Essential if offline alarm behavior is confirmed (suggested)
  * **Description:** The system should define which approved schedule data and actions remain available without network access and how pending changes are reconciled after reconnection.
  * **Proposed acceptance criteria:**
    * Offline tests verify access to the schedule data explicitly designated for local availability.
    * Pending actions have a visible status and are not silently discarded when connectivity returns.
    * Repeated synchronization does not duplicate confirmations or inventory changes.
    * Alarm behavior in foreground, background, and terminated states is tested on supported Android configurations, and platform limitations are disclosed to the user.
  * **Decisions to validate:** Which data and actions are available offline; conflict-resolution rules; local-data handling; and which alarm states the product supports. This requirement does not guarantee notification delivery under Android power, permission, or scheduling restrictions.

* **RNF004 - Notification Behavior and Status (Proposed)**
  * **Priority:** Essential (suggested, related to RF012)
  * **Description:** The system should make notification attempts for unconfirmed events observable and avoid duplicate alert attempts, while communicating permission and platform limitations.
  * **Proposed acceptance criteria:**
    * A timing test verifies that no caregiver alert attempt occurs before the approved 10-minute threshold and that no more than one attempt is recorded for the same event, unless an approved retry policy applies.
    * The system distinguishes an alert attempt from confirmed delivery to a device.
    * Tests cover notification permission denied, device offline, and supported background/terminated states; the user is informed when a limitation prevents the expected behavior.
  * **Decisions to validate:** The event from which the 10-minute interval starts; retry policy; what counts as a successful delivery; and user-facing behavior when delivery cannot be confirmed. Android/Expo behavior must be validated on supported devices; delivery is not guaranteed by this proposal.

* **RNF005 - Android Compatibility and Release Stability (Proposed)**
  * **Priority:** Important (suggested)
  * **Description:** The application should support a documented range of Android versions and devices, with critical user flows validated before release.
  * **Proposed acceptance criteria:**
    * The minimum Android version and device test matrix are documented before release.
    * Release-candidate tests cover registration/login, linked access, schedule review, alarm response, confirmation, and accessibility on the supported test matrix.
    * No unresolved critical defects remain in those flows at release approval.
  * **Decisions to validate:** Minimum Android version, representative devices, release-blocking defect severity, and whether any device-specific restrictions need to be communicated.

### Source Items to Resolve

* The `[cite: 1]` markers in RF001-RF013 are unresolved references and should be checked against their source before publication of the approved specification.
* The meaning of the priority labels (Essential, Important, and Desirable) should be documented if the team uses them as release gates.