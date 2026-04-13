<svelte:options accessors/>
<script lang="ts">
    import type {KeyID, DeviceInfo} from "../../types/devices";
    import type {KeyPress, KeyRelease} from "../../engine/CanvasAPI"
    import { ColorType, Color } from "../../types/color"
    import { resolveLaunchpadSColor } from "./NovationRGColors";
    
    import Keypad from "../keypad.svelte";

    let keyPads: any[] = [];
    export let keyPress: KeyPress;
    export let keyRelease: KeyRelease;
    export let id: number;
    export let pos: [number, number];
    $: pos;

    export let deviceInfo: DeviceInfo = 
    {
        dimension: [9, 9],
        grid_dimension: [8, 8],
        grid_offset: [0, 1],
        layer_key: [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7]]
    }

    /** Get the clip path for the middle pads. */
    function getCornerRadius (x: number, y: number) {
        switch (x + y * 10) {
            case 53:
                return "polygon(81% -1%, 101% 19%, 101% 101%, -1% 101%, -1% -1%)";

            case 54:
                return "polygon(19% -1%, 101% -1%, 101% 101%, -1% 101%, -1% 19%)";

            case 43:
                return "polygon(101% -1%, 101% 81%, 81% 101%, -1% 101%, -1% -1%)";

            case 44:
                return "polygon(101% -1%, 101% 101%, 19% 101%, -1% 81%, -1% -1%)";

            default:
                return "unset";
        }
    }

    type KeypadPosition = [number, number];

    function isKeypadArray(keyID: KeyID): keyID is Exclude<KeyID, number> {
        return Array.isArray(keyID);
    }

    function resolveKeypadPosition(keyID: Exclude<KeyID, number>): KeypadPosition {
        if (keyID[0] === 'c') {
            return deviceInfo.layer_key[keyID[1]] as KeypadPosition;
        }

        return keyID as KeypadPosition;
    }

    function getKeypadIndex(keyID: KeyID): number {
        if(isKeypadArray(keyID))
        {
            const position = resolveKeypadPosition(keyID);
            return position[1] * 10 + position[0];
        }
        else
        {
            return keyID;
        }
    }

    export function setColor(keyID: KeyID, color: Color) {
        if(isKeypadArray(keyID))
        {
            const position = resolveKeypadPosition(keyID);
            keyID = [
                position[0] + deviceInfo.grid_offset[0],
                position[1] + deviceInfo.grid_offset[1]
            ];
        }
        let index = getKeypadIndex(keyID)
        if(keyPads[index]) {
            const { displayColor } = resolveLaunchpadSColor(color);
            var screen_color = displayColor.overlay(new Color(ColorType.RGB, [0x80, 0x80, 0x80]));
            keyPads[index].set_color(screen_color);           
        }
    }
</script>

<div class="lp-border">
    <div class="lp-controls">
        {#each Array(9) as _, y}
            <div class="lp-controls-row">
                {#each Array(9) as _2, x}
                    {#if x + 1 > 0 && y + 1 > 0}
                        <div class="lp-btn-parent">
                            {#if (x >= 0 && x < 8) && (y > 0 && y < 9)}
                            <Keypad class="lp-normal-btn" style="clip-path: {getCornerRadius(x, y)};" deviceID={id} id={[x - deviceInfo.grid_offset[0], y - deviceInfo.grid_offset[1]]} bind:this={keyPads[getKeypadIndex([x,y])]} keyPress={keyPress} keyRelease={keyRelease}/> 
                            {:else if (y == 0 && x < 8) || (x == 8 && y > 0)}
                            <Keypad class="lp-side-btn" deviceID={id} id={[x - deviceInfo.grid_offset[0], y - deviceInfo.grid_offset[1]]} bind:this={keyPads[getKeypadIndex([x,y])]} keyPress={keyPress} keyRelease={keyRelease}/> 
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    .lp-border {
        background: var(--device-body);
        border: 2px solid var(--device-border);
        border-radius: 4.5%;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.15);

        position: relative;

        width: 100%;
        aspect-ratio: 1/1;
    }

    .lp-controls {
        height: 100%;
        width: 100%;

        display: flex;
        gap: 1%;
        flex-direction: column;

        padding: 4%;

        .lp-controls-row {
            height: 100%;
            display: flex;
            gap: 1%;
        }

        .lp-btn-parent {
            height: 100%;
            width: 100%;

            display: flex;
            justify-content: center;
            align-items: center;

            :global(.lp-side-btn) {
                height: 66%;
                width: 66%;
                border-radius: 50%;
                background-color: var(--device-button);
            }

            :global(.lp-normal-btn) {
                padding: 0;
                border: none;

                height: 92%;
                width: 92%;
                border-radius: 8%;
                background-color: var(--device-button);
            }
        }
    }
</style>
