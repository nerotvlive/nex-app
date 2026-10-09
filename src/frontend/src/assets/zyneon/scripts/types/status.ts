import {ref} from "vue";
import {ZyneonSettings} from "../settings.ts";

export interface ApplicationStatus {
  service: string
  status: string
  dev: boolean;
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
  dev: true,
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
  let applicationStatus_: ApplicationStatus = dummyApplicationStatus;
  try {
    const response = await fetch('/api/status');
    if (!response.ok) throw new Error('Could not get application status');
    applicationStatus_ = await response.json();
  } catch (error) {
    console.error('Could not load application status:', error);
  }
  console.log('Application status:', applicationStatus_);
  if(applicationStatus_.dev) {
    ZyneonSettings.setDev(true);
  }
  return applicationStatus_;
}