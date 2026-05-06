export const SPAWN_SLOT_GROUPS = [
  {
    group: "A",
    slots: ["A1", "A2", "A3", "A4", "A5"]
  },
  {
    group: "B",
    slots: ["B1", "B2", "B3", "B4", "B5"]
  }
];

export const SPAWN_SLOT_ORDER = SPAWN_SLOT_GROUPS.flatMap((group) => group.slots);

export function isValidSpawnSlot(slot) {
  return SPAWN_SLOT_ORDER.includes(slot);
}

export function getDefaultSpawnSlot(index = 0) {
  return SPAWN_SLOT_ORDER[index] ?? null;
}

export function getSpawnSlotLabel(slot) {
  return slot ? `스폰 ${slot}` : "미지정";
}
