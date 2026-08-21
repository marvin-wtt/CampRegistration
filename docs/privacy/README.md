# Data Processing Agreement (DPA) template

This directory contains language-specific templates for data processing agreements under Article 28 GDPR for operators of self-hosted instances of the application. The initial legal template is provided in German; additional language versions can be added without changing the directory structure.

It is designed for the following relationship:

**organisation / event organiser (controller) → instance operator (processor)**

The template is intended to be usable both by the project's own hosted instance and by independent self-hosters. It is **not automatically valid for every deployment**. The operator of each instance must review and complete it based on the actual deployment, providers, security measures and data flows.

## Files

- `dpa-template.de.md` — German DPA template, including the description of processing.
- `tom-template.de.md` — German template for the technical and organisational measures (TOMs).
- `subprocessors-template.de.md` — German template for the list of approved subprocessors.
- `README.md` — language-neutral deployment and customisation guide.

Future translations should follow the same naming scheme, for example:

- `dpa-template.en.md`
- `tom-template.en.md`
- `subprocessors-template.en.md`
- `dpa-template.fr.md`
- `tom-template.fr.md`
- `subprocessors-template.fr.md`

The language suffix identifies the language of the legal text, not the country in which the instance is hosted.

## Localisation and legal variants

Translations should remain semantically aligned with the source template, but they must not be treated as mere UI translations. Legal terminology can differ between languages and Member States.

The recommended approach is:

- keep a canonical template version and version all translations together;
- identify each document by language using a BCP 47 / ISO-style language suffix such as `.de.md`, `.en.md` or `.fr.md`;
- avoid country-specific filenames unless the legal content genuinely differs by jurisdiction;
- create a separate jurisdiction variant only where national law requires materially different clauses, for example `dpa-template.de-DE.md` versus another national variant;
- keep deployment-specific values such as operator identity, hosting location, subprocessors and TOMs outside the translated prose where possible, using placeholders.

This repository template is currently designed for processing within the EEA. A translation into another language does not change that territorial scope.

“AVV” is the common German abbreviation for an Article 28 data processing agreement (“Auftragsverarbeitungsvertrag”).

## Legal model

The template is based on the mandatory controller–processor elements of Article 28(3) and (4) GDPR and is informed by:

- Regulation (EU) 2016/679 (GDPR), in particular Articles 28 and 32–36;
- Commission Implementing Decision (EU) 2021/915 on standard contractual clauses between controllers and processors;
- guidance on controller/processor roles by the European Data Protection Board; and
- the German supervisory authority (BayLDA) model for data processing agreements.

The project-specific template is **not itself the European Commission's standard contractual clauses**. It is an individually drafted Article 28 agreement intended to contain the mandatory elements for this application.

The European Commission expressly allows controllers and processors either to use an individual agreement containing the mandatory Article 28 elements or to use Commission standard contractual clauses in whole or in part.

## Important role distinction

Publishing, developing or contributing to the open-source application does **not** make a developer a processor.

The processor is normally the legal or natural person that operates an instance and processes personal data on behalf of another organisation.

Examples:

- An association operates the application only for its own events on infrastructure it controls: there may be no separate controller–processor relationship between the association and itself. Hosting or other service providers may still be processors.
- A provider operates an instance for several independent organisations: the provider will typically act as processor for the event data, while each organisation remains controller for its own processing.
- A third-party IT company operates an instance exclusively for one organisation: the IT company may be the processor and the organisation the controller.

Actual roles always depend on who determines the purposes and essential means of a particular processing activity.

## Scope of this template

The template is deliberately broad enough to cover the application's event-management functionality, including registration forms, participant administration, files, communications, organisational functions, permissions, exports, billing/expense-related functions and backups.

It also anticipates the possible processing of:

- data of children and young people;
- health data and other special categories of personal data under Article 9 GDPR; and
- free-text and uploaded documents defined by the controller.

The controller remains responsible for deciding whether collecting a particular category of data is lawful and necessary.

Data concerning criminal convictions and offences under Article 10 GDPR are **not included as a standard intended category**. If a deployment intentionally supports such processing, the DPA, legal basis and safeguards should be reviewed separately before use.

## EEA-only processing

This template intentionally uses a stricter deployment rule than the GDPR would require in every case:

> Personal data covered by the DPA may only be processed within the European Economic Area (EEA).

For this template, operators must therefore ensure that:

- hosting takes place in the EEA;
- backups remain in the EEA;
- subprocessors process the covered data in the EEA;
- support or administration does not give personnel located in third countries access to covered personal data; and
- no application integration transfers covered data to a third country.

The fact that a provider is incorporated in the EEA does not, by itself, prove that all relevant processing and remote access stay in the EEA. The operator must check the provider's DPA, subprocessor list and service documentation.

If an operator wants to permit third-country transfers, this template must be changed and the requirements of Chapter V GDPR must be assessed separately.

## Subprocessors

The template uses **general prior authorisation** for subprocessors.

This means the controller does not have to sign a new agreement each time the instance operator changes a hosting, email, storage or similar processor. Instead:

1. the current subprocessors are listed in `subprocessors-template.de.md`;
2. the operator informs the controller normally at least 14 calendar days before adding or replacing a subprocessor;
3. the controller may object for substantiated data-protection reasons; and
4. every subprocessor must be bound by data-protection obligations appropriate to the processing and compatible with the DPA.

The operator must also check relevant subprocessor chains of its providers. A provider's own DPA and subprocessor documentation are important evidence, but they do not replace the operator's obligation to maintain an accurate list for its own service.

## Technical and organisational measures

`tom-template.de.md` is intentionally a **template and checklist**, not a statement that every listed security control exists.

