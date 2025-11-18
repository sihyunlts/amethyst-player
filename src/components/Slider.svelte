<script>
    import {browser} from "$app/environment";
    import { createEventDispatcher } from 'svelte';

    let sliderBody;
    let slider;

    export let value;
    export let max;
    export let min;

    let dispatch = createEventDispatcher();
</script>

<!--<div class="slider-body {$$props.class}" style={$$props.style} on:click={clickSlider} on:mousemove={mouseMove} bind:this={sliderBody}>
    <div class="slider-rail" bind:this={sliderRail}>

    </div>

    <div class="slider-thumb" bind:this={sliderThumb}></div>
</div>-->

<div class="slider-body {$$props.class}" style={$$props.style} bind:this={sliderBody}>
    <input 
        type="range" 
        class="slider" 
        on:input={e => {value = e.target.value; dispatch("change", e.target.value)}}
        on:change={e => {value = e.target.value; dispatch("change", e.target.value)}} 
        bind:this={slider} 
        min={min} 
        max={max} 
        value={value}
        style="background: linear-gradient(to right, var(--text1) 0%, var(--text1) {((value - min) / (max - min)) * 100}%, gray {((value - min) / (max - min)) * 100}%, gray 100%);"
    >
</div>

<style lang="scss">


    .slider-body {
        width: 100%;
        padding: 0 10px;

        height: 20px;
        display: flex;
        align-items: center;

        .slider {
            -webkit-appearance: none;  /* Override default CSS styles */
            appearance: none;

            width: 100%;
            height: 4px;
            border-radius: 10px;

            &::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background-color: var(--text1);
                box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
                cursor: pointer;
                    
                transition: transform 0.2s ease, box-shadow 0.2s ease;

                &:hover {
                    transform: scale(1.2);
                    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
                }

                &:active {
                    transform: scale(1.1);
                }
            }

            &::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background-color: var(--text1);
                box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
                cursor: pointer;
                border: none;

                &:hover {
                    transform: scale(1.2);
                    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
                }

                &:active {
                    transform: scale(1.1);
                }
            }
        }

        /*.slider-rail {
            height: 4px;
            background-color: gray;
            border-radius: 2px;

            width: 100%;
        }

        .slider-thumb {
            width: 10px;
            height: 18px;
            border-radius: 5px;

            background-color: white;

            cursor: grab;

            position: absolute;
        }*/
    }
</style>

