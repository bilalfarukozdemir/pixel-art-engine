import type { Painter } from '../core/painter.js';
import { alpha, type ColorInput } from '../core/color.js';

export interface MasonryPalette {
  face: ColorInput; light: ColorInput; joint: ColorInput; recess: ColorInput; wood: ColorInput;
}
export const WARM_STONE: Readonly<MasonryPalette> = Object.freeze({
  face: '#a5a396', light: '#d1cbb6', joint: '#777d7c', recess: '#29303e', wood: '#805337',
});
function box(w: number, h: number, minW: number, minH: number): void {
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < minW || h < minH) {
    throw new RangeError(`Expected integer dimensions >= ${minW}x${minH}`);
  }
}

/** Paint inside the supplied box; top-left light, no outline or RNG side effects. */
export function stoneCourses(p: Painter, x: number, y: number, w: number, h: number,
  palette: MasonryPalette = WARM_STONE, course = 7, block = 11): void {
  box(w, h, 1, 1); box(block, course, 3, 3);
  p.rect(x, y, w, h, palette.face);
  for (let row = 0, by = y; by < y + h; row++, by += course) {
    p.hline(x, by, w, palette.joint);
    const rowHeight = Math.min(course, y + h - by);
    for (let bx = x - (row % 2 ? Math.floor(block / 2) : 0); bx < x + w; bx += block) {
      if (bx >= x) p.vline(bx, by, rowHeight, palette.joint);
      const left = Math.max(x, bx + 1), right = Math.min(x + w, bx + block - 1);
      if (rowHeight > 2 && right > left) p.hline(left, by + 1, right - left, alpha(palette.light, 100));
    }
  }
}

/** Pointed recess within box. Minimum 5x8; dimensions include the stone surround. */
export function lancetWindow(p: Painter, x: number, y: number, w: number, h: number,
  palette: MasonryPalette = WARM_STONE, glow: ColorInput = '#edc47d'): void {
  box(w, h, 5, 8);
  const mid = x + Math.floor(w / 2), tip = Math.max(2, Math.floor(w / 3));
  p.poly([[x,y+tip],[mid,y],[x+w-1,y+tip],[x+w-1,y+h-1],[x,y+h-1]],palette.light);
  p.poly([[x+1,y+tip+1],[mid,y+2],[x+w-2,y+tip+1],[x+w-2,y+h-2],[x+1,y+h-2]],palette.recess);
  p.vline(mid, y+tip+2, Math.max(1,h-tip-4),glow);
  p.hline(x,y+h-1,w,palette.joint);
}

/** Rounded door with an inset timber leaf; no level rules are embedded here. */
export function archedDoor(p: Painter, x: number, y: number, w: number, h: number,
  palette: MasonryPalette = WARM_STONE, iron = false): void {
  box(w,h,11,16);
  if(h < Math.floor((w-1)/2)+4) throw new RangeError('Door height must fit its arch plus 4 pixels');
  const inset = 2, radius = Math.floor((w-1)/2), center = x + radius;
  const archY = y + radius;
  p.ellipse(center,archY,radius,radius,palette.light);
  p.rect(x,archY,w,h-radius,palette.light);
  p.ellipse(center,archY,radius-inset,radius-inset,palette.recess);
  p.rect(x+inset,archY,w-inset*2,h-radius-1,palette.recess);
  const top = archY+1, left = x+inset+1, innerW = w-2*inset-2;
  p.rect(left,top,innerW,h-radius-2,palette.wood);
  for(let bx=left;bx<left+innerW;bx+=3) p.vline(bx,top,h-radius-2,alpha(palette.light,70));
  if(iron) for(const offset of [.35,.75]) {
    const by=top+Math.floor((h-radius-2)*offset);
    p.hline(left,by,innerW,palette.recess); p.px(left+1,by,palette.light); p.px(left+innerW-2,by,palette.light);
  }
  p.px(center+2,y+h-5,palette.light);
  p.hline(x,y+h-1,w,palette.joint);
}

/** Draw before the object. In a live game bake once to an atlas, don't redraw geometry. */
export function contactShadow(p: Painter, cx: number, groundY: number, w: number, h: number,
  color: ColorInput = '#453b2b', opacity = 60): void {
  box(w,h,2,2);
  if(!Number.isFinite(opacity)||opacity<0||opacity>255) throw new RangeError('Opacity must be 0..255');
  p.ellipse(cx,groundY,(w-1)/2,(h-1)/2,alpha(color,opacity));
}
