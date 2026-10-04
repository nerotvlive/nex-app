import type { SearchResultItem, GameVersion, LoaderTag, CategoryTag } from "./searchResult";

export interface SearchEnvironmentOption {
    id: string;
    label: string;
}

export interface SearchService {
    query: string;
    projectType: string;
    selectedLoaders: string[];
    selectedVersions: string[];
    selectedCategories: string[];
    selectedEnvironments: string[];
    sort: string;

    loading: boolean;
    hasMore: boolean;
    error: string | null;
    results: SearchResultItem[];

    gameVersions: GameVersion[];
    categories: CategoryTag[];
    loaders: LoaderTag[];

    loadFilterOptions(): Promise<void>;
    search(loadMore?: boolean): Promise<void>;
    setProjectType(type: string): void;
    setLimit(limit: number): void;
    setOffset(offset: number): void;
    resetFilters(): void;
}