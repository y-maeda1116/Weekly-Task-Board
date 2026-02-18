/**
 * Unit Tests for Statistics Calculation Engine
 * Tests for calculateCategoryTimeAnalysis, calculateDailyWorkTime, and calculateEstimatedVsActualAnalysis
 * 
 * Validates: Requirements 1.3, 1.4, 1.5
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localSto