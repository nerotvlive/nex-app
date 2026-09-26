import {ref} from "vue";

export interface ApplicationStatus {
  service: string
  status: string
  system: {
    os: {
      name: string;
      version: string;
      arch: string;
    }
  },
  version: {
    build: string;
    name: string;
    number: string;
    type: string;
  };
  scheme: string;
}

const dummyApplicationStatus = {
  service: 'NEX App UI (offline)',
  status: 'error',
  system: {
    os: {
      name: '/',
      version: '/',
      arch: '/'
    }
  },
  version: {
    build: 'web-static',
    name: 'Backend not connected',
    number: '',
    type: 'no-backend'
  },
  scheme: '2026.09'
};

const applicationStatus = ref<ApplicationStatus>(dummyApplicationStatus);
export async function getApplicationStatus(): Promise<ApplicationStatus> {
  if(applicationStatus.value.status === 'error') {
    applicationStatus.value = await fetchApplicationStatus();
  }
  return applicationStatus.value;
}


async function fetchApplicationStatus(): Promise<ApplicationStatus> {
  try {
    const response = await fetch('/api/v1/status');
    if (!response.ok) throw new Error('Could not get application status');
    return await response.json();
  } catch (error) {
    console.error('Could not load application status:', error);
    return dummyApplicationStatus;
  }
}