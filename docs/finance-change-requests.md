# Finance Change Requests

This document can should be deleted once implemented or rejected.
Update [finances](finances.md) for documentation of the final decision.

## Bugs

- [x] Categories usage does not update. After changing the category of an expense, the category dialog usage dies not update.
- [x] Please verify: Does changing an expense after a payout was created change the payout receipt print?
      Verified: yes — slips were rebuilt from live data. Fixed: see [frozen statements](finances.md#frozen-statements).
- [x] Shouldn't the payout receipt highlight the amount that should be payed out instead of the balance? If the balance is shown at all, it should probably rather be a separate note.

## Feature Requests

- [x] Add optional recipient field to the expense. The recipient can be a vendor or similar.
- [ ] (on hold) Allow for automatic digital receipt scanning when information is present. (Amount, Date, Vendor, Category, etc.)
- [x] The dashboard should show an attention item in the wrap-up phase when there are expenses without a date.
- [x] Should pay out and paid back really be two separate fields or can we just add both up in the balance tab?
- [x] Should an expense show a details dialog instead of the edit dialog? Not sure.
- [x] Do now show two options for deleting a signature and signing it again. Instead, show a single option to delete the signature and then allow signing again.
