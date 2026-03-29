import { mockProfile } from '../mocks/data';
import type { Profile } from '../types/api';
import { api } from './api';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function fetchProfile(): Promise<Profile> {
  if (useMock) {
    await delay(650);
    return mockProfile;
  }
  const { data } = await api.get<Profile>('/profile');
  return data;
}
