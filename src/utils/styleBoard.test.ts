import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterDirections,
  toggleLikedId,
  buildSelectionSummary,
  type StyleDirection,
} from './styleBoard';

const SAMPLE: StyleDirection[] = [
  {
    id: 'sunset',
    number: '01',
    slug: 'sun-bleached-caribbean',
    title: 'Золотой закат',
    category: 'classic',
    lineage: 'Близко к Корсарам',
    imageSrc: '/a.jpg',
    imageAlt: 'a',
    rule: 'r',
    mood: 'm',
    shape: 's',
    colorSummary: 'c',
    webglNotes: 'w',
    pros: ['p1'],
    cons: ['c1'],
    palette: [{ hex: '#133142', role: 'Море' }],
  },
  {
    id: 'engraving',
    number: '02',
    slug: 'nautical-engraving',
    title: 'Сургучная гравюра',
    category: 'bold',
    lineage: 'Из старинных карт',
    imageSrc: '/b.jpg',
    imageAlt: 'b',
    rule: 'r',
    mood: 'm',
    shape: 's',
    colorSummary: 'c',
    webglNotes: 'w',
    pros: ['p2'],
    cons: ['c2'],
    palette: [{ hex: '#EFE4CE', role: 'Пергамент' }],
  },
];

test('filterDirections filters by category and preserves order on all', () => {
  assert.equal(filterDirections(SAMPLE, 'all').length, 2);
  assert.deepEqual(
    filterDirections(SAMPLE, 'bold').map((d) => d.id),
    ['engraving']
  );
  assert.deepEqual(filterDirections(SAMPLE, 'stylized'), []);
});

test('toggleLikedId adds and removes IDs cleanly', () => {
  const added = toggleLikedId([], 'sunset');
  assert.deepEqual(added, ['sunset']);
  const addedTwo = toggleLikedId(added, 'engraving');
  assert.deepEqual(addedTwo, ['sunset', 'engraving']);
  const removed = toggleLikedId(addedTwo, 'sunset');
  assert.deepEqual(removed, ['engraving']);
});

test('buildSelectionSummary formats primary choice, liked mix, and user note', () => {
  const summary = buildSelectionSummary(
    SAMPLE,
    'engraving',
    ['sunset', 'engraving'],
    'Воду взять из 01'
  );
  assert.equal(
    summary,
    'Выбираю стиль 02: «Сургучная гравюра». Также нравятся элементы из: «Золотой закат» (01). Пожелание: Воду взять из 01'
  );
});
