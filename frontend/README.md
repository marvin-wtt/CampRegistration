# Youth Camp Management Application

A web service that allows users to register for a youth camp and counselors to manage the camp.

## Features

### Custom registration form

The registration form is fully customizable based on the information needed for the camp.

### Dashboard

### Participants view

### Table Cells

### Program Planner

The program planner is a calendar what allows managers to schedule all activities for the camp.

### Send Emails

### Tools

The tools page provides some useful tools to fill forms for the FGYO or other organisations.

## Dynamic Form Editor

The registration form can be modified to fit each individual camp.

### Fields

The name for a field (not the title) must be a unique name. Multiple words can be separated for improved readability.
The name should be only lowercase letters.

The editor provides some special fields

#### Options

Many features and internal functionality rely on registration data.
In order to allow customizable fields while still providing the required data to all functions, you can set the
information type for each field.
The value can be set by the specified field types or by an expression.

| Type          | Value           | Field                        |     Required      | Alternative     | Description                                                                               |
| ------------- | --------------- | ---------------------------- | :---------------: | --------------- | ----------------------------------------------------------------------------------------- |
| Address       | addressQuestion | addressQuestion              |        Yes        | countryQuestion | The countryQuestion of the person                                                         |
| Country       | countryQuestion | dropdown                     | If international  | addressQuestion | The countryQuestion of the person                                                         |
| Date of Birth | date_of_birth   | date_of_birth \| text + date | If age restricted |                 | The date of birth of the person                                                           |
| E-mail        | email           | text + email                 |        Yes        |                 | The primary email of the person                                                           |
| First Name    | first_name      | text                         |        Yes        |                 | The persons first name                                                                    |
| Last Name     | last_name       | text                         |        Yes        |                 | The persons family name                                                                   |
| Waiting List  | waiting_list    | boolean \| agreement         |        Yes        |                 | The user confirms that the camp is full and the registration is added to the waiting list |
| Role          | role            | dropdown \| role             |        No         |                 | The role of the person. The default is participant.                                       |

#### Variables

Camp data can be accessed in the title, description or in expressions of each element.
If the element contains translations, the translation for the current user locale is returned.

| Name              | Translated | Description                                           |
| ----------------- | :--------: | ----------------------------------------------------- |
| camp.name         |            | Name of the camp                                      |
| camp.organization |     X      | Name of the organization                              |
| camp.startAt      |            | Timestamp of the camp start in UTC format             |
| camp.startAtDate  |            | Date of the camp start formatted based on user locale |
| camp.startAtTime  |            | Time of the camp start formatted based on user locale |
| camp.endAt        |            | Timestamp of the camp end in UTC format               |
| camp.endAtDate    |            | Date of the camp end formatted based on user locale   |
| camp.endAtTime    |            | Time of the camp end formatted based on user locale   |
| camp.minAge       |            | Minimum age to participate                            |
| camp.maxAge       |            | Maximum age to participate                            |
| camp.location     |     X      | Camp location                                         |
| camp.price        |     X      | Camp price                                            |

Example:

```text
{camp.title}
```

More information about variables can be
found [here](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic).

### Functions

Functions can also be used in expression fields.

| Name                  | Parameter                   | Return  | Description                                         |
| --------------------- | --------------------------- | ------- | --------------------------------------------------- |
| isMinor               | dateOfBirthQuestion: string | boolean | Wherever the age is less than 18 at camp start      |
| isAdult               | dateOfBirthQuestion: string | boolean | Wherever the age above 18 at camp start             |
| subtractYearsFromDate | date: string, years: number | Date    | Subtracts years from a given date                   |
| htmlDate              | date: string                | string  | Formats a date to the html date format (YYYY-MM-DD) |

## Configuration

## Development

### Build the app for production

```bash
quasar build
```

### Contribution