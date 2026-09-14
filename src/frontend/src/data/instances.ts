export interface InstanceResource {
    background?: string;
    icon?: string;
    logo?: string;
    thumbnail?: string;
}

export interface InstanceVersions {
    fabric?: string;
    forge?: string;
    neoforge?: string;
    quilt?: string;
    minecraft: string;
}

export interface InstanceMeta {
    description: string;
    download: string;
    isEditable: boolean;
    isHidden: boolean;
    forceUpdates: boolean;
    id: string;
    location: string;
    origin: string;
    tags: string[];
    forgeType?: string;
}

export interface InstanceInfo {
    author: string;
    authors: string[];
    description: string;
    name: string;
    summary: string;
    version: string;
}

export interface InstanceWrapper {
    instance: {
        info: InstanceInfo;
        meta: InstanceMeta;
        resources: InstanceResource;
        versions: InstanceVersions;
    };
    scheme: string;
}

export async function fetchInstances(): Promise<InstanceWrapper[]> {
    try {
        const response = await fetch('/api/v1/instances');
        if (!response.ok) throw new Error('Fehler beim Laden');
        return await response.json();
    } catch (error) {
        console.error('Konnte Instanzen nicht laden:', error);
        return [];
    }
}