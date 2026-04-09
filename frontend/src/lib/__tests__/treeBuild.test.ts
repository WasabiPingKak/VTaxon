import { describe, it, expect } from 'vitest';
import { buildTree, buildFictionalTree } from '../tree';
import { realEntry, fictionalEntry } from './fixtures';

describe('buildTree', () => {
  it('returns root node for empty entries', () => {
    const tree = buildTree([]);
    expect(tree.name).toBe('Life');
    expect(tree.count).toBe(0);
    expect(tree.children.size).toBe(0);
  });

  it('builds hierarchy from single entry', () => {
    const entries = [realEntry('u1', 'Animalia|Chordata|Mammalia')];
    const tree = buildTree(entries);

    expect(tree.count).toBe(1);
    expect(tree.children.has('Animalia')).toBe(true);

    const animalia = tree.children.get('Animalia')!;
    expect(animalia.rank).toBe('KINGDOM');
    expect(animalia.pathKey).toBe('Animalia');
    expect(animalia.count).toBe(1);

    const chordata = animalia.children.get('Chordata')!;
    expect(chordata.rank).toBe('PHYLUM');
    expect(chordata.pathKey).toBe('Animalia|Chordata');

    const mammalia = chordata.children.get('Mammalia')!;
    expect(mammalia.rank).toBe('CLASS');
    expect(mammalia.vtubers).toHaveLength(1);
  });

  it('merges entries sharing the same path prefix', () => {
    const entries = [
      realEntry('u1', 'Animalia|Chordata|Mammalia'),
      realEntry('u2', 'Animalia|Chordata|Aves'),
    ];
    const tree = buildTree(entries);

    expect(tree.count).toBe(2);
    const chordata = tree.children.get('Animalia')!.children.get('Chordata')!;
    expect(chordata.count).toBe(2);
    expect(chordata.children.size).toBe(2);
  });

  it('creates breed sub-nodes', () => {
    const entries = [
      realEntry('u1', 'Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis lupus familiaris', {
        breed_id: 42,
        breed_name: 'Shiba Inu',
        breed_name_en: 'Shiba Inu',
        breed_name_zh: '柴犬',
      }),
    ];
    const tree = buildTree(entries);

    let node = tree;
    for (const part of ['Animalia', 'Chordata', 'Mammalia', 'Carnivora', 'Canidae', 'Canis', 'Canis lupus familiaris']) {
      node = node.children.get(part)!;
    }

    expect(node.children.has('__breed__42')).toBe(true);
    const breedNode = node.children.get('__breed__42')!;
    expect(breedNode.rank).toBe('BREED');
    expect(breedNode.nameZh).toBe('柴犬');
    expect(breedNode.vtubers).toHaveLength(1);
    expect(node.vtubers).toHaveLength(0);
  });

  it('applies path_zh for Chinese names', () => {
    const entries = [
      realEntry('u1', 'Animalia|Chordata', {
        path_zh: { kingdom: '動物界', phylum: '脊索動物門' },
      }),
    ];
    const tree = buildTree(entries);
    expect(tree.children.get('Animalia')!.nameZh).toBe('動物界');
    expect(tree.children.get('Animalia')!.children.get('Chordata')!.nameZh).toBe('脊索動物門');
  });

  it('strips author citations from species-level path parts', () => {
    const entries = [
      realEntry('u1', 'Animalia|Chordata|Mammalia|Carnivora|Canidae|Vulpes|Vulpes zerda (Zimmermann, 1780)'),
    ];
    const tree = buildTree(entries);

    let node = tree;
    for (const part of ['Animalia', 'Chordata', 'Mammalia', 'Carnivora', 'Canidae', 'Vulpes']) {
      node = node.children.get(part)!;
    }
    expect(node.children.has('Vulpes zerda')).toBe(true);
    expect(node.children.get('Vulpes zerda')!.name).toBe('Vulpes zerda');
  });
});

describe('buildFictionalTree', () => {
  it('returns root for empty entries', () => {
    const tree = buildFictionalTree([]);
    expect(tree.name).toBe('Fictional');
    expect(tree.count).toBe(0);
  });

  it('builds fictional hierarchy', () => {
    const entries = [
      fictionalEntry('u1', 'Western Mythology|Norse Mythology|Dragon', {
        origin: '西方神話',
        sub_origin: '北歐神話',
        fictional_name_zh: '龍',
      }),
    ];
    const tree = buildFictionalTree(entries);

    expect(tree.count).toBe(1);
    const origin = tree.children.get('Western Mythology')!;
    expect(origin.rank).toBe('F_ORIGIN');
    expect(origin.nameZh).toBe('西方神話');

    const sub = origin.children.get('Norse Mythology')!;
    expect(sub.rank).toBe('F_SUB_ORIGIN');
    expect(sub.nameZh).toBe('北歐神話');

    const species = sub.children.get('Dragon')!;
    expect(species.rank).toBe('F_SPECIES');
    expect(species.nameZh).toBe('龍');
    expect(species.vtubers).toHaveLength(1);
  });
});
