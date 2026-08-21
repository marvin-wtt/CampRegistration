# Anlage 2 – Technische und organisatorische Maßnahmen (TOM)

**Zugehöriger AVV:** `{{DPA_VERSION}}`  
**TOM-Version:** `{{TOM_VERSION}}`  
**Stand:** `{{TOM_DATE}}`  
**Instanz / Dienst:** `{{INSTANCE_URL_OR_SERVICE_NAME}}`  
**Auftragsverarbeiter:** `{{PROCESSOR_NAME}}`

> **Wichtig für Instanzbetreiber:** Diese Datei ist eine Prüfliste und Vorlage. Eine Maßnahme darf nur als bestehende TOM angegeben werden, wenn sie auf der konkreten Instanz tatsächlich umgesetzt ist. Nicht zutreffende Beispielpunkte sind zu entfernen oder eindeutig als geplant zu kennzeichnen. Geplante Maßnahmen sind keine bestehenden TOM.

## 1. Ziel und Risikobezug

Die Maßnahmen dienen dazu, ein dem Risiko angemessenes Schutzniveau gemäß Art. 32 DSGVO sicherzustellen. Bei der Festlegung wurden bzw. werden insbesondere berücksichtigt:

- Art, Umfang, Umstände und Zwecke der Verarbeitung;
- Verarbeitung von Daten von Kindern und Jugendlichen;
- mögliche Verarbeitung von Gesundheitsdaten und anderen besonderen Kategorien personenbezogener Daten;
- Zahl und Rollen der zugriffsberechtigten Personen;
- mögliche Folgen eines Verlusts von Vertraulichkeit, Integrität oder Verfügbarkeit;
- Stand der Technik und Implementierungskosten.

**Dokumentierte Risikobewertung vorhanden:** `{{YES_NO_AND_REFERENCE}}`

## 2. Organisation und Verantwortlichkeiten

Tatsächlich umgesetzte Maßnahmen:

- `{{ORGANISATIONAL_RESPONSIBILITY_MEASURES}}`
- `{{PRIVACY_AND_SECURITY_CONTACTS_OR_ROLES}}`
- `{{POLICY_AND_REVIEW_MEASURES}}`

Zu prüfen sind insbesondere:

- klare Zuständigkeit für Betrieb, Datenschutz und Informationssicherheit;
- dokumentierte Verfahren für Berechtigungen, Vorfälle, Backups und Löschung;
- regelmäßige Überprüfung der Schutzmaßnahmen;
- Verfahren zur Behandlung von Sicherheitsmeldungen und Schwachstellen.

## 3. Zutritts- und physische Sicherheit

Da Infrastruktur häufig bei einem Hosting-Anbieter betrieben wird, sind sowohl die eigenen Maßnahmen als auch die vertraglich zugesicherten Maßnahmen des Hosting-Anbieters zu berücksichtigen.

**Rechenzentrum / Hosting-Standort:** `{{HOSTING_LOCATION}}`  
**Physische Schutzmaßnahmen:** `{{PHYSICAL_SECURITY_MEASURES}}`

Beispiele, nur wenn tatsächlich zutreffend:

- kontrollierter Zutritt zu Rechenzentren;
- Besucher- und Zutrittsverfahren;
- Schutz gegen unbefugten physischen Zugriff;
- Brand-, Strom- und Umweltschutz des Rechenzentrums.

## 4. Zugangs- und Authentifizierungsschutz

**Tatsächlich umgesetzte Maßnahmen:** `{{AUTHENTICATION_MEASURES}}`

Zu prüfen sind insbesondere:

- individuelle Benutzerkonten;
- sichere Passwortspeicherung mit einem geeigneten Passwort-Hashverfahren;
- Schutz vor automatisierten Anmeldeversuchen;
- Mehrfaktor-Authentifizierung für besonders privilegierte Konten, soweit risikoadäquat;
- sichere Sitzungs- und Tokenverwaltung;
- zeitnahe Sperrung oder Entfernung nicht mehr benötigter Konten;
- sichere Verfahren für Passwort- bzw. Zugangswiederherstellung.

## 5. Berechtigungs- und Zugriffskontrolle

**Rollen-/Berechtigungskonzept:** `{{AUTHORIZATION_MODEL}}`

**Tatsächlich umgesetzte Maßnahmen:** `{{ACCESS_CONTROL_MEASURES}}`

Zu prüfen sind insbesondere:

- serverseitige Berechtigungsprüfung;
- Prinzip der geringsten erforderlichen Rechte;
- Trennung verschiedener Organisationen und Veranstaltungen;
- Einschränkung administrativer Zugriffe auf erforderliche Personen;
- regelmäßige Überprüfung privilegierter Zugriffe;
- Entzug nicht mehr erforderlicher veranstaltungsbezogener Berechtigungen;
- besonderer Schutz sensibler Datenfelder und Dateien entsprechend der Risikobewertung.