Before using the DPA, the instance operator must:

- remove measures that are not implemented;
- accurately describe the measures that are implemented;
- distinguish existing controls from planned improvements;
- document relevant hosting-provider controls;
- set actual backup and log-retention periods;
- document the authorisation / tenant-isolation model; and
- make sure the resulting measures are appropriate to the risks of the deployment.

This is especially important because the application may process children's data and health data.

Do not copy security claims from another deployment without verifying them.

## Required placeholders

At minimum, replace all placeholders matching `{{...}}`.

Important groups include:

### Parties

- `{{CONTROLLER_*}}`
- `{{PROCESSOR_*}}`
- `{{PROCESSOR_PRIVACY_CONTACT}}`

### Deployment

- `{{INSTANCE_URL_OR_SERVICE_NAME}}`
- `{{HOSTING_LOCATION}}`
- actual EEA processing locations

### Retention

- `{{PRODUCTION_DATA_DELETION_PERIOD}}`
- `{{BACKUP_RETENTION_PERIOD}}`
- log-retention periods in the TOMs

### Contract metadata

- `{{DPA_VERSION}}`
- `{{DPA_DATE}}`
- `{{TOM_VERSION}}`
- `{{TOM_DATE}}`
- subprocessor-list version/date
- applicable Member State law

### Security

All TOM placeholders must be reviewed and completed. Do not leave generic sample statements in a production agreement if they do not accurately describe the deployment.

## Subprocessor review

For every service involved in processing covered personal data, review at least:

- the provider's Article 28 agreement;
- the provider's actual processing locations;
- the provider's subprocessor list;
- remote-support and administration locations;
- security / TOM documentation;
- backup and deletion rules; and
- whether the provider can change subprocessors and how such changes are notified.

Typical services that may need assessment include hosting, database hosting, object/file storage, backup services, transactional email, monitoring/logging services, customer support systems and external API services.

A software library that runs entirely inside the operator's own infrastructure does not become a subprocessor merely because it is open-source or maintained by a third party.

## Controller responsibilities

The DPA deliberately makes clear that the event organiser remains responsible for, among other things:

- the lawful purposes of its event processing;
- legal bases under Article 6 GDPR;
- any additional condition required under Article 9 GDPR;
- transparency information to participants, guardians and other data subjects;
- data minimisation;
- retention decisions specific to the event;
- appropriate user access rights assigned by the controller; and
- the lawfulness of instructions given to the processor.

Public authorities and organisations in regulated sectors may have additional national requirements. The template does not attempt to enumerate all sector-specific laws in every EEA country.

## Deletion and backups

Article 28 GDPR requires the processor, at the controller's choice, to delete or return personal data after the processing service ends, unless applicable law requires retention.

The template therefore requires the operator to define:

- the period for deletion from production systems; and
- the maximum backup-retention period.

Backups may contain data that has already been deleted from production until the normal backup cycle expires. They should not be used for ordinary processing, and a restoration process must avoid reintroducing previously deleted data into normal use.

## Audits

Article 28 requires the processor to provide information needed to demonstrate compliance and to allow and contribute to audits, including inspections.

The template therefore uses a proportionate approach:

- normal evidence starts with DPA/TOM documentation, subprocessor information and available certifications or reports;
- further audits can be performed when appropriate;
- audits are normally coordinated in advance and should not compromise other customers or system security; and
- incidents, substantiated concerns or supervisory-authority requests may justify more immediate or extensive checks.

This does not restrict the statutory powers of data protection authorities.

## Electronic acceptance

The DPA is designed to support electronic acceptance inside the application.

A production implementation should record at least:

- which organisation accepted the DPA;
- which authenticated account acted for that organisation;
- a declaration that the person is authorised to act for the organisation;
- timestamp; and
- exact DPA version.

The accepting organisation must be able to retrieve or save the version of the DPA and annexes that applied when it accepted.

A handwritten signature is not inherently required by Article 28; the agreement must be in writing, including electronic form.

## Versioning

Recommended repository / application practice:

1. Give the DPA, TOMs and subprocessor list explicit versions or dates.
2. Keep immutable historical versions that were actually accepted.
3. Store the version accepted by each organisation.
4. Do not silently replace the contractual text for existing organisations.
5. Determine whether a material change requires renewed acceptance or can be handled under an agreed change mechanism.
6. Use the specific subprocessor-notification mechanism for subprocessor changes.

## Before using this on a production instance

Complete this checklist:

- [ ] Identify the actual controller and processor.
- [ ] Replace every `{{...}}` placeholder.
- [ ] Confirm that the processing description matches enabled application features.
- [ ] Confirm whether special-category data are actually supported.
- [ ] Verify all processing and remote access remain in the EEA.
- [ ] Complete the real TOMs; remove unimplemented claims.
- [ ] List every relevant subprocessor.
- [ ] Review each provider's DPA and subprocessor chain.
- [ ] Set production-data, backup and log-retention periods.
- [ ] Define the privacy/security incident contact.
- [ ] Confirm the electronic acceptance and versioning implementation.
- [ ] Make the accepted DPA and annexes retrievable by the controller.
- [ ] Review whether the instance operator has any separate processing for its own purposes and document that separately.
- [ ] Have the final deployment-specific version reviewed where the deployment, organisation type or national law creates additional legal requirements.

## No automatic compliance

This template is intended to reduce the work required to document an Article 28 processor relationship. It cannot determine whether a particular deployment is compliant merely by being included in a repository.

Compliance depends on the actual roles, processing, providers, security measures, instructions and organisational practices of the specific instance.

In particular, an operator must not state security measures, EEA-only processing, deletion periods or subprocessor arrangements that are not true for the deployed system.
