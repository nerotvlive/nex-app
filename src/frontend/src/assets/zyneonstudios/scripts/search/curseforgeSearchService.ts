import type { SearchService } from "./searchService";
import type { SearchResultItem, GameVersion, LoaderTag, CategoryTag } from "./searchResult";

interface CurseforgeAuthor {
    id: number;
    name: string;
    url: string;
}

interface CurseforgeAttachment {
    id: number;
    modId: number;
    title: string;
    thumbnailUrl: string;
    url: string;
}

interface CurseforgeMod {
    id: number;
    gameId: number;
    name: string;
    slug: string;
    summary: string;
    downloadCount: number;
    authors: CurseforgeAuthor[];
    logo?: CurseforgeAttachment;
    links: {
        websiteUrl: string;
    };
}

interface CurseforgeSearchResponse {
    data: CurseforgeMod[];
    pagination: {
        index: number;
        pageSize: number;
        resultCount: number;
        totalCount: number;
    };
}

export class CurseForgeSearchService implements SearchService {
    public query: string = '';
    public projectType: string = 'modpack';
    public selectedLoaders: string[] = [];
    public selectedVersions: string[] = [];
    public selectedCategories: string[] = [];
    public selectedEnvironments: string[] = [];
    public sort: string = 'desc';

    public loading: boolean = false;
    public hasMore: boolean = true;
    public error: string | null = null;
    public results: SearchResultItem[] = [];

    public gameVersions: GameVersion[] = [];
    public categories: CategoryTag[] = [];
    public loaders: LoaderTag[] = [];

    public limit: number = 24;
    public offset: number = 0;

    async loadFilterOptions(): Promise<void> {
        try {
            const [loaderRes, versionRes, categoryRes] = await Promise.all([
                fetch('https://api.modrinth.com/v2/tag/loader'),
                fetch('https://api.modrinth.com/v2/tag/game_version'),
                fetch('/api/curseforge/categories'),
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

    private mapCurseforgeToSearchResult(mod: CurseforgeMod): SearchResultItem {
        return {
            project_id: String(mod.id),
            slug: mod.slug,
            title: mod.name,
            description: mod.summary,
            author: mod.authors && mod.authors.length > 0
                ? mod.authors.map(a => a.name).join(', ')
                : 'Unknown',
            icon_url: mod.logo?.thumbnailUrl || mod.logo?.url || '',
            downloads: mod.downloadCount,
        } as SearchResultItem;
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

            if (this.selectedLoaders.length > 0) facets.push(this.selectedLoaders.map(l => `modLoaderTypes:${l}`));

            if (this.selectedCategories.length > 0) facets.push(this.selectedCategories.map(c => `categoryIds:${c}`));

            if (this.selectedVersions.length > 0) facets.push(this.selectedVersions.map(v => `gameVersions:${v}`));

            if (this.selectedEnvironments.length > 0) facets.push(this.selectedEnvironments.map(e => `categoryIds:${e}`));


            const params = new URLSearchParams({
                searchFilter: this.query.trim(),
                pageSize: String(this.limit),
                index: String(this.offset),
                sortOrder: this.sort,
                modLoaderTypes: JSON.stringify(this.selectedLoaders),
                facets: JSON.stringify(facets)
            });

            const response = await fetch(`/api/curseforge/search?${params}`);

            if (!response.ok) {
                throw new Error(`Curseforge API error: ${response.statusText}`);
            }

            const data: CurseforgeSearchResponse = await response.json();
            const mappedResults = (data.data || []).map(mod => this.mapCurseforgeToSearchResult(mod));

            this.results.push(...mappedResults);
            this.offset += data.data ? data.data.length : 0;

            if (data.pagination) {
                this.hasMore = this.offset < data.pagination.totalCount;
            } else {
                this.hasMore = false;
            }
        } catch (e: any) {
            this.error = e.message;
        } finally {
            this.loading = false;
        }
    }
}