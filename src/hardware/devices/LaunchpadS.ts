import {KeyType} from "../types/devices";
import type {DeviceKeyID, GridDeviceConfig } from "../types/devices";

const config: GridDeviceConfig = {
    name: "Launchpad S",
    midiNameRegex: "^Launchpad S.*$",

    paletteChannel: {
      "classic": 1
    },

    keymap: [
      [[KeyType.CC, 104], [KeyType.CC, 105], [KeyType.CC, 106], [KeyType.CC, 107], [KeyType.CC, 108], [KeyType.CC, 109], [KeyType.CC, 110], [KeyType.CC, 111], NaN],
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [16, 17, 18, 19, 20, 21, 22, 23, 24],
      [32, 33, 34, 35, 36, 37, 38, 39, 40],
      [48, 49, 50, 51, 52, 53, 54, 55, 56],
      [64, 65, 66, 67, 68, 69, 70, 71, 72],
      [80, 81, 82, 83, 84, 85, 86, 87, 88],
      [96, 97, 98, 99, 100, 101, 102, 103, 104],
      [112, 113, 114, 115, 116, 117, 118, 119, 120]],

    dimension: [9, 9],
    gridDimension: [8, 8],
    gridOffset: [0, 1],
    layerKey: [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7]],

    noteToXY(note)
    {
      if(note >= 0 && note <= 120 && note % 16 <= 8)
      {
        return [note % 16, Math.floor(note / 16)];
      }

      return [NaN, NaN];
    },
}

export default config;
