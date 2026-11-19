import { useRouter } from 'expo-router';

export function useOpenConcert() {
  const router = useRouter();
  return (setlistId: string) =>
    router.push({ pathname: '/(home)/concert/[id]', params: { id: setlistId } });
}
