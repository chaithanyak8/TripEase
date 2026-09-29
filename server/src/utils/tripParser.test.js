import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTripRequest } from './tripParser.js';
import { buildIndiaDestinationCatalog } from '../../../shared/indiaTravelCatalog.js';

const destinations = [
  { id: 'dest-udupi-karnataka', name: 'Udupi & Coastal Karnataka', state: 'Karnataka', tags: ['coastal', 'foodie'] },
  { id: 'dest-divar-goa', name: 'Divar Island Heritage Haven', state: 'Goa', tags: ['heritage', 'beach'] },
  { id: 'dest-coorg-karnataka', name: 'Coorg (Kodagu) Mist & Coffee Trails', state: 'Karnataka', tags: ['coffee', 'hills'] }
];
const indiaDestinations = [...destinations, ...buildIndiaDestinationCatalog()];

test('parses origin and destination from natural language', () => {
  const result = parseTripRequest({
    naturalLanguageQuery: 'Plan a 3-day trip from Bengaluru to Goa under ₹12000 for 2 people with beaches and adventure',
    destinationName: '',
    durationDays: 3,
    travelers: 2,
    budget: 15000
  }, destinations);

  assert.equal(result.origin, 'Bengaluru');
  assert.equal(result.destinationName, 'Goa');
  assert.equal(result.budget, 12000);
  assert.equal(result.durationDays, 3);
  assert.equal(result.travelers, 2);
});

test('keeps explicit destination and origin when provided', () => {
  const result = parseTripRequest({
    naturalLanguageQuery: 'I want a relaxed trip',
    origin: 'Hyderabad',
    destinationName: 'Coorg',
    durationDays: 4,
    travelers: 3,
    budget: 20000
  }, destinations);

  assert.equal(result.origin, 'Hyderabad');
  assert.equal(result.destinationName, 'Coorg');
  assert.equal(result.durationDays, 4);
  assert.equal(result.travelers, 3);
  assert.equal(result.budget, 20000);
});

test('does not default unknown destinations to a dataset fallback and parses budget values correctly', () => {
  const result = parseTripRequest({
    naturalLanguageQuery: 'Plan a 2-day trip from Bengaluru to Kashmir Valley under ₹15,000 for 2 people',
    destinationName: '',
    durationDays: 2,
    travelers: 2,
    budget: 15000
  }, destinations);

  assert.equal(result.origin, 'Bengaluru');
  assert.equal(result.destinationName, 'Kashmir Valley');
  assert.equal(result.durationDays, 2);
  assert.equal(result.travelers, 2);
  assert.equal(result.budget, 15000);
  assert.equal(result.destination, null);
});

test('normalizes short k notation and comma budget values', () => {
  const result = parseTripRequest({
    naturalLanguageQuery: 'Plan a 3-day trip to Coorg under ₹20k for 2 people',
    destinationName: 'Coorg',
    durationDays: 3,
    travelers: 2,
    budget: 20000
  }, destinations);

  assert.equal(result.destinationName, 'Coorg');
  assert.equal(result.budget, 20000);
});

test('parses bare k and comma-formatted budgets without treating people count as budget', () => {
  const shortBudget = parseTripRequest({
    naturalLanguageQuery: 'Plan a 5-day trip to Kerala for 4 people 15k',
    destinationName: 'Kerala',
    durationDays: 5,
    travelers: 4,
    budget: 10000
  }, destinations);
  const commaBudget = parseTripRequest({
    naturalLanguageQuery: 'Plan a 2-day trip to Goa for 2 people 15,000',
    destinationName: 'Goa',
    durationDays: 2,
    travelers: 2,
    budget: 10000
  }, destinations);

  assert.equal(shortBudget.budget, 15000);
  assert.equal(commaBudget.budget, 15000);
});

test('parses natural visit phrases, state names, and Mangalore aliases with an explicit origin', () => {
  const kerala = parseTripRequest({
    naturalLanguageQuery: 'I want to visit Kerala for 5 days with a budget of ₹20,000',
    origin: 'Bengaluru',
    durationDays: 3,
    travelers: 2,
    budget: 10000
  }, indiaDestinations);
  const mangalore = parseTripRequest({
    naturalLanguageQuery: 'Plan a 3 day trip to Mangalore for 2 people',
    origin: 'Mysore',
    durationDays: 3,
    travelers: 2,
    budget: 10000
  }, indiaDestinations);
  const goa = parseTripRequest({
    naturalLanguageQuery: 'I have ₹10,000 and want to visit Goa',
    origin: 'Bengaluru',
    durationDays: 3,
    travelers: 2,
    budget: 10000
  }, indiaDestinations);

  assert.equal(kerala.destinationName, 'Kerala');
  assert.equal(kerala.durationDays, 5);
  assert.equal(kerala.budget, 20000);
  assert.equal(mangalore.destinationName, 'Mangalore');
  assert.equal(mangalore.destination?.name, 'Mangaluru');
  assert.equal(goa.destinationName, 'Goa');
  assert.equal(goa.budget, 10000);
});
