/** FSettings › Guides: static how-to pages. Copy lives under settings.guides.<id>. */
export const GUIDES = ['grayscale', 'audit', 'zones'] as const;
export type GuideId = (typeof GUIDES)[number];