## 6. Mandanten- und Trennungskontrolle

**Technisches Trennungsmodell:** `{{TENANT_ISOLATION_MODEL}}`

**Tatsächlich umgesetzte Maßnahmen:** `{{TENANT_ISOLATION_MEASURES}}`

Zu prüfen sind insbesondere:

- keine unberechtigten Zugriffe zwischen Organisationen oder Veranstaltungen;
- konsistente Autorisierungsprüfung für API, Dateien, Exporte und Administrationsfunktionen;
- Tests gegen IDOR/BOLA und vergleichbare Autorisierungsfehler;
- getrennte Verwendung von Daten entsprechend den Weisungen der jeweiligen Verantwortlichen.

## 7. Transport- und Übermittlungssicherheit

**Tatsächlich umgesetzte Maßnahmen:** `{{TRANSPORT_SECURITY_MEASURES}}`

Mindestens zu prüfen:

- verschlüsselte Übertragung über TLS/HTTPS;
- sichere interne Verbindungen, soweit risikoadäquat;
- Schutz von administrativen Verbindungen;
- kein Drittlandtransfer und kein Fernzugriff aus Drittländern im Rahmen dieses AVV;
- kontrollierte Datenexporte.

## 8. Verschlüsselung und Schutz gespeicherter Daten

**Speicherverschlüsselung / Datenträgerverschlüsselung:** `{{AT_REST_ENCRYPTION}}`  
**Anwendungsseitige Verschlüsselung besonderer Daten:** `{{APPLICATION_LEVEL_ENCRYPTION_IF_ANY}}`  
**Schlüsselmanagement:** `{{KEY_MANAGEMENT}}`

Nicht vorhandene Verschlüsselungsmaßnahmen dürfen nicht als vorhanden dargestellt werden. Wo keine Verschlüsselung auf Anwendungsebene eingesetzt wird, sind kompensierende Maßnahmen wie strikte Zugriffskontrolle und Infrastrukturschutz zu dokumentieren.

## 9. Protokollierung und Nachvollziehbarkeit

**Tatsächlich umgesetzte Protokollierung:** `{{LOGGING_AND_AUDIT_MEASURES}}`

Zu prüfen sind insbesondere:

- Protokollierung sicherheitsrelevanter administrativer Vorgänge;
- angemessene Auditierbarkeit kritischer Änderungen;
- Beschränkung des Zugriffs auf Logs;
- Schutz der Logs gegen unberechtigte Änderung;
- definierte Aufbewahrungsfristen;
- Datenminimierung in Logs, insbesondere Vermeidung unnötiger sensibler Inhalte.

**Log-Aufbewahrungsfristen:** `{{LOG_RETENTION_PERIODS}}`

## 10. Eingabe-, Änderungs- und Löschkontrolle

**Tatsächlich umgesetzte Maßnahmen:** `{{DATA_CHANGE_AND_DELETION_CONTROLS}}`

Zu prüfen sind insbesondere:

- nachvollziehbare Zuordnung kritischer administrativer Änderungen, soweit erforderlich;
- Funktionen zur Berichtigung und Löschung;
- kontrollierte Löschprozesse für Registrierungen, Dateien und Veranstaltungen;
- Behandlung verwaister oder nicht mehr zugeordneter Dateien;
- Sicherstellung, dass gelöschte Daten nicht unbeabsichtigt weiter regulär bereitgestellt werden.

## 11. Verfügbarkeitskontrolle und Resilienz

**Tatsächlich umgesetzte Maßnahmen:** `{{AVAILABILITY_AND_RESILIENCE_MEASURES}}`

Zu prüfen sind insbesondere:

- Überwachung wesentlicher Dienste;
- Schutz vor Datenverlust;
- angemessene Redundanz, soweit erforderlich;
- Verfahren für Sicherheitsupdates;
- Ressourcen- und Kapazitätsüberwachung;
- Wiederanlauf- und Wiederherstellungsverfahren.

## 12. Backups und Wiederherstellung

**Backup-Verfahren:** `{{BACKUP_PROCESS}}`  
**Backup-Intervall:** `{{BACKUP_FREQUENCY}}`  
**Maximale Backup-Aufbewahrung:** `{{BACKUP_RETENTION_PERIOD}}`  
**Backup-Speicherort:** `{{BACKUP_LOCATION_EEA}}`  
**Backup-Verschlüsselung:** `{{BACKUP_ENCRYPTION}}`  
**Wiederherstellungstests:** `{{RESTORE_TEST_PROCESS_AND_FREQUENCY}}`

Backups müssen mit der im AVV vereinbarten EWR-Beschränkung vereinbar sein.

