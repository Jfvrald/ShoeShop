/* Fulfillment model. An order can hold pairs from several sellers, so every
   seller gets its own shipment with its own timeline, courier and tracking. */
export const STAGES = ["Placed", "Packed", "Shipped", "Out for delivery", "Delivered"];
export const COURIERS = ["LBC Express", "J&T Express", "Flash Express", "Grab Express"];

const HOUR = 3600000;
// Hours after checkout by which each stage should be reached (the seller's SLA).
export const SLA_HOURS = { Packed: 24, Shipped: 48, "Out for delivery": 72, Delivered: 96 };

export const ownerKey = (ownerId) => ownerId || "house";

export const trackingNumber = (seed) => {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return "SR" + String(h >>> 0).padStart(10, "0").slice(0, 10);
};

export function newShipments(items, placedAt) {
  const shipments = {};
  items.forEach((item) => {
    const key = ownerKey(item.ownerId);
    shipments[key] ||= {
      key,
      seller: item.seller,
      status: "Placed",
      events: [{ status: "Placed", at: new Date(placedAt).toISOString() }],
      courier: null,
      tracking: null,
      eta: new Date(+new Date(placedAt) + SLA_HOURS.Delivered * HOUR).toISOString(),
    };
  });
  return shipments;
}

export const nextStage = (status) => STAGES[STAGES.indexOf(status) + 1] || null;

export function advanceShipment(shipment, orderId, at = new Date()) {
  const status = nextStage(shipment.status);
  if (!status) return shipment;
  const next = {
    ...shipment,
    status,
    events: [...shipment.events, { status, at: new Date(at).toISOString() }],
  };
  if (status === "Shipped") {
    next.courier = COURIERS[(orderId.length + shipment.key.length) % COURIERS.length];
    next.tracking = trackingNumber(orderId + shipment.key);
  }
  return next;
}

/* Walk a shipment forward to a stage at (roughly) its SLA times plus a delay.
   Used to seed believable history. */
export function shipmentAt(shipment, orderId, placedAt, stageIndex, delayHours = 0) {
  let next = shipment;
  for (let i = 1; i <= stageIndex; i += 1) {
    const stage = STAGES[i];
    const at = +new Date(placedAt) + (SLA_HOURS[stage] * (i / (i + 0.6)) + delayHours * (i > 1 ? 1 : 0)) * HOUR;
    next = advanceShipment(next, orderId, at);
  }
  return next;
}

export const stageTime = (shipment, status) =>
  shipment.events.find((event) => event.status === status)?.at || null;

/* Hours past the SLA for the stage this shipment is waiting on (0 if on time). */
export function overdueHours(shipment, placedAt, now = Date.now()) {
  const waitingFor = nextStage(shipment.status);
  if (!waitingFor) return 0;
  const target = +new Date(placedAt) + SLA_HOURS[waitingFor] * HOUR;
  return Math.max(0, Math.round((+now - target) / HOUR));
}

export const stageIndex = (status) => STAGES.indexOf(status);
