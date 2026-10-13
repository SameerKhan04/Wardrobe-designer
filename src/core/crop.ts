/** Centre square of a photo: the area the on-screen framing guide shows. */
export function centerSquare(width: number, height: number) {
  const size = Math.min(width, height);
  return {
    originX: Math.round((width - size) / 2),
    originY: Math.round((height - size) / 2),
    width: size,
    height: size,
  };
}