## 13. Schwachstellen-, Patch- und Änderungsmanagement

**Tatsächlich umgesetzte Maßnahmen:** `{{VULNERABILITY_PATCH_CHANGE_MANAGEMENT}}`

Zu prüfen sind insbesondere:

- zeitnahe Sicherheitsupdates für Betriebssystem, Laufzeitumgebung und Abhängigkeiten;
- Verfahren für kritische Sicherheitslücken;
- Dependency-/Supply-Chain-Prüfungen, soweit angemessen;
- Review sicherheitsrelevanter Änderungen;
- sichere Verwaltung von Secrets und Konfigurationen;
- getrennte bzw. kontrollierte Entwicklungs-, Test- und Produktionsprozesse, soweit erforderlich.

## 14. Anwendungssicherheit

**Tatsächlich umgesetzte Maßnahmen:** `{{APPLICATION_SECURITY_MEASURES}}`

Zu prüfen sind insbesondere:

- Eingabevalidierung;
- Schutz gegen typische Webangriffe;
- CSRF-Schutz, soweit erforderlich;
- sichere Cookie- und Session-Einstellungen;
- Schutz von Datei-Uploads;
- Autorisierungs- und Zugriffstests;
- Rate Limits bzw. Missbrauchsschutz, soweit risikoadäquat;
- sichere Fehlerbehandlung ohne unnötige Offenlegung interner Informationen.

## 15. Datenschutzfreundliche Voreinstellungen und Datenminimierung

**Tatsächlich umgesetzte Maßnahmen:** `{{PRIVACY_BY_DEFAULT_MEASURES}}`

Zu prüfen sind insbesondere:

- nur notwendige Standardfelder;
- konfigurierbare Datenerhebung durch den Verantwortlichen;
- Begrenzung von Standardzugriffen;
- Lösch- und Aufbewahrungsmöglichkeiten;
- keine unnötige Verwendung personenbezogener Daten in Logs, Tests oder Telemetrie.

## 16. Test- und Entwicklungsdaten

**Regelung:** `{{TEST_DATA_POLICY}}`

Zu prüfen sind insbesondere:

- möglichst keine echten produktiven personenbezogenen Daten in Entwicklungs- oder Testsystemen;
- falls ausnahmsweise erforderlich: dokumentierter Zweck und gleichwertige Schutzmaßnahmen;
- Anonymisierung oder Pseudonymisierung, soweit möglich;
- keine Übertragung in nicht freigegebene externe Dienste.

## 17. Incident Response

**Verfahren für Sicherheits- und Datenschutzvorfälle:** `{{INCIDENT_RESPONSE_PROCESS}}`  
**Interner Meldeweg:** `{{INCIDENT_CONTACT}}`

Zu prüfen sind insbesondere:

- Erkennung und Bewertung von Vorfällen;
- Eindämmung und Behebung;
- Sicherung relevanter Informationen;
- unverzügliche Information betroffener Verantwortlicher;
- strukturierte Bereitstellung der für Art. 33/34 DSGVO erforderlichen Informationen;
- Nachbereitung und Verbesserungsmaßnahmen.

## 18. Vertraulichkeit und Personal

**Tatsächlich umgesetzte Maßnahmen:** `{{STAFF_CONFIDENTIALITY_AND_TRAINING}}`

Zu prüfen sind insbesondere:

- Verpflichtung zur Vertraulichkeit;
- Zugriff nur bei betrieblicher Notwendigkeit;
- Datenschutz-/Sicherheitsunterweisung;
- geordneter Entzug von Zugängen beim Ausscheiden oder Rollenwechsel.

## 19. Unterauftragsverarbeiter und Lieferkette

**Tatsächlich umgesetzte Maßnahmen:** `{{SUPPLIER_SECURITY_MANAGEMENT}}`

Zu prüfen sind insbesondere:

- AVV bzw. geeignete vertragliche Verpflichtungen mit Unterauftragsverarbeitern;
- Prüfung der zugesicherten TOM;
- Prüfung von Verarbeitungsorten und Unterauftragnehmerketten;
- ausschließliche Verarbeitung im EWR für die von diesem AVV erfassten Daten;
- dokumentierte aktuelle Unterauftragsverarbeiterliste.

## 20. Regelmäßige Überprüfung

Die TOM werden mindestens `{{TOM_REVIEW_FREQUENCY}}` sowie zusätzlich bei wesentlichen technischen, organisatorischen oder risikobezogenen Änderungen überprüft.

**Verantwortliche Rolle:** `{{TOM_REVIEW_OWNER}}`  
**Letzte Überprüfung:** `{{LAST_TOM_REVIEW_DATE}}`  
**Nächste planmäßige Überprüfung:** `{{NEXT_TOM_REVIEW_DATE}}`
