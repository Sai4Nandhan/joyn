import { query } from 'express-validator';
import { ACTIVITY_CATEGORIES } from '../models/Activity.js';

export const discoverValidator = [
  query('lat').optional({ checkFalsy: true }).custom((val) => {
    if (val === undefined || val === null || val === '') return true;
    if (isNaN(Number(val)) || Number(val) < -90 || Number(val) > 90) {
      throw new Error('Invalid latitude (-90 to 90)');
    }
    return true;
  }),
  query('lng').optional({ checkFalsy: true }).custom((val) => {
    if (val === undefined || val === null || val === '') return true;
    if (isNaN(Number(val)) || Number(val) < -180 || Number(val) > 180) {
      throw new Error('Invalid longitude (-180 to 180)');
    }
    return true;
  }),
  query('radiusKm').optional({ checkFalsy: true }).custom((val) => {
    if (val === undefined || val === null || val === '') return true;
    if (isNaN(Number(val)) || Number(val) < 1 || Number(val) > 1000) {
      throw new Error('Invalid radius (1-1000km)');
    }
    return true;
  }),
  query('category').optional({ checkFalsy: true }).custom(() => true),
  query('search').optional({ checkFalsy: true }).custom(() => true),
  query('location').optional({ checkFalsy: true }).custom(() => true),
  query('page').optional({ checkFalsy: true }).custom(() => true),
  query('limit').optional({ checkFalsy: true }).custom(() => true),
];
