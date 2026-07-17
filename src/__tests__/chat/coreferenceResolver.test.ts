jest.mock('@react-native-ai/apple', () => ({
  apple: Object.assign(
    jest.fn(() => ({ modelId: 'apple-on-device' })),
    { isAvailable: jest.fn() },
  ),
}));
jest.mock('ai', () => ({ generateObject: jest.fn() }));

import { apple } from '@react-native-ai/apple';
import { generateObject } from 'ai';
import { resolveReferences } from '@/services/chat/coreferenceResolver';

const mockIsAvailable = apple.isAvailable as jest.Mock;
const mockGenerateObject = generateObject as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('resolveReferences', () => {
  it('returns null without calling the model when it is unavailable', async () => {
    mockIsAvailable.mockReturnValue(false);

    const result = await resolveReferences('when did i see them that year', {
      artist: { mbid: 'a1', name: 'Foo Fighters' },
      year: '2019',
    });

    expect(result).toBeNull();
    expect(mockGenerateObject).not.toHaveBeenCalled();
  });

  it('returns null without calling the model when there is no context to resolve against', async () => {
    mockIsAvailable.mockReturnValue(true);

    const result = await resolveReferences('when did i see them that year', {});

    expect(result).toBeNull();
    expect(mockGenerateObject).not.toHaveBeenCalled();
  });

  it('resolves artist/year context, falling back to the remembered artist when the model omits it', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateObject.mockResolvedValue({
      object: { intent: 'artist_seen_in_year', artist: 'null', year: 2021 },
    });

    const result = await resolveReferences('what about in 2021?', {
      artist: { mbid: 'a1', name: 'Foo Fighters' },
      year: '2019',
    });

    expect(result).toEqual({ artist: 'Foo Fighters', year: '2021' });
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Known context: artist=Foo Fighters, year=2019.\nUser message: what about in 2021?',
      }),
    );
  });

  it('resolves city/year context, falling back to the remembered year when the model omits it', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateObject.mockResolvedValue({
      object: { intent: 'x', city: 'Paris', year: 0 },
    });

    const result = await resolveReferences('how about paris instead?', {
      city: { id: 'c1', name: 'Berlin' },
      year: '2019',
    });

    expect(result).toEqual({ city: 'Paris', year: '2019' });
  });

  it('resolves country-only context via "there"', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateObject.mockResolvedValue({ object: { intent: 'x', country: 'Mexico' } });

    const result = await resolveReferences('how many shows have i seen there?', {
      country: { code: 'MX', name: 'Mexico' },
    });

    expect(result).toEqual({ country: 'Mexico' });
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Known context: country=Mexico.\nUser message: how many shows have i seen there?',
      }),
    );
  });

  it('prefers artist context over city/country when both are somehow present', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateObject.mockResolvedValue({
      object: { intent: 'x', artist: 'Foo Fighters', year: 2019 },
    });

    await resolveReferences('when did i see them that year', {
      artist: { mbid: 'a1', name: 'Foo Fighters' },
      city: { id: 'c1', name: 'Berlin' },
    });

    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: expect.stringContaining('artist=Foo Fighters') }),
    );
  });

  it('returns null when the model call throws (guardrail rejection or any other error)', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateObject.mockRejectedValue(new Error('guardrailViolation'));

    const result = await resolveReferences('did i see bad religion', {
      artist: { mbid: 'a1', name: 'Bad Religion' },
    });

    expect(result).toBeNull();
  });
});
