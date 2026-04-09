import { describe, it, expect } from 'vitest';
import { buildTree, findNode } from '../tree';
import { realEntry } from './fixtures';

describe('findNode', () => {
  const entries = [realEntry('u1', 'Animalia|Chordata|Mammalia')];

  it('finds root', () => {
    const tree = buildTree(entries);
    expect(findNode(tree, '')).toBe(tree);
  });

  it('finds intermediate node', () => {
    const tree = buildTree(entries);
    const found = findNode(tree, 'Animalia|Chordata');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Chordata');
  });

  it('finds leaf node', () => {
    const tree = buildTree(entries);
    const found = findNode(tree, 'Animalia|Chordata|Mammalia');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Mammalia');
  });

  it('returns null for non-existent path', () => {
    const tree = buildTree(entries);
    expect(findNode(tree, 'Animalia|Arthropoda')).toBeNull();
  });
});
