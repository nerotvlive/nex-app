export interface InstanceItem {
    id: string;
    title: string;
    version: string;
    loader: string;
    icon: string;
}

export const mockInstances: InstanceItem[] = [
    { id: 'essential-exploration', title: 'Essential+ Exploration', version: '1.21', loader: 'Fabric', icon: 'bi-grid-3x3-gap-fill' },
    { id: 'vanilla-plus', title: 'Vanilla+ Performance', version: '1.21.1', loader: 'NeoForge', icon: 'bi-lightning-charge' },
    { id: 'pvp-master', title: 'PvP Combat Pack', version: '1.8.9', loader: 'Forge', icon: 'bi-controller' },
];