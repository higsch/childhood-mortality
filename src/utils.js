export function getCentralAngle(x, y, width, height) {
  const pi = Math.PI;
  const pi2 = pi * 2;

  const corrX = x - width / 2;
  const corrY = height / 2 - y;

  let angle = corrY > 0 ? Math.atan(corrX / corrY) : Math.atan(corrY / corrX);

  if (corrY <= 0 && corrX > 0) angle = -angle + pi / 2;
  if (corrY <= 0 && corrX <= 0) angle = 1.5 * pi - angle;
  if (corrY > 0 && corrX <= 0) angle = angle + pi2;
  
  return angle;
}
