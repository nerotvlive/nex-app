import type { SearchService } from "./searchService";
import type { SearchResultItem, GameVersion, LoaderTag, CategoryTag, SearchResponse } from "./searchResult";

export class ModrinthSearchService implements SearchService {
    public query: string = '';
    public projectType: string = 'modpack';
    public selectedLoaders: string[] = [];
    public selectedVersions: string[] = [];
    public selectedCategories: string[] = [];
    public selectedEnvironments: string[] = [];
    public sort: string = 'relevance';

    public loading: boolean = false;
    public hasMore: boolean = true;
    public error: string | null = null;
    public results: SearchResultItem[] = [];

    public gameVersions: GameVersion[] = [];
    public categories: CategoryTag[] = [];
    public loaders: LoaderTag[] = [];

    private limit: number = 24;
    private offset: number = 0;

    async loadFilterOptions(): Promise<void> {
        try {
            const [loaderRes, versionRes, categoryRes] = await Promise.all([
                fetch('https://api.modrinth.com/v2/tag/loader'),
                fetch('https://api.modrinth.com/v2/tag/game_version'),
                fetch('https://api.modrinth.com/v2/tag/category'),
            ]);

            this.loaders = await loaderRes.json();
            this.categories = await categoryRes.json();
            const versions: GameVersion[] = await versionRes.json();
            this.gameVersions = versions.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
        } catch (err: any) {
            this.error = err.message;
        }
    }

    setProjectType(type: string): void {
        this.projectType = type;
        this.selectedLoaders = [];
        this.selectedCategories = [];
    }

    resetFilters(): void {
        this.selectedLoaders = [];
        this.selectedVersions = [];
        this.selectedCategories = [];
        this.selectedEnvironments = [];
    }

    setLimit(limit: number) {
        this.limit = limit;
    }

    setOffset(offset: number) {
        this.offset = offset;
    }

    async search(loadMore: boolean = false): Promise<void> {
        if (this.loading || (loadMore && !this.hasMore)) return;

        if (!loadMore) {
            this.offset = 0;
            this.results = [];
            this.hasMore = true;
        }

        this.loading = true;
        this.error = null;

        try {
            const facets: string[][] = [];
            if (this.projectType) facets.push([`project_type:${this.projectType}`]);
            if (this.selectedLoaders.length > 0) facets.push(this.selectedLoaders.map(l => `categories:${l}`));
            if (this.selectedCategories.length > 0) facets.push(this.selectedCategories.map(c => `categories:${c}`));
            if (this.selectedVersions.length > 0) facets.push(this.selectedVersions.map(v => `versions:${v}`));
            if (this.selectedEnvironments.length > 0) facets.push(this.selectedEnvironments.map(e => `environment:${e}`));

            const params = new URLSearchParams({
                query: this.query.trim(),
                limit: String(this.limit),
                offset: String(this.offset),
                index: this.sort,
                facets: JSON.stringify(facets)
            });

            const response = await fetch(`https://api.modrinth.com/v2/search?${params}`);
            const data: SearchResponse = await response.json();

            this.results.push(...data.hits);
            this.offset += data.hits.length;
            this.hasMore = this.offset < data.total_hits;
        } catch (e: any) {
            this.error = e.message;
        } finally {
            this.loading = false;
        }
    }
}