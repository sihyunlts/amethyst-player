<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { browser } from '$app/environment';
    import type { PublicProject } from '../lib/supabase';
    import Search from "carbon-icons-svelte/lib/Search.svelte";
    import Download from "carbon-icons-svelte/lib/Download.svelte";
    import Close from "carbon-icons-svelte/lib/Close.svelte";
    import Video from "carbon-icons-svelte/lib/Video.svelte";
    import { t } from '$lib/translations';
    // Note: Play icon and downloadedProjectsService imports removed since caching is disabled

    let ProjectStoreService: any = null;

    export let show: boolean = false;

    const dispatch = createEventDispatcher();
    let projectStore: any = null;

    let projects: PublicProject[] = [];
    let filteredProjects: PublicProject[] = [];
    let searchQuery = '';
    let loading = true;
    let error = '';
    let sortBy = 'latest'; // 'latest' or 'downloads'
    let downloadingProjects = new Map(); // Track downloading projects with progress

    onMount(async () => {
        if (browser) {
            try {
                const { ProjectStoreService: Service } = await import('../lib/services/projectStore');
                ProjectStoreService = Service;
                projectStore = new ProjectStoreService();
                await loadProjects();
            } catch (err) {
                error = 'Failed to load project store service';
                loading = false;
                console.error('ProjectStore initialization error:', err);
            }
        } else {
            loading = false;
            error = 'Project store is only available in the browser';
        }
    });

    async function loadProjects() {
        if (!projectStore) {
            error = 'Project store service not available';
            loading = false;
            return;
        }

        try {
            loading = true;
            error = '';
            projects = await projectStore.getPublicProjects();
            filteredProjects = projects;
            sortProjects();
        } catch (err) {
            error = err.message || 'Failed to load projects';
            console.error('Error loading projects:', err);
        } finally {
            loading = false;
        }
    }

    async function handleSearch() {
        if (!searchQuery.trim()) {
            filteredProjects = projects;
            sortProjects();
            return;
        }

        if (!projectStore) {
            // Fallback to client-side search
            filteredProjects = projects.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
            sortProjects();
            return;
        }

        try {
            filteredProjects = await projectStore.searchProjects(searchQuery);
            sortProjects();
        } catch (err) {
            console.error('Search error:', err);
            // Fallback to client-side search
            filteredProjects = projects.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
            sortProjects();
        }
    }

    async function downloadProject(project: PublicProject) {
        if (!projectStore) {
            error = 'Project store service not available';
            return;
        }

        if (downloadingProjects.has(project.id)) {
            return; // Already downloading
        }

        try {
            // Set initial progress
            downloadingProjects.set(project.id, { progress: 0, status: 'starting' });
            downloadingProjects = downloadingProjects; // Trigger reactivity

            const file = await downloadProjectWithProgress(project.id);
            
            // Complete
            downloadingProjects.set(project.id, { progress: 100, status: 'complete' });
            downloadingProjects = downloadingProjects;
            
            // Note: Caching disabled due to storage limitations
            // await downloadedProjectsService.addDownloadedProject(
            //     project.id, 
            //     project.name, 
            //     project.author, 
            //     file
            // );
            
            dispatch('projectSelected', { file, projectInfo: project });
            
            // Clean up after a short delay
            setTimeout(() => {
                downloadingProjects.delete(project.id);
                downloadingProjects = downloadingProjects;
            }, 1000);
            
            show = false;
        } catch (err) {
            downloadingProjects.delete(project.id);
            downloadingProjects = downloadingProjects;
            error = `Failed to download project: ${err.message}`;
        }
    }

    async function downloadProjectWithProgress(projectId: string): Promise<File> {
        // Import supabase dynamically in browser
        const { supabase } = await import('../lib/supabase');
        
        if (!supabase) {
            throw new Error('Supabase is not configured');
        }

        // Get project data
        const { data, error } = await supabase
            .from('public_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error) throw error;
        if (!data) throw new Error('Project not found');

        // Update download count
        try {
            await supabase
                .from('public_projects')
                .update({ download_count: (data.download_count || 0) + 1 })
                .eq('id', projectId);
        } catch (err) {
            console.warn('Could not update download count:', err);
        }

        // Download with progress tracking
        const response = await fetch(data.file_url);
        if (!response.ok) throw new Error('Failed to download file');

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            chunks.push(value);
            received += value.length;
            
            if (total > 0) {
                const progress = Math.round((received / total) * 100);
                downloadingProjects.set(projectId, { progress, status: 'downloading' });
                downloadingProjects = downloadingProjects; // Trigger reactivity
            }
        }

        // Combine chunks
        const allChunks = new Uint8Array(received);
        let position = 0;
        for (const chunk of chunks) {
            allChunks.set(chunk, position);
            position += chunk.length;
        }

        const blob = new Blob([allChunks]);
        
        // Extract filename from URL or use project name as fallback
        const urlParts = data.file_url.split('/');
        const fileName = urlParts[urlParts.length - 1] || `${data.name}.zip`;
        
        return new File([blob], fileName, { type: blob.type });
    }

    function openVideo(videoUrl: string) {
        window.open(videoUrl, '_blank');
    }

    // Note: playProject function removed since caching is disabled
    // Projects are downloaded fresh each time

    function handleSortChange() {
        sortProjects();
    }

    function sortProjects() {
        if (sortBy === 'downloads') {
            filteredProjects = [...filteredProjects].sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
        } else {
            filteredProjects = [...filteredProjects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
    }

    function closeStore() {
        show = false;
        dispatch('close');
    }

    $: if (searchQuery !== undefined) {
        handleSearch();
    }
</script>

{#if show}
    <div class="project-store-overlay" on:click={closeStore}>
        <div class="project-store-modal" on:click|stopPropagation>
            <div class="modal-header">
                <h2>{$t('sidebar.project_store_title')}</h2>
                <button class="close-button" on:click={closeStore}>
                    <Close size={24} />
                </button>
            </div>

            <div class="search-section">
                <div class="search-input-container">
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder={$t('sidebar.search_projects')}
                        bind:value={searchQuery}
                        class="search-input"
                    />
                </div>
                <!-- <div class="sort-container">
                    <select id="sort-select" bind:value={sortBy} on:change={handleSortChange}>
                        <option value="latest">Latest</option>
                        <option value="downloads">Most Downloaded</option>
                    </select>
                </div> -->
            </div>

            {#if error}
                <div class="error-message">{error}</div>
            {/if}

            <div class="projects-container">
                {#if loading}
                    <div class="loading-message">Loading projects...</div>
                {:else if filteredProjects.length === 0}
                    <div class="empty-message">No projects found</div>
                {:else}
                    {#each filteredProjects as project}
                        <div class="project-card">
                            <div class="project-info">
                                <h3 class="project-name">{project.name}</h3>
                                <p class="project-author">by {project.author}</p>
                                <p class="project-description">{project.description}</p>
                                <div class="project-meta">
                                    <!-- <span class="download-count">{project.download_count || 0} {$t('sidebar.downloads')}</span> -->
                                    <!-- {#if project.file_size}
                                        <span class="file-size">{(project.file_size / 1024 / 1024).toFixed(1)} MB</span>
                                    {/if} -->
                                    <span class="created-date">{new Date(project.created_at).toLocaleDateString('en-CA')}</span>
                                </div>
                                {#if project.tags && project.tags.length > 0}
                                    <div class="project-tags">
                                        {#each project.tags as tag}
                                            <span class="tag">{tag}</span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            <div class="project-actions">
                                {#if project.video_url}
                                    <button class="video-button" on:click={() => openVideo(project.video_url)}>
                                        <Video size={20} />
                                    </button>
                                {/if}
                                
                                {#if downloadingProjects.has(project.id)}
                                    {@const downloadInfo = downloadingProjects.get(project.id)}
                                    <div class="download-progress-button">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: {downloadInfo.progress}%"></div>
                                            <div class="progress-text">
                                                {#if downloadInfo.status === 'starting'}
                                                    {$t('sidebar.downloading')}
                                                {:else if downloadInfo.status === 'downloading'}
                                                    {downloadInfo.progress}%
                                                {:else if downloadInfo.status === 'complete'}
                                                    {$t('sidebar.complete')}
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {:else}
                                    <button class="download-button" on:click={() => downloadProject(project)}>
                                        <Download size={20} />
                                        {$t('sidebar.download')}
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .project-store-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .project-store-modal {
        background-color: var(--bg1);
        border-radius: 12px;
        width: min(90vw, 800px);
        height: min(85vh, 700px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--bg3);

        h2 {
            color: var(--text1);
            margin: 0;
            font-size: 24px;
            font-weight: 300;
        }

        .close-button {
            background-color: var(--bg2);
            border: 2px solid var(--bg4);
            color: var(--text2);
            cursor: pointer;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: background-color 0.2s, color 0.2s, border-color 0.2s;

            &:hover {
                background-color: var(--bg3);
                border-color: var(--bg4);
                color: var(--text1);
            }
        }
    }

    .search-section {
        padding: 20px;
        border-bottom: 1px solid var(--bg3);
        display: flex;
        gap: 20px;
        align-items: flex-end;

        .search-input-container {
            flex: 1;
            display: flex;
            align-items: center;
            background-color: var(--bg2);
            border: 2px solid var(--bg3);
            border-radius: 8px;
            padding: 12px;
            gap: 10px;
            color: var(--text2);
            transition: border-color 0.2s;
            height: 48px;
            box-sizing: border-box;

            &:focus-within {
                border-color: var(--bg4);
            }

            .search-input {
                flex: 1;
                background: none;
                border: none;
                color: var(--text1);
                font-size: 16px;
                font-family: 'Roboto', sans-serif;
                outline: none;

                &::placeholder {
                    color: var(--text2);
                }
            }
        }

        .sort-container {
            min-width: 150px;

            select {
                background-color: var(--bg2);
                border: 2px solid var(--bg3);
                border-radius: 8px;
                color: var(--text1);
                font-family: 'Roboto', sans-serif;
                font-size: 16px;
                padding: 12px;
                cursor: pointer;
                outline: none;
                width: 100%;
                height: 48px;
                box-sizing: border-box;
                appearance: none;
                background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23888' d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 12px center;
                background-size: 12px;
                padding-right: 40px;

                &:hover {
                    border-color: var(--bg4);
                }

                &:focus {
                    border-color: var(--bg4);
                }

                option {
                    background-color: var(--bg1);
                    color: var(--text1);
                    padding: 16px 12px;
                    font-family: 'Roboto', sans-serif;
                    font-size: 16px;
                    line-height: 1.5;
                    min-height: 40px;
                }
            }
        }
    }

    .projects-container {
        flex: 1;
        overflow-y: auto;
        padding: 20px;

        // Custom scrollbar styling
        &::-webkit-scrollbar {
            width: 12px;
        }

        &::-webkit-scrollbar-track {
            background: var(--bg2);
            border-radius: 6px;
        }

        &::-webkit-scrollbar-thumb {
            background: var(--bg4);
            border-radius: 6px;
            border: 2px solid var(--bg2);

            &:hover {
                background: var(--text2);
            }
        }

        &::-webkit-scrollbar-thumb:active {
            background: var(--text1);
        }

        // Firefox scrollbar styling
        scrollbar-width: thin;
        scrollbar-color: var(--bg4) var(--bg2);
    }

    .loading-message, .empty-message, .error-message {
        text-align: center;
        color: var(--text2);
        padding: 40px;
        font-size: 18px;
    }

    .error-message {
        color: #ff6b6b;
        background-color: rgba(255, 107, 107, 0.1);
        border-radius: 8px;
        margin: 20px;
    }

    .project-card {
        display: flex;
        flex-direction: column;
        background-color: var(--bg2);
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 16px;
        transition: background-color 0.2s;

        @media (min-width: 768px) {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
        }

        &:hover {
            background-color: var(--bg3);
        }

        .project-info {
            flex: 1;
            
            @media (min-width: 768px) {
                margin-right: 20px;
            }

            .project-name {
                color: var(--text1);
                font-size: 20px;
                font-weight: 400;
                font-family: 'Roboto', sans-serif;
                margin: 0 0 8px 0;
            }

            .project-author {
                color: var(--text2);
                font-size: 14px;
                font-family: 'Roboto', sans-serif;
                font-weight: 300;
                margin: 0 0 12px 0;
            }

            .project-description {
                color: var(--text1);
                font-size: 16px;
                font-family: 'Roboto', sans-serif;
                font-weight: 300;
                line-height: 1.5;
                margin: 0 0 12px 0;
            }

            .project-meta {
                display: flex;
                gap: 20px;
                font-size: 12px;
                font-family: 'Roboto', sans-serif;
                font-weight: 300;
                color: var(--text2);
                margin-bottom: 0px;
                flex-wrap: nowrap;
                align-items: baseline;
                
                span {
                    white-space: nowrap;
                    flex-shrink: 0;
                    line-height: 1;
                    padding: 0;
                    margin: 0;
                }
            }

            .project-tags {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;

                .tag {
                    background-color: var(--bg4);
                    color: var(--text1);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                }
            }
        }

        .project-actions {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-top: 16px;
            
            @media (min-width: 768px) {
                margin-top: 0;
            }
        }

        .download-button, .video-button, .play-button {
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: var(--bg2);
            border: 2px solid var(--bg4);
            color: var(--text1);
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-family: "Roboto Mono", monospace;
            transition: all 0.2s;

            &:hover {
                background-color: var(--bg3);
                border-color: var(--bg4);
            }

            &:active {
                scale: 0.98;
            }
        }

        .download-button {
            height: 44px;
            box-sizing: border-box;
            
            @media (max-width: 767px) {
                flex: 1;
                justify-content: center;
                padding: 0 16px;
            }
        }

        .video-button {
            background-color: var(--bg2);
            border-color: var(--bg4);
            font-family: "Roboto Mono", monospace;
            width: 44px;
            height: 44px;
            justify-content: center;
            padding: 0;
            flex-shrink: 0;
            box-sizing: border-box;

            @media (max-width: 767px) {
                width: 44px;
                height: 44px;
            }

            &:hover {
                background-color: var(--bg3);
                border-color: var(--bg4);
            }
        }

        .play-button {
            background-color: var(--success-bg, #16A34A);
            border-color: var(--success-border, #15803D);
            color: var(--success-text, white);
            font-family: "Roboto Mono", monospace;

            &:hover {
                background-color: var(--success-hover-bg, #15803D);
                border-color: var(--success-hover-border, #166534);
                color: var(--success-hover-text, white);
            }
        }

        .download-progress-button {
            width: 140px; // Same width as download button
            height: 48px; // Same height as download button
            display: flex;
            align-items: center;
            
            @media (max-width: 767px) {
                flex: 1;
            }
            
            .progress-bar {
                width: 100%;
                height: 100%;
                background-color: var(--bg2);
                border: 2px solid var(--bg4);
                border-radius: 8px;
                position: relative;
                overflow: hidden;

                .progress-fill {
                    height: 100%;
                    background: #2563EB;
                    transition: width 0.3s ease;
                    border-radius: 6px;
                }

                .progress-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: var(--text1);
                    font-family: "Roboto Mono", monospace;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 1;
                    pointer-events: none;
                }
            }
        }
    }
</style>