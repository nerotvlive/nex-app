export interface InstanceItem {
    id: string;
    title: string;
    description: string;
    version: string;
    loader: string;
    icon: string;
}

export const mockInstances: InstanceItem[] = [
    { id: 'essentialplus-latest', title: 'Essential+ Latest', description: 'The latest version of Essential+', version: '26.2', loader: 'Fabric', icon: 'bi-grid-3x3-gap-fill' },
    { id: 'essentialplus-exploration', title: 'Essential+ Exploration', description: 'An exploration-focused version of Essential+', version: '26.2', loader: 'Fabric', icon: 'bi-grid' },
    { id: 'essentialplus-experimental', title: 'Essential+ Experimental', description: 'A snapshot version of Essential+', version: '26.2', loader: 'Fabric', icon: 'bi-lightning-charge-fill' },
    { id: 'essentialplus-beta', title: 'Essential+ Beta', description: 'A beta version of Essential+', version: '26.2', loader: 'Fabric', icon: 'bi-rocket-fill' },
    { id: 'essentialplus-vr', title: 'Essential+ VR', description: 'A VR version of Essential+', version: '26.2', loader: 'Fabric', icon: 'bi-vr' },
    { id: 'essentialplus-262', title: 'Essential+ 26.2', description: 'Version 26.2 of Essential+', version: '26.2', loader: 'Fabric', icon: 'bi-airplane' },
    { id: 'essentialplus-261', title: 'Essential+ 26.1', description: 'Version 26.1 of Essential+', version: '26.1', loader: 'Fabric', icon: 'bi-backpack' },
    { id: 'essentialplus-121', title: 'Essential+ 1.21', description: 'Version 1.21 of Essential+', version: '1.21.11', loader: 'Fabric', icon: 'bi-alarm' },
    { id: 'essentialplus-121', title: 'Essential+ 1.20', description: 'Version 1.20 of Essential+', version: '1.20.4', loader: 'Fabric', icon: 'bi-arrow-through-heart-fill' },
    { id: 'essentialplus-121', title: 'Essential+ 1.19', description: 'Version 1.19 of Essential+', version: '1.19.5', loader: 'Fabric', icon: 'bi-asterisk' },
    { id: 'essentialplus-121', title: 'Essential+ 1.18', description: 'Version 1.18 of Essential+', version: '1.18.2', loader: 'Fabric', icon: 'bi-award' },
    { id: 'essentialplus-121', title: 'Essential+ 1.17', description: 'Version 1.17 of Essential+', version: '1.17.1', loader: 'Fabric', icon: 'bi-ban-fill' },
    { id: 'essentialplus-121', title: 'Essential+ 1.16', description: 'Version 1.16 of Essential+', version: '1.16.5', loader: 'Fabric', icon: 'bi-bank' },
];