export interface InstanceItem {
    id: string;
    title: string;
    version: string;
    loader: string;
    icon: string;
}

export const mockInstances: InstanceItem[] = [
    { id: 'essentialplus-latest', title: 'Essential+ Latest', version: '26.2', loader: 'Fabric', icon: 'bi-grid-3x3-gap-fill' },
    { id: 'essentialplus-exploration', title: 'Essential+ Exploration', version: '26.2', loader: 'Fabric', icon: 'bi-grid' },
    { id: 'essentialplus-experimental', title: 'Essential+ Experimental', version: '26.2', loader: 'Fabric', icon: 'bi-lightning-charge-fill' },
    { id: 'essentialplus-beta', title: 'Essential+ Beta', version: '26.2', loader: 'Fabric', icon: 'bi-rocket-fill' },
    { id: 'essentialplus-vr', title: 'Essential+ VR', version: '26.2', loader: 'Fabric', icon: 'bi-vr' },
    { id: 'essentialplus-262', title: 'Essential+ 26.2', version: '26.2', loader: 'Fabric', icon: 'bi-airplane' },
    { id: 'essentialplus-261', title: 'Essential+ 26.1', version: '26.1', loader: 'Fabric', icon: 'bi-backpack' },
    { id: 'essentialplus-121', title: 'Essential+ 1.21', version: '1.21.11', loader: 'Fabric', icon: 'bi-alarm' },
    { id: 'essentialplus-121', title: 'Essential+ 1.20', version: '1.20.4', loader: 'Fabric', icon: 'bi-arrow-through-heart-fill' },
    { id: 'essentialplus-121', title: 'Essential+ 1.19', version: '1.19.5', loader: 'Fabric', icon: 'bi-asterisk' },
    { id: 'essentialplus-121', title: 'Essential+ 1.18', version: '1.18.2', loader: 'Fabric', icon: 'bi-award' },
    { id: 'essentialplus-121', title: 'Essential+ 1.17', version: '1.17.1', loader: 'Fabric', icon: 'bi-ban-fill' },
    { id: 'essentialplus-121', title: 'Essential+ 1.16', version: '1.16.5', loader: 'Fabric', icon: 'bi-bank' },
];