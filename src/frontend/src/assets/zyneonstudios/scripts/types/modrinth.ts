export type ProjectType =
    | 'mod'
    | 'modpack'
    | 'resourcepack'
    | 'shader'
    | 'datapack'
    | 'plugin';

export interface CategoryTag {
    icon: string;
    name: string;
    project_type: ProjectType;
    header: string;
}

export interface LoaderTag {
    name: string;
    icon: string;
    supported_project_types: string[];
}

export interface GameVersion {
    version: string;
    version_type: 'release' | 'snapshot' | 'alpha' | 'beta';
    date: string;
    major: boolean;
}

export interface SearchResultItem {
    project_id: string;
    project_type: ProjectType;
    slug: string;
    author: string;
    title: string;
    description: string;
    categories: string[];
    versions: string[];
    downloads: number;
    follows: number;
    icon_url: string | null;
    date_created: string;
    date_modified: string;
    latest_version: string;
    license: string;
}

export interface SearchResponse {
    hits: SearchResultItem[];
    offset: number;
    limit: number;
    total_hits: number;
}