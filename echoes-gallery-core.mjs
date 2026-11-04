export const CARD_WIDTH = 320;
export const CARD_HEIGHT = 240;
export const STEP_X = 338;
export const STEP_Y = 258;

export function positiveModulo(value, period) {
  return ((value % period) + period) % period;
}

export function galleryShape(count) {
  const safeCount = Math.max(1, Math.floor(count) || 1);
  const columns = Math.max(1, Math.ceil(Math.sqrt(safeCount * 1.5)));
  return { columns, rows: Math.ceil(safeCount / columns), count: safeCount };
}

// Virtual cells change their content exactly when their physical neighbour takes
// their place. The visible pool stays bounded even for a very large collection.
export function galleryCell(column, row, panX, panY, shape) {
  const crossedX = Math.floor(panX / STEP_X);
  const crossedY = Math.floor(panY / STEP_Y);
  const dataColumn = positiveModulo(column - crossedX, shape.columns);
  const dataRow = positiveModulo(row - crossedY, shape.rows);
  return {
    x: column * STEP_X + panX - crossedX * STEP_X,
    y: row * STEP_Y + panY - crossedY * STEP_Y,
    index: positiveModulo(dataRow * shape.columns + dataColumn, shape.count),
  };
}

export function spherePoint(x, y, radius = 3600) {
  const ax = x / radius;
  const ay = y / radius;
  const px = radius * Math.sin(ax) * Math.cos(ay);
  const py = radius * Math.sin(ay);
  const pz = radius * (Math.cos(ax) * Math.cos(ay) - 1);
  return { x: px, y: py, z: pz, nx: px / radius, ny: py / radius, nz: (pz + radius) / radius };
}

export function springStep(position, velocity, target, delta, stiffness = 105, damping = 19) {
  const dt = Math.max(0, Math.min(delta, 1 / 30));
  const nextVelocity = velocity + ((target - position) * stiffness - velocity * damping) * dt;
  return { position: position + nextVelocity * dt, velocity: nextVelocity };
}

export function nearestCardPan(index, shape, currentX, currentY) {
  const rawX = -(index % shape.columns) * STEP_X;
  const rawY = -Math.floor(index / shape.columns) * STEP_Y;
  const periodX = shape.columns * STEP_X;
  const periodY = shape.rows * STEP_Y;
  return {
    x: rawX + Math.round((currentX - rawX) / periodX) * periodX,
    y: rawY + Math.round((currentY - rawY) / periodY) * periodY,
  };
}

export function movedBeyondClick(startX, startY, x, y, threshold = 7) {
  return Math.hypot(x - startX, y - startY) > threshold;
}
