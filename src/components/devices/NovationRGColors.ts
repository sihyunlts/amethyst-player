import { Color, ColorType } from "../../types/color";
import classicRGPalette from "../../types/palettes/classic-rg";

type RGBTuple = [number, number, number];

export interface LaunchpadSColorResolution {
  displayColor: Color;
  hardwarePaletteIndex: number;
}

const classicRGStepLookup = new Map<string, number>();

for (const [index, step] of classicRGPalette.entries()) {
  const stepKey = step.join(",");
  if (!classicRGStepLookup.has(stepKey)) {
    classicRGStepLookup.set(stepKey, index);
  }
}

export const classicRGSteps: RGBTuple[] = Array.from(classicRGStepLookup.keys()).map(
  (stepKey) => stepKey.split(",").map(Number) as RGBTuple,
);

function cloneRgb([r, g, b]: RGBTuple): RGBTuple {
  return [r, g, b];
}

function getClosestClassicRGStep(rgb: RGBTuple): RGBTuple {
  let closest = classicRGSteps[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of classicRGSteps) {
    const redDistance = rgb[0] - candidate[0];
    const greenDistance = rgb[1] - candidate[1];
    const blueDistance = rgb[2] - candidate[2];
    const distance = redDistance ** 2 + greenDistance ** 2 + blueDistance ** 2;

    if (distance < bestDistance) {
      bestDistance = distance;
      closest = candidate;
    }
  }

  return cloneRgb(closest);
}

export function resolveLaunchpadSColor(color: Color): LaunchpadSColorResolution {
  if (color.type === ColorType.Palette && color.palette() === "classic") {
    const paletteIndex = color.index();

    if (paletteIndex !== undefined && classicRGPalette[paletteIndex]) {
      return {
        displayColor: new Color(ColorType.RGB, cloneRgb(classicRGPalette[paletteIndex])),
        hardwarePaletteIndex: paletteIndex,
      };
    }
  }

  const closestStep = getClosestClassicRGStep(color.rgb());
  const hardwarePaletteIndex = classicRGStepLookup.get(closestStep.join(",")) ?? 0;

  return {
    displayColor: new Color(ColorType.RGB, closestStep),
    hardwarePaletteIndex,
  };
}
