# Release Notes — Trip Planner 2.4

![Trip Planner logo](../icons/icon48.png)

Plan trips faster with **offline maps**, *shared itineraries* and a brand-new `export` command.
This release focuses on speed: route calculation is now up to **3× faster**.

> **Tip:** Press `Ctrl + K` anywhere to open the command palette.

## What's new

| Feature | Status | Notes |
|---|---|---|
| Offline maps | ✅ Done | Download any region up to 2 GB |
| Shared itineraries | ✅ Done | Invite friends by link |
| Calendar sync | 🚧 Beta | Google and Outlook |
| Budget tracker | 🗓️ Planned | Coming in 2.5 |

## Quick start

```python
from trip_planner import Trip

trip = Trip("Lisbon weekend", days=3)
trip.add_stop("Belém Tower", duration_hours=2)
trip.add_stop("Alfama walk", duration_hours=3)

for day in trip.schedule():
    print(f"Day {day.number}: {', '.join(day.stops)}")
```

## Export your plan

```bash
trip-planner export "Lisbon weekend" --format pdf --out ~/Desktop
```

```json
{
  "trip": "Lisbon weekend",
  "days": 3,
  "stops": ["Belém Tower", "Alfama walk"],
  "shared": true
}
```

## Upgrade checklist

- [x] Back up your saved trips
- [x] Install version 2.4
- [ ] Download offline maps for your next trip
- [ ] Invite your travel buddies

## Known issues

1. Map tiles may load slowly on the first launch.
2. Calendar sync skips events without a location.
3. Very long trip names are cut off in the PDF header.

### Reporting a bug

Open an issue with the steps to reproduce, your app version, and a screenshot.
See the [contributing guide](https://example.com/contributing) for details.

---

*Thanks to everyone who tested the beta!*
