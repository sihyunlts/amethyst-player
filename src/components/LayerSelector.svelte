<script lang="ts">
    import {ChevronLeft, ChevronRight} from "carbon-icons-svelte";
    import { onMount, onDestroy } from "svelte";

    export let project:ProjectRT;
    
    let currentLayer: number = 0;
    let layerCount: number = 0;


    function selectLayer(index: number) {
        project.LayerChange(index)
    }

    function selectOffsetLayer(offset: -1 | 1): void {
        var newLayer = currentLayer;
        if(offset == -1) {
            if (newLayer - 1 >= 0) {
                newLayer -= 1
            }
        }
        else {
            if (newLayer + 1 < layerCount) {
                newLayer += 1
            }
        }

        project.LayerChange(newLayer)
    }

    var refreshInterval = setInterval(() => {
            currentLayer = project.currentLayer;
        }, 10)

    onMount(() => {
        layerCount = project.projectInfo.layer;
        currentLayer = project.currentLayer;
    })
    
    onDestroy(() => {
        clearInterval(refreshInterval)
    })
</script>

<div class="layer-selector-container">
    <div class="layer-control" on:click={() => selectOffsetLayer(-1)}>
        <ChevronLeft size={24}/>
    </div>

    <div class="layers-container">
        {#each Array(layerCount) as _, layer}
            <div class="layer" on:click={() => currentLayer === selectLayer(layer)} class:selected={currentLayer === layer}>
                    <span>{layer + 1}</span>
            </div>
        {/each}
    </div>

    <div class="layer-control" on:click={() => selectOffsetLayer(1)}>
        <ChevronRight size={24} />
    </div>
</div>

<style lang="scss">
    .layer-selector-container {
        width: 100%;
        max-width: 100%;
        
        display: flex;
        justify-content: center;
        align-items: center;
        gap: min(1em, 8px);
        // filter: drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.25));

        .layer-control {
            min-width: 36px;
            width: 36px;
            height: 36px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            cursor: pointer;
            flex-shrink: 0;

            transition: background-color 0.2s ease;
            background-color: var(--bg3);
            border: 2px solid var(--bg4);

            color: var(--text1);

            &:hover {
                background-color: var(--bg1);

                color: var(--text1);
            }

            &:active  {
                background-color: var(--bg1);
                scale: 0.95;
            }
        }

        .layers-container {
            min-width: 0;
            flex: 1;
            max-width: min(calc(60px * 6 + 0.35em * 5), calc(100% - 72px - 16px));
            display: flex;
            justify-content: center;
            gap: 0.5em;

            overflow: hidden;

            .layer {
                min-width: 30px;
                width: 40px;
                height: 40px;

                background-color: var(--bg3);
                border: 2px solid var(--bg4);
                cursor: pointer;

                border-radius: 5px;

                display: flex;
                justify-content: center;
                align-items: center;

                flex-shrink: 1;
                
                transition: background-color 0.2s ease, width 0.2s ease;

                span {
                    color: var(--text2);
                    font-family: Inter, sans-serif;
                    font-weight: 500;
                }

                &:hover {
                    background-color: var(--bg1);
                    width: min(50px, 100%);
                }

                &.selected {
                    background-color: var(--selected);
                    width: min(80px, 100%);
                    span {
                        color: var(--text1);
                        font-family: Inter, sans-serif;
                        font-weight: 500;
                    }
                }   
            }
        }
    }
</style>